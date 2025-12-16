package com.cloudbox.controller;


import com.cloudbox.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:3000")
public class FileController {
    
    @Autowired
    private FileService fileService;
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("userId") String userId,
            @RequestParam(value = "folderPath", required = false) String folderPath) {
        
        try {
            // Check storage limit before upload
            long totalUploadSize = 0;
            for (MultipartFile file : files) {
                totalUploadSize += file.getSize();
            }
            
            if (!fileService.canUpload(userId, totalUploadSize)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Storage limit exceeded. Maximum 1GB allowed.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            Map<String, Object> response = new HashMap<>();
            
            for (MultipartFile file : files) {
                String s3Key = fileService.uploadFile(file, userId, folderPath);
                
                Map<String, Object> fileInfo = new HashMap<>();
                fileInfo.put("name", file.getOriginalFilename());
                fileInfo.put("size", formatFileSize(file.getSize()));
                fileInfo.put("type", "file");
                fileInfo.put("key", s3Key);
                
                response.put("success", true);
                response.put("file", fileInfo);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to upload file: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PostMapping("/folder")
    public ResponseEntity<?> createFolder(
            @RequestParam("folderName") String folderName,
            @RequestParam("userId") String userId,
            @RequestParam(value = "parentFolderPath", required = false) String parentFolderPath) {
        
        try {
            fileService.createFolder(folderName, userId, parentFolderPath);
            
            String fullPath = parentFolderPath != null && !parentFolderPath.isEmpty() ? 
                             parentFolderPath + "/" + folderName : folderName;
            
            Map<String, Object> folderInfo = new HashMap<>();
            folderInfo.put("name", folderName);
            folderInfo.put("type", "folder");
            folderInfo.put("fullPath", fullPath);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("folder", folderInfo);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to create folder: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/list")
    public ResponseEntity<?> listFiles(
            @RequestParam("userId") String userId,
            @RequestParam(value = "folderPath", required = false) String folderPath) {
        
        try {
            System.out.println("Controller: Listing files for userId: " + userId + ", folderPath: " + folderPath);
            Map<String, Object> result = fileService.listFiles(userId, folderPath);
            System.out.println("Controller: Files found: " + ((List<?>) result.get("files")).size());
            System.out.println("Controller: Folders found: " + ((List<?>) result.get("folders")).size());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("files", result.get("files"));
            response.put("folders", result.get("folders"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to list files: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(
            @RequestParam("s3Key") String s3Key,
            @RequestParam("userId") String userId) {
        
        try {
            ResponseInputStream<GetObjectResponse> s3Object = fileService.downloadFile(s3Key);
            if (s3Object == null) {
                return ResponseEntity.notFound().build();
            }
            
            InputStreamResource resource = new InputStreamResource(s3Object);
            
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                .body(resource);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/folder")
    public ResponseEntity<?> deleteFolder(
            @RequestParam("userId") String userId,
            @RequestParam("folderPath") String folderPath) {
        
        System.out.println("Controller: Delete folder request - folderPath: '" + folderPath + "', userId: '" + userId + "'");
        System.out.println("Controller: Folder path length: " + folderPath.length());
        System.out.println("Controller: Folder path bytes: " + java.util.Arrays.toString(folderPath.getBytes()));
        
        try {
            fileService.deleteFolderByPath(userId, folderPath);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Folder deleted successfully");
            
            System.out.println("Controller: Folder deletion successful");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Controller: Folder deletion failed - " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to delete folder: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @DeleteMapping("/file")
    public ResponseEntity<?> deleteFile(
            @RequestParam("s3Key") String s3Key,
            @RequestParam("userId") String userId) {
        
        try {
            fileService.deleteFile(s3Key);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to delete file: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAll(@RequestParam("userId") String userId) {
        try {
            fileService.clearAll(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All files and folders cleared successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to clear all: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/storage-usage")
    public ResponseEntity<?> getStorageUsage(@RequestParam("userId") String userId) {
        try {
            long usedBytes = fileService.getUserStorageUsage(userId);
            long maxBytes = 1024L * 1024L * 1024L; // 1GB
            double usedMB = usedBytes / (1024.0 * 1024.0);
            double maxMB = maxBytes / (1024.0 * 1024.0);
            double percentage = (double) usedBytes / maxBytes * 100;
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("usedBytes", usedBytes);
            response.put("maxBytes", maxBytes);
            response.put("usedMB", Math.round(usedMB * 10.0) / 10.0);
            response.put("maxMB", Math.round(maxMB));
            response.put("percentage", Math.round(percentage * 10.0) / 10.0);
            response.put("availableMB", Math.round((maxMB - usedMB) * 10.0) / 10.0);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to get storage usage: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    private String formatFileSize(Long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}