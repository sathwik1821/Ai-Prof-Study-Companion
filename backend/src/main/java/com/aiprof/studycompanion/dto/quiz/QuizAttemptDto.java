package com.aiprof.studycompanion.dto.quiz;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QuizAttemptDto {
    private UUID id;
    private UUID projectId;
    private String status;
    private int totalQuestions;
    private int completedQuestions;
    private int correctCount;
    private int score;
    private Instant startedAt;
    private Instant completedAt;
    private List<QuizQuestionDto> questions;
}
