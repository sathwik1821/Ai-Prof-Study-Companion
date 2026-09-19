package com.aiprof.studycompanion.dto.recommendation;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RecommendationDto {
    private UUID id;
    private String type;
    private String title;
    private String description;
    private String reason;
    private UUID conceptId;
    private String conceptName;
    private int priority;
    private String status;
    private Instant createdAt;
}
