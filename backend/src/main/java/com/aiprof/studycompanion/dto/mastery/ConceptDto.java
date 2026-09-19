package com.aiprof.studycompanion.dto.mastery;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ConceptDto {
    private UUID id;
    private UUID projectId;
    private String name;
    private String description;
    private Instant createdAt;
}
