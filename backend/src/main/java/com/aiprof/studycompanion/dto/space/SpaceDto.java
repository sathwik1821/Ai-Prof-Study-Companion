package com.aiprof.studycompanion.dto.space;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class SpaceDto {
    private UUID id;
    private String name;
    private String description;
    private String color;
    private long projectCount;
    private Instant createdAt;
    private Instant updatedAt;
}
