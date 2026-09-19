package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {
    List<Assessment> findByProjectIdAndUserIdOrderByCreatedAtDesc(UUID projectId, UUID userId);
    Optional<Assessment> findByIdAndProjectIdAndUserId(UUID id, UUID projectId, UUID userId);
    List<Assessment> findTop5ByProjectIdAndUserIdOrderByCreatedAtDesc(UUID projectId, UUID userId);
    long countByProjectId(UUID projectId);
}
