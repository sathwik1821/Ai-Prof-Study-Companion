package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.QuizQuestion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {
    List<QuizQuestion> findByQuizAttemptIdOrderByOrderIndexAsc(UUID quizAttemptId);
    long countByQuizAttemptId(UUID quizAttemptId);

    @Query("SELECT q.questionText FROM QuizQuestion q WHERE q.quizAttempt.project.id = :projectId ORDER BY q.createdAt DESC")
    List<String> findRecentQuestionTextsByProjectId(@Param("projectId") UUID projectId, Pageable pageable);
}
