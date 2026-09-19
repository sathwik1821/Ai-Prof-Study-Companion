package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {
    List<QuizAttempt> findByProjectIdAndUserIdOrderByStartedAtDesc(UUID projectId, UUID userId);
    Optional<QuizAttempt> findByIdAndUserId(UUID id, UUID userId);
    Optional<QuizAttempt> findByIdAndProjectIdAndUserId(UUID id, UUID projectId, UUID userId);
    Optional<QuizAttempt> findFirstByProjectIdAndUserIdAndStatus(UUID projectId, UUID userId, String status);
    long countByProjectId(UUID projectId);
    long countByProjectIdAndUserId(UUID projectId, UUID userId);
    long countByUserId(UUID userId);
    long countByUserIdAndStatus(UUID userId, String status);
    List<QuizAttempt> findByUserIdOrderByStartedAtAsc(UUID userId);
}
