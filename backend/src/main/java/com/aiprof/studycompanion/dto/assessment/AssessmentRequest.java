package com.aiprof.studycompanion.dto.assessment;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssessmentRequest {
    @NotBlank(message = "Prompt is required")
    private String prompt;

    @NotBlank(message = "Response is required")
    private String userResponse;
}
