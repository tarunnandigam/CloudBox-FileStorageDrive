package com.cloudbox.controller;

import com.cloudbox.model.FileEntity;
import com.cloudbox.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {
    
    @Autowired
    private FileService fileService;
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("userId") String userId) {
        
        try {
            Map<String, Object> response = new HashMap<>();
            
            for (MultipartFile file : files) {
                FileEntity savedFile = fileService.uploadFile(file, userId);
                
                Map<String, Object> fileInfo = new HashMap<>();
                fileInfo.put("id", savedFile.getId());
                fileInfo.put("name", savedFile.getOriginalName());
                fileInfo.put("size", formatFileSize(savedFile.getFileSize()));
                fileInfo.put("modified", "Just now");
                fileInfo.put("type", "file");
                
                response.put("success", true);
                response.put("file", fileInfo);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to upload file: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/list")
    public ResponseEntity<?> listFiles(@RequestParam("userId") String userId) {
        try {
            List<FileEntity> files = fileService.getUserFiles(userId);
            
            List<Map<String, Object>> fileList = files.stream().map(file -> {
                Map<String, Object> fileInfo = new HashMap<>();
                fileInfo.put("id", file.getId());
                fileInfo.put("name", file.getOriginalName());
                fileInfo.put("size", formatFileSize(file.getFileSize()));
                fileInfo.put("modified", file.getUploadedAt().toString());
                fileInfo.put("type", "file");
                return fileInfo;
            }).toList();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("files", fileList);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to list files: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long fileId,
            @RequestParam("userId") String userId) {
        
        try {
            FileEntity file = fileService.getFile(fileId, userId);
            if (file == null) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = Paths.get(file.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           "attachment; filename=\"" + file.getOriginalName() + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(
            @PathVariable Long fileId,
            @RequestParam("userId") String userId) {
        
        try {
            fileService.deleteFile(fileId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to delete file: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    private String formatFileSize(Long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}