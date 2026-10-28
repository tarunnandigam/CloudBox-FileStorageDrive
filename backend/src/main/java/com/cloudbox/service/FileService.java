package com.cloudbox.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class FileService {
    
    @Autowired
    private S3Service s3Service;
    
    public List<String> uploadFiles(MultipartFile[] files, String userId, String folderPath) throws IOException {
        return s3Service.uploadFiles(files, userId, folderPath);
    }

    public void migrateLegacyFiles(String legacyUserId, String userId) {
        s3Service.migrateLegacyFiles(legacyUserId, userId);
    }
    
    public void createFolder(String folderName, String userId, String parentFolderPath) {
        String fullPath = parentFolderPath != null && !parentFolderPath.isEmpty() ? 
                         parentFolderPath + "/" + folderName : folderName;
        s3Service.createFolder(userId, fullPath);
    }
    
    public Map<String, Object> listFiles(String userId, String folderPath) {
        return s3Service.listFiles(userId, folderPath);
    }
    
    public long getUserStorageUsage(String userId) {
        return s3Service.getUserStorageUsage(userId);
    }
    
    public void deleteFile(String userId, String s3Key) {
        s3Service.deleteFile(userId, s3Key);
    }
    

    
    public void deleteFolder(Long folderId, String userId) {
        // Since we're S3-only now, we need to find the folder path by ID
        // For now, this is a placeholder - we need to track folder paths differently
        throw new RuntimeException("Folder deletion by ID not supported in S3-only mode");
    }
    
    public void deleteFolderByPath(String userId, String folderPath) {
        s3Service.deleteFolder(userId, folderPath);
    }
    
    public void clearAll(String userId) {
        Map<String, Object> allItems = s3Service.listFiles(userId, "");
        // This will clear all files and folders for the user from S3
        s3Service.deleteFolder(userId, "");
    }
    
    public ResponseInputStream<GetObjectResponse> downloadFile(String userId, String s3Key) {
        return s3Service.downloadFile(userId, s3Key);
    }
}