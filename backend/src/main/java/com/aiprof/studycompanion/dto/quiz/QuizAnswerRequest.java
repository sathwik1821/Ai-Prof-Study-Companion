package com.aiprof.studycompanion.dto.quiz;

import lombok.Data;

@Data
public class QuizAnswerRequest {
    private String answer;
    private Integer selectedOption;
}
