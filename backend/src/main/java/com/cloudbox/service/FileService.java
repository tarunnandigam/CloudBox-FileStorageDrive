package com.cloudbox.service;

import com.cloudbox.model.FileEntity;
import com.cloudbox.repository.FileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class FileService {
    
    @Autowired
    private FileRepository fileRepository;
    
    private final String uploadDir = "uploads/";
    
    public FileEntity uploadFile(MultipartFile file, String userId) throws IOException {
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Generate unique filename
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        
        // Save file to disk
        Files.copy(file.getInputStream(), filePath);
        
        // Save metadata to database
        FileEntity fileEntity = new FileEntity(
            fileName,
            file.getOriginalFilename(),
            file.getSize(),
            file.getContentType(),
            userId,
            filePath.toString()
        );
        
        return fileRepository.save(fileEntity);
    }
    
    public List<FileEntity> getUserFiles(String userId) {
        return fileRepository.findByUserId(userId);
    }
    
    public void deleteFile(Long fileId, String userId) throws IOException {
        FileEntity file = fileRepository.findById(fileId).orElse(null);
        if (file != null && file.getUserId().equals(userId)) {
            // Delete file from disk
            Path filePath = Paths.get(file.getFilePath());
            Files.deleteIfExists(filePath);
            
            // Delete from database
            fileRepository.deleteById(fileId);
        }
    }
    
    public FileEntity getFile(Long fileId, String userId) {
        return fileRepository.findById(fileId)
            .filter(file -> file.getUserId().equals(userId))
            .orElse(null);
    }
}