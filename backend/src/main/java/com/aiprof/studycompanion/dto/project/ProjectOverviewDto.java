package com.aiprof.studycompanion.dto.project;

import com.aiprof.studycompanion.dto.mastery.MasteryDto;
import com.aiprof.studycompanion.dto.recommendation.RecommendationDto;
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
public class ProjectOverviewDto {
    private UUID projectId;
    private String projectName;
    private String learningGoal;
    
    // Support both naming conventions so frontend never gets undefined
    private double overallMastery;
    private double averageMastery;
    
    private long totalMaterials;
    private long materialCount;
    
    private long totalQuizzesTaken;
    private long totalQuizAttempts;
    
    private long tutorSessionCount;
    private long conceptCount;
    
    private List<MasteryDto> weakConcepts;
    private List<RecommendationDto> recommendations;
}
