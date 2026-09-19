package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID> {
    List<Material> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    Optional<Material> findByIdAndProjectId(UUID id, UUID projectId);
    long countByProjectId(UUID projectId);
}
