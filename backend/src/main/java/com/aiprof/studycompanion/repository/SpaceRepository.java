package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpaceRepository extends JpaRepository<Space, UUID> {
    List<Space> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Space> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
