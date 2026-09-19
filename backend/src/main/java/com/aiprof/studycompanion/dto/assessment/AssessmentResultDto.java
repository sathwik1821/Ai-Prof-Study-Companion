package com.aiprof.studycompanion.dto.assessment;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AssessmentResultDto {
    private UUID id;
    private String prompt;
    private String userResponse;
    private int score;
    private String understandingLevel;
    private List<String> conceptsCovered;
    private List<String> missingConcepts;
    private String feedback;
    private Instant createdAt;
}
