package com.cloudbox.repository;

import com.cloudbox.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {
    List<FileEntity> findByUserId(String userId);
    void deleteByIdAndUserId(Long id, String userId);
}