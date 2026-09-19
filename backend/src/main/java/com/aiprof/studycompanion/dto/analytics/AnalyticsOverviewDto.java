package com.aiprof.studycompanion.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewDto {
    private int totalSpaces;
    private int totalProjects;
    private int totalMaterials;
    private int totalConversations;
    private int totalQuizAttempts;
    private double averageMastery;
    private Map<String, Long> activityBreakdown;

    // PRD Section 16 Core Requirements ("Where was I, How am I doing, What should I do next")
    private List<RecentProjectSummary> recentProjects;
    private List<RecentProjectSummary> masteryByProject; // Frontend chart mapping
    private List<QuizPerformancePoint> recentActivity;  // Frontend quiz trend mapping
    private List<WeakConceptSummary> weakestConcepts;
    private RecommendedActionSummary nextRecommendedAction;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentProjectSummary {
        private UUID projectId;
        private String projectName;
        private UUID spaceId;
        private String spaceName;
        private String learningGoal;
        private Double masteryScore;
        private Double averageMastery; // Frontend chart compatibility
        private Instant updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizPerformancePoint {
        private String date;
        private double scorePercent;
        private String projectName;
        private int totalQuestions;
        private int correctCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeakConceptSummary {
        private UUID conceptId;
        private String conceptName;
        private UUID projectId;
        private String projectName;
        private UUID spaceId;
        private Double masteryScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedActionSummary {
        private String title;
        private String description;
        private String actionType; // QUIZ | TUTOR | MATERIAL | SPACE
        private UUID projectId;
        private UUID spaceId;
        private String reason;
    }
}
