package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.QuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, UUID> {
    List<QuizAnswer> findByQuizAttemptId(UUID quizAttemptId);
    Optional<QuizAnswer> findByQuestionId(UUID questionId);
    Optional<QuizAnswer> findByQuizAttemptIdAndQuestionId(UUID quizAttemptId, UUID questionId);
}
