package com.cloudbox.controller;


import com.cloudbox.service.FileService;
import com.cloudbox.service.AppwriteAuthService;
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
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    
    @Autowired
    private FileService fileService;

    @Autowired
    private com.cloudbox.service.AppwriteAuthService appwriteAuthService;
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("userId") String userId,
            @RequestParam(value = "folderPath", required = false) String folderPath,
            HttpServletRequest request) {
        
        try {
            String authenticatedUserId = authenticatedUser(request);
            
            Map<String, Object> response = new HashMap<>();
            List<String> keys = fileService.uploadFiles(files, authenticatedUserId, folderPath);
            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                String s3Key = keys.get(i);
                
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
            rethrowAuthorizationException(e);
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
            @RequestParam(value = "parentFolderPath", required = false) String parentFolderPath,
            HttpServletRequest request) {
        
        try {
            String authenticatedUserId = authenticatedUser(request);
            fileService.createFolder(folderName, authenticatedUserId, parentFolderPath);
            
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
            rethrowAuthorizationException(e);
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
            @RequestParam(value = "folderPath", required = false) String folderPath,
            HttpServletRequest request) {
        
        try {
            String authenticatedUserId = authenticatedUser(request);
            Map<String, Object> result = fileService.listFiles(authenticatedUserId, folderPath);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("files", result.get("files"));
            response.put("folders", result.get("folders"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            rethrowAuthorizationException(e);
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
            @RequestParam("userId") String userId,
            HttpServletRequest request) {
        
        try {
            String authenticatedUserId = authenticatedUser(request);
            ResponseInputStream<GetObjectResponse> s3Object = fileService.downloadFile(authenticatedUserId, s3Key);
            if (s3Object == null) {
                return ResponseEntity.notFound().build();
            }
            
            InputStreamResource resource = new InputStreamResource(s3Object);
            
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                .body(resource);
            
        } catch (Exception e) {
            rethrowAuthorizationException(e);
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/folder")
    public ResponseEntity<?> deleteFolder(
            @RequestParam("userId") String userId,
            @RequestParam("folderPath") String folderPath,
            HttpServletRequest request) {
        
        try {
            String authenticatedUserId = authenticatedUser(request);
            fileService.deleteFolderByPath(authenticatedUserId, folderPath);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Folder deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            rethrowAuthorizationException(e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to delete folder: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @DeleteMapping("/file")
    public ResponseEntity<?> deleteFile(
            @RequestParam("s3Key") String s3Key,
            @RequestParam("userId") String userId,
            HttpServletRequest request) {
        
        try {
            String authenticatedUserId = authenticatedUser(request);
            fileService.deleteFile(authenticatedUserId, s3Key);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            rethrowAuthorizationException(e);
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to delete file: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAll(@RequestParam("userId") String userId, HttpServletRequest request) {
        try {
            fileService.clearAll(authenticatedUser(request));
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All files and folders cleared successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            rethrowAuthorizationException(e);
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to clear all: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/storage-usage")
    public ResponseEntity<?> getStorageUsage(@RequestParam("userId") String userId, HttpServletRequest request) {
        try {
            long usedBytes = fileService.getUserStorageUsage(authenticatedUser(request));
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
            rethrowAuthorizationException(e);
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

    private String authenticatedUser(HttpServletRequest request) {
        AppwriteAuthService.AccountDetails account = appwriteAuthService.requireAccount(request);
        String userIdentifier = account.email();
        if (userIdentifier == null || userIdentifier.isBlank()) {
            userIdentifier = account.id();
        } else {
            fileService.migrateLegacyFiles(account.id(), userIdentifier);
        }
        return userIdentifier;
    }

    private void rethrowAuthorizationException(Exception exception) {
        if (exception instanceof ResponseStatusException responseStatusException) {
            logger.warn("Authorization rejected: status={}, reason={}", 
                    responseStatusException.getStatusCode(), responseStatusException.getReason());
            throw responseStatusException;
        }
    }
}