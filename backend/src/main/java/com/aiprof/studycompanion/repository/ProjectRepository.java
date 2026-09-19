package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findBySpaceIdAndUserIdOrderByCreatedAtDesc(UUID spaceId, UUID userId);
    Optional<Project> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByIdAndUserId(UUID id, UUID userId);
    List<Project> findByUserIdOrderByUpdatedAtDesc(UUID userId);
    long countByUserId(UUID userId);
    long countBySpaceId(UUID spaceId);
}
