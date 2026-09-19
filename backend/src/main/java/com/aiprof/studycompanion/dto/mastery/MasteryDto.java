package com.aiprof.studycompanion.dto.mastery;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class MasteryDto {
    private UUID id;
    private UUID conceptId;
    private String conceptName;
    private String conceptDescription;
    private Double masteryScore;
    private String growthStatus;
    private Integer evidenceCount;
    private Instant lastAssessedAt;
    private Instant updatedAt;
}
