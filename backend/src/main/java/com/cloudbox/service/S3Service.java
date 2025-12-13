package com.cloudbox.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;


import java.io.IOException;
import java.util.*;

@Service
public class S3Service {

    @Autowired
    private S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    public String uploadFile(MultipartFile file, String userId, String folderPath) throws IOException {
        try {
            String s3Key = userId + "/";
            if (folderPath != null && !folderPath.isEmpty()) {
                s3Key += folderPath + "/";
            }
            s3Key += UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            
            System.out.println("Uploading file to S3 with key: " + s3Key);
            System.out.println("Bucket: " + bucketName);
            System.out.println("File size: " + file.getSize());
            
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            System.out.println("Successfully uploaded file to S3: " + s3Key);
            
            return s3Key;
        } catch (Exception e) {
            System.err.println("S3 upload error: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    public void createFolder(String userId, String folderPath) {
        try {
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
            String prefix = userId + "/" + folderPath + "/";
            System.out.println("S3Service: Deleting folder with prefix: " + prefix);
            
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();

            ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);
            System.out.println("S3Service: Found " + listResponse.contents().size() + " objects to delete");
            
            if (listResponse.contents().isEmpty()) {
                System.out.println("S3Service: No objects found with prefix: " + prefix);
                return;
            }
            
            for (S3Object object : listResponse.contents()) {
                System.out.println("S3Service: Deleting object: " + object.key());
                DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(object.key())
                        .build();
                s3Client.deleteObject(deleteRequest);
                System.out.println("S3Service: Successfully deleted: " + object.key());
            }
            
            System.out.println("S3Service: Folder deletion completed");
            
        } catch (Exception e) {
            System.err.println("S3Service: Failed to delete folder - " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete folder from S3: " + e.getMessage(), e);
        }
    }
    
    public Map<String, Object> listFiles(String userId, String folderPath) {
        try {
            String prefix = userId + "/";
            if (folderPath != null && !folderPath.isEmpty()) {
                prefix += folderPath + "/";
            }
            
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .delimiter("/")
                    .build();

            ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);
            
            List<Map<String, Object>> files = new ArrayList<>();
            List<Map<String, Object>> folders = new ArrayList<>();
            
            // Process files
            int fileId = 1;
            for (S3Object object : listResponse.contents()) {
                if (!object.key().endsWith("/") && !object.key().equals(prefix)) {
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
            int folderId = 1;
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

    public ResponseInputStream<GetObjectResponse> downloadFile(String s3Key) {
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
    
    public void deleteFile(String s3Key) {
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
}