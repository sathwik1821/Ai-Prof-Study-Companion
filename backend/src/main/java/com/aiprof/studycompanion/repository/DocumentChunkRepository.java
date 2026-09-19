package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {
    List<DocumentChunk> findByProjectId(UUID projectId);
    List<DocumentChunk> findByMaterialIdOrderByChunkIndexAsc(UUID materialId);
    void deleteByMaterialId(UUID materialId);
    long countByProjectId(UUID projectId);
}
