package com.aiprof.studycompanion.dto.project;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectDto {
    private UUID id;
    private UUID spaceId;
    private String spaceName;
    private String name;
    private String description;
    private String learningGoal;
    private String status;
    private long materialCount;
    private double averageMastery;
    private Instant createdAt;
    private Instant updatedAt;
}
