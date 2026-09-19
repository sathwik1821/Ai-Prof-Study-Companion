package com.aiprof.studycompanion.dto.quiz;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QuizQuestionDto {
    private UUID id;
    private String questionType;
    private String questionText;
    private List<String> options; // for multiple choice
    private String difficulty;
    private int orderIndex;
    // Only populated after answering:
    private Boolean isCorrect;
    private String correctAnswer;
    private Integer correctOption;
    private String explanation;
    private String aiFeedback;
    private String userAnswer;
}
