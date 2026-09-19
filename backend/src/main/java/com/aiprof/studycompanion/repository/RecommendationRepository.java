package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, UUID> {
    List<Recommendation> findByProjectIdAndUserIdAndStatus(UUID projectId, UUID userId, String status);
    List<Recommendation> findByProjectIdAndUserIdAndStatusOrderByPriorityDescCreatedAtDesc(UUID projectId, UUID userId, String status);
    Optional<Recommendation> findByIdAndProjectIdAndUserId(UUID id, UUID projectId, UUID userId);
    void deleteByProjectIdAndUserId(UUID projectId, UUID userId);
}
