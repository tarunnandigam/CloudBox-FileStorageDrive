package com.cloudbox.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.awscore.AwsRequestOverrideConfiguration;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;


import java.io.IOException;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.time.Duration;
import java.time.Instant;
import java.util.logging.Logger;

@Service
public class S3Service {

    @Autowired
    private S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    private static final long MAX_STORAGE = 1024L * 1024L * 1024L;
    private static final String QUOTA_LOCK_SUFFIX = ".cloudbox-quota-lock";
    private static final Duration QUOTA_LOCK_TTL = Duration.ofMinutes(10);
    private static final Logger LOGGER = Logger.getLogger(S3Service.class.getName());

    public List<String> uploadFiles(MultipartFile[] files, String userId, String folderPath) throws IOException {
        long totalSize = Arrays.stream(files).mapToLong(MultipartFile::getSize).sum();
        String lockKey = quotaLockKey(userId);
        acquireQuotaLock(lockKey);
        List<String> uploadedKeys = new ArrayList<>();
        try {
            if (getUserStorageUsage(userId) + totalSize > MAX_STORAGE) {
                throw new IOException("Storage limit exceeded. Maximum 1GB allowed.");
            }
            for (MultipartFile file : files) {
                uploadedKeys.add(uploadFile(file, userId, folderPath));
            }
            return uploadedKeys;
        } catch (Exception exception) {
            for (String key : uploadedKeys) {
                try {
                    deleteFile(userId, key);
                } catch (RuntimeException cleanupException) {
                    exception.addSuppressed(cleanupException);
                }
            }
            if (exception instanceof IOException ioException) {
                throw ioException;
            }
            throw new IOException("Failed to upload files", exception);
        } finally {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucketName).key(lockKey).build());
            } catch (RuntimeException releaseException) {
                LOGGER.warning("Unable to release quota lock: " + releaseException.getMessage());
            }
        }
    }

    public void migrateLegacyFiles(String legacyUserId, String userId) {
        if (legacyUserId == null || legacyUserId.isBlank() || legacyUserId.equals(userId)) {
            return;
        }
        String sourcePrefix = legacyUserId + "/";
        ListObjectsV2Request request = ListObjectsV2Request.builder()
                .bucket(bucketName).prefix(sourcePrefix).build();
        boolean truncated;
        do {
            ListObjectsV2Response response = s3Client.listObjectsV2(request);
            for (S3Object object : response.contents()) {
                if (object.key().equals(quotaLockKey(legacyUserId))) {
                    continue;
                }
                String destinationKey = userId + object.key().substring(legacyUserId.length());
                s3Client.copyObject(CopyObjectRequest.builder().bucket(bucketName)
                        .copySource(bucketName + "/" + object.key()).key(destinationKey).build());
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucketName)
                        .key(object.key()).build());
            }
            truncated = response.isTruncated();
            request = request.toBuilder().continuationToken(response.nextContinuationToken()).build();
        } while (truncated);
    }

    public String uploadFile(MultipartFile file, String userId, String folderPath) throws IOException {
        try {
            validatePath(folderPath);
            String s3Key = userId + "/";
            if (folderPath != null && !folderPath.isEmpty()) {
                s3Key += folderPath + "/";
            }
            String filename = file.getOriginalFilename() == null ? "unnamed-file" :
                    file.getOriginalFilename().replace('\\', '/');
            filename = filename.substring(filename.lastIndexOf('/') + 1).replaceAll("[\\r\\n]", "_");
            if (filename.isBlank()) {
                filename = "unnamed-file";
            }
            s3Key += UUID.randomUUID() + "_" + filename;
            
            
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return s3Key;
        } catch (Exception e) {
            throw new IOException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    public void createFolder(String userId, String folderPath) {
        try {
            validatePath(folderPath);
            String s3Key = userId + "/" + folderPath + "/";
            
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(new byte[0]));
        } catch (Exception e) {
            throw new RuntimeException("Failed to create folder in S3: " + e.getMessage(), e);
        }
    }

    public void deleteFolder(String userId, String folderPath) {
        try {
            validatePath(folderPath);
            String prefix = userId + "/" + folderPath;
            if (!prefix.endsWith("/")) {
                prefix += "/";
            }
            System.out.println("S3Service: Deleting folder with prefix: " + prefix);
            System.out.println("S3Service: Bucket: " + bucketName);
            
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();

            ListObjectsV2Response listResponse;
            boolean objectsFound = false;

            do {
                listResponse = s3Client.listObjectsV2(listRequest);
                System.out.println("S3Service: Found " + listResponse.contents().size() + " objects to delete in this batch");
                
                if (!listResponse.contents().isEmpty()) {
                    objectsFound = true;
                }
                
                for (S3Object object : listResponse.contents()) {
                    if (object.key().equals(quotaLockKey(userId))) {
                        continue;
                    }
                    System.out.println("S3Service: Attempting to delete: " + object.key());
                    try {
                        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                                .bucket(bucketName)
                                .key(object.key())
                                .build();
                        s3Client.deleteObject(deleteRequest);
                        System.out.println("S3Service: Successfully deleted: " + object.key());
                    } catch (Exception deleteError) {
                        System.err.println("S3Service: Failed to delete " + object.key() + ": " + deleteError.getMessage());
                        throw deleteError;
                    }
                }

                listRequest = listRequest.toBuilder()
                        .continuationToken(listResponse.nextContinuationToken())
                        .build();

            } while (listResponse.isTruncated());

            if (!objectsFound) {
                System.out.println("S3Service: WARNING - No objects found with prefix: " + prefix);
                System.out.println("S3Service: This might mean the folder doesn't exist or path is incorrect");
            } else {
                System.out.println("S3Service: Folder deletion completed successfully");
            }
            
        } catch (Exception e) {
            System.err.println("S3Service: Failed to delete folder - " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete folder from S3: " + e.getMessage(), e);
        }
    }
    
    public Map<String, Object> listFiles(String userId, String folderPath) {
        try {
            validatePath(folderPath);
            String prefix = userId + "/";
            if (folderPath != null && !folderPath.isEmpty()) {
                prefix += folderPath + "/";
            }
            
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .delimiter("/")
                    .build();

            List<Map<String, Object>> files = new ArrayList<>();
            List<Map<String, Object>> folders = new ArrayList<>();
            
            int fileId = 1;
            int folderId = 1;
            
            ListObjectsV2Response listResponse;
            do {
                listResponse = s3Client.listObjectsV2(listRequest);
                
                // Process files
                for (S3Object object : listResponse.contents()) {
                    if (!object.key().endsWith("/") && !object.key().equals(prefix)
                            && !object.key().equals(quotaLockKey(userId))) {
                        Map<String, Object> fileInfo = new HashMap<>();
                        String fileName = object.key().substring(object.key().lastIndexOf("/") + 1);
                        fileInfo.put("id", fileId++);
                        fileInfo.put("name", fileName);
                        fileInfo.put("size", formatFileSize(object.size()));
                        fileInfo.put("modified", object.lastModified().toString());
                        fileInfo.put("type", "file");
                        fileInfo.put("key", object.key());
                        fileInfo.put("sizeBytes", object.size());
                        files.add(fileInfo);
                    }
                }
                
                // Process folders (only direct subfolders, not nested ones)
                for (CommonPrefix commonPrefix : listResponse.commonPrefixes()) {
                    String prefixStr = commonPrefix.prefix();
                    String folderName = prefixStr.substring(prefix.length());
                    if (folderName.endsWith("/")) {
                        folderName = folderName.substring(0, folderName.length() - 1);
                    }
                    if (!folderName.isEmpty() && !folderName.contains("/")) {
                        Map<String, Object> folderInfo = new HashMap<>();
                        folderInfo.put("id", folderId++);
                        folderInfo.put("name", folderName);
                        folderInfo.put("type", "folder");
                        folderInfo.put("modified", java.time.Instant.now().toString());
                        folderInfo.put("fullPath", folderPath != null && !folderPath.isEmpty() ? 
                                       folderPath + "/" + folderName : folderName);
                        folders.add(folderInfo);
                    }
                }

                listRequest = listRequest.toBuilder()
                        .continuationToken(listResponse.nextContinuationToken())
                        .build();

            } while (listResponse.isTruncated());
            
            Map<String, Object> result = new HashMap<>();
            result.put("files", files);
            result.put("folders", folders);
            return result;
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to list files from S3: " + e.getMessage(), e);
        }
    }
    
    public long getUserStorageUsage(String userId) {
        try {
            String prefix = userId + "/";
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();

            long totalSize = 0;
            ListObjectsV2Response listResponse;
            
            do {
                listResponse = s3Client.listObjectsV2(listRequest);
                for (S3Object object : listResponse.contents()) {
                    if (!object.key().endsWith("/")) {
                        totalSize += object.size();
                    }
                }
                listRequest = listRequest.toBuilder()
                        .continuationToken(listResponse.nextContinuationToken())
                        .build();
            } while (listResponse.isTruncated());
            
            return totalSize;
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate storage usage: " + e.getMessage(), e);
        }
    }
    
    private String formatFileSize(Long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }

    public ResponseInputStream<GetObjectResponse> downloadFile(String userId, String s3Key) {
        validateKeyOwnership(userId, s3Key);
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            return s3Client.getObject(getObjectRequest);
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file from S3: " + e.getMessage(), e);
        }
    }
    
    public void deleteFile(String userId, String s3Key) {
        validateKeyOwnership(userId, s3Key);
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();
            s3Client.deleteObject(deleteRequest);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from S3: " + e.getMessage(), e);
        }
    }

    private void validateKeyOwnership(String userId, String key) {
        if (key == null || key.equals(quotaLockKey(userId)) || !key.startsWith(userId + "/") || key.contains("..")
                || key.indexOf('\r') >= 0 || key.indexOf('\n') >= 0) {
            throw new IllegalArgumentException("Invalid file key");
        }
    }

    private void validatePath(String path) {
        if (path != null && (path.contains("..") || path.startsWith("/") || path.endsWith("/")
                || path.indexOf('\r') >= 0 || path.indexOf('\n') >= 0)) {
            throw new IllegalArgumentException("Invalid folder path");
        }
    }

    private void acquireQuotaLock(String lockKey) throws IOException {
        for (int attempt = 0; attempt < 30; attempt++) {
            try {
                s3Client.putObject(PutObjectRequest.builder().bucket(bucketName).key(lockKey)
                        .overrideConfiguration(AwsRequestOverrideConfiguration.builder()
                                .putHeader("If-None-Match", "*").build())
                        .build(), RequestBody.fromBytes(new byte[0]));
                return;
            } catch (S3Exception exception) {
                if (exception.statusCode() != 412 && exception.statusCode() != 409) {
                    throw new IOException("Unable to reserve upload quota", exception);
                }
                if (exception.statusCode() == 412) {
                    try {
                        HeadObjectResponse lock = s3Client.headObject(HeadObjectRequest.builder()
                                .bucket(bucketName).key(lockKey).build());
                        if (lock.lastModified() != null
                                && lock.lastModified().isBefore(Instant.now().minus(QUOTA_LOCK_TTL))) {
                            s3Client.deleteObject(DeleteObjectRequest.builder()
                                    .bucket(bucketName).key(lockKey).build());
                            continue;
                        }
                    } catch (S3Exception headException) {
                        if (headException.statusCode() == 404) {
                            continue;
                        }
                        throw headException;
                    }
                }
                try {
                    TimeUnit.MILLISECONDS.sleep(200);
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                    throw new IOException("Interrupted while reserving upload quota", interruptedException);
                }
            }
        }
        throw new IOException("Upload quota is busy; please retry");
    }

    private String quotaLockKey(String userId) {
        return userId + "/" + QUOTA_LOCK_SUFFIX;
    }
}