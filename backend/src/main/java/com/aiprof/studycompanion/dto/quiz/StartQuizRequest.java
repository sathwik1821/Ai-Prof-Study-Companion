package com.aiprof.studycompanion.dto.quiz;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class StartQuizRequest {
    @Min(value = 1, message = "Must have at least 1 question")
    @Max(value = 20, message = "Cannot exceed 20 questions")
    private int questionCount = 5;
}
