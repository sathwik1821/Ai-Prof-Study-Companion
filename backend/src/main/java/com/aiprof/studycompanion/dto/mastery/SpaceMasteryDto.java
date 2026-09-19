package com.aiprof.studycompanion.dto.mastery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpaceMasteryDto {
    private UUID spaceId;
    private String spaceName;
    private Double overallMasteryScore;
    private Integer totalConcepts;
    private Integer masteredCount;     // score >= 75
    private Integer improvingCount;    // score 50..74
    private Integer attentionCount;    // score < 50
    private List<MasteryDto> weakestConcepts;
    private List<ProjectMasterySummaryDto> projectBreakdown;
}
