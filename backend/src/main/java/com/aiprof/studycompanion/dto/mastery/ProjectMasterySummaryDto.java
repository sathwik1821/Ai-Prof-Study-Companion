package com.aiprof.studycompanion.dto.mastery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMasterySummaryDto {
    private UUID projectId;
    private String projectName;
    private Double averageMastery;
    private Integer conceptCount;
    private String status;
}
