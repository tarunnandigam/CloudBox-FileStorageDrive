package com.cloudbox.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListBucketsResponse;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "http://localhost:3000")
public class TestController {
    
    @Autowired
    private S3Client s3Client;
    
    @Value("${aws.s3.bucket-name}")
    private String bucketName;
    
    @GetMapping("/s3")
    public ResponseEntity<?> testS3Connection() {
        try {
            // Test basic S3 connection
            ListBucketsResponse response = s3Client.listBuckets();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "S3 connection successful");
            result.put("bucketCount", response.buckets().size());
            result.put("configuredBucket", bucketName);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}