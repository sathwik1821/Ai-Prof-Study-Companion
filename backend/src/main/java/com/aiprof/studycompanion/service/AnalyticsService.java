package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.analytics.AnalyticsOverviewDto;
import com.aiprof.studycompanion.dto.growth.GrowthPointDto;
import com.aiprof.studycompanion.dto.mastery.MasteryDto;
import com.aiprof.studycompanion.dto.project.ProjectOverviewDto;
import com.aiprof.studycompanion.dto.recommendation.RecommendationDto;
import com.aiprof.studycompanion.entity.*;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.exception.ErrorCode;
import com.aiprof.studycompanion.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final GrowthSnapshotRepository growthRepository;
    private final ActivityEventRepository activityRepository;
    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ConversationRepository conversationRepository;
    private final SpaceRepository spaceRepository;
    private final MasteryService masteryService;
    private final RecommendationService recommendationService;
    private final ConceptMasteryRepository conceptMasteryRepository;

    @Transactional
    public List<GrowthPointDto> getGrowthCurve(UUID projectId, UUID userId) {
        if (!projectRepository.existsByIdAndUserId(projectId, userId)) {
            throw new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId);
        }

        List<GrowthSnapshot> snapshots = growthRepository.findByProjectIdAndUserIdOrderBySnapshotDateAsc(projectId, userId);

        if (snapshots.isEmpty()) {
            // Snapshot current masteries so student sees baseline on chart
            List<MasteryDto> currentMasteries = masteryService.getProjectMastery(projectId, userId);
            LocalDate today = LocalDate.now();
            List<GrowthPointDto> baseline = new ArrayList<>();
            for (MasteryDto m : currentMasteries) {
                baseline.add(GrowthPointDto.builder()
                        .date(today)
                        .conceptId(m.getConceptId())
                        .conceptName(m.getConceptName())
                        .masteryScore(m.getMasteryScore())
                        .build());
            }
            return baseline;
        }

        return snapshots.stream().map(s -> GrowthPointDto.builder()
                .date(s.getSnapshotDate())
                .conceptId(s.getConcept().getId())
                .conceptName(s.getConcept().getName())
                .masteryScore(s.getMasteryScore())
                .build()
        ).toList();
    }

    @Transactional
    public ProjectOverviewDto getProjectOverview(UUID projectId, UUID userId) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId));

        double avgMastery = masteryService.getAverageMastery(projectId, userId);
        double roundedMastery = Math.round(avgMastery * 10.0) / 10.0;
        long totalMaterials = materialRepository.countByProjectId(projectId);
        long totalQuizzes = quizAttemptRepository.countByProjectIdAndUserId(projectId, userId);
        long totalSessions = conversationRepository.countByProjectIdAndUserId(projectId, userId);
        long totalConcepts = conceptMasteryRepository.findByProjectIdAndUserId(projectId, userId).size();

        List<ConceptMastery> weakestEntities = masteryService.getWeakestConcepts(projectId, userId);
        List<MasteryDto> weakConcepts = weakestEntities.stream().map(masteryService::toDto).toList();

        List<RecommendationDto> recommendations = recommendationService.getRecommendations(projectId, userId);

        return ProjectOverviewDto.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .learningGoal(project.getLearningGoal())
                .overallMastery(roundedMastery)
                .averageMastery(roundedMastery)
                .totalMaterials(totalMaterials)
                .materialCount(totalMaterials)
                .totalQuizzesTaken(totalQuizzes)
                .totalQuizAttempts(totalQuizzes)
                .tutorSessionCount(totalSessions)
                .conceptCount(totalConcepts)
                .weakConcepts(weakConcepts)
                .recommendations(recommendations)
                .build();
    }

    @Transactional(readOnly = true)
    public AnalyticsOverviewDto getOverallAnalytics(UUID userId) {
        long spaceCount = spaceRepository.countByUserId(userId);
        long projectCount = projectRepository.countByUserId(userId);
        long convCount = conversationRepository.countByUserId(userId);
        long quizCount = quizAttemptRepository.countByUserId(userId);

        Double avgMastery = conceptMasteryRepository.getAverageMasteryByUser(userId);
        double roundedAvg = avgMastery != null ? Math.round(avgMastery * 10.0) / 10.0 : 0.0;

        // Recent Projects (up to 4)
        List<Project> userProjects = projectRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        List<AnalyticsOverviewDto.RecentProjectSummary> recentProjects = userProjects.stream()
                .limit(6)
                .map(p -> {
                    Double pMastery = masteryService.getAverageMastery(p.getId(), userId);
                    double score = Math.round(pMastery * 10.0) / 10.0;
                    return AnalyticsOverviewDto.RecentProjectSummary.builder()
                            .projectId(p.getId())
                            .projectName(p.getName())
                            .spaceId(p.getSpace() != null ? p.getSpace().getId() : null)
                            .spaceName(p.getSpace() != null ? p.getSpace().getName() : null)
                            .learningGoal(p.getLearningGoal())
                            .masteryScore(score)
                            .averageMastery(score)
                            .updatedAt(p.getUpdatedAt())
                            .build();
                })
                .toList();

        // Quiz performance activity history for trend charts
        List<QuizAttempt> userQuizzes = quizAttemptRepository.findByUserIdOrderByStartedAtAsc(userId);
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd").withZone(ZoneOffset.UTC);
        List<AnalyticsOverviewDto.QuizPerformancePoint> quizActivity = userQuizzes.stream()
                .filter(qa -> "COMPLETED".equalsIgnoreCase(qa.getStatus()) || (qa.getTotalQuestions() != null && qa.getTotalQuestions() > 0 && qa.getCompletedQuestions() > 0))
                .limit(20)
                .map(qa -> {
                    int total = qa.getTotalQuestions() != null && qa.getTotalQuestions() > 0 ? qa.getTotalQuestions() : 1;
                    int correct = qa.getCorrectCount() != null ? qa.getCorrectCount() : 0;
                    double pct = Math.round((correct * 100.0) / total);
                    String dt = qa.getCompletedAt() != null
                            ? dtf.format(qa.getCompletedAt())
                            : (qa.getStartedAt() != null ? dtf.format(qa.getStartedAt()) : "Quiz");
                    return AnalyticsOverviewDto.QuizPerformancePoint.builder()
                            .date(dt)
                            .scorePercent(pct)
                            .projectName(qa.getProject() != null ? qa.getProject().getName() : "Quiz")
                            .totalQuestions(total)
                            .correctCount(correct)
                            .build();
                })
                .toList();

        // Weakest concepts needing attention (up to 4)
        List<ConceptMastery> weakest = conceptMasteryRepository.findWeakestConceptsByUser(userId);
        List<AnalyticsOverviewDto.WeakConceptSummary> weakConcepts = weakest.stream()
                .filter(cm -> cm.getMasteryScore() < 85.0)
                .limit(4)
                .map(cm -> AnalyticsOverviewDto.WeakConceptSummary.builder()
                        .conceptId(cm.getConcept().getId())
                        .conceptName(cm.getConcept().getName())
                        .projectId(cm.getProject().getId())
                        .projectName(cm.getProject().getName())
                        .spaceId(cm.getProject().getSpace() != null ? cm.getProject().getSpace().getId() : null)
                        .masteryScore(Math.round(cm.getMasteryScore() * 10.0) / 10.0)
                        .build())
                .toList();

        // Recommended Next Action (What should I do next?)
        AnalyticsOverviewDto.RecommendedActionSummary recommendedAction = null;
        if (userProjects.isEmpty()) {
            recommendedAction = AnalyticsOverviewDto.RecommendedActionSummary.builder()
                    .title("Create Your First Learning Journey")
                    .description("Create a project inside a space to upload materials and begin learning with your AI tutor.")
                    .actionType("SPACE")
                    .reason("Getting Started")
                    .build();
        } else if (!weakConcepts.isEmpty()) {
            AnalyticsOverviewDto.WeakConceptSummary target = weakConcepts.get(0);
            recommendedAction = AnalyticsOverviewDto.RecommendedActionSummary.builder()
                    .title("Reinforce " + target.getConceptName())
                    .description("Your mastery in '" + target.getConceptName() + "' is at " + target.getMasteryScore() + "%. Take a diagnostic quiz to reinforce your knowledge.")
                    .actionType("QUIZ")
                    .projectId(target.getProjectId())
                    .spaceId(target.getSpaceId())
                    .reason("Targeted Mastery Growth")
                    .build();
        } else {
            Project latest = userProjects.get(0);
            long materialsCount = materialRepository.countByProjectId(latest.getId());
            if (materialsCount == 0) {
                recommendedAction = AnalyticsOverviewDto.RecommendedActionSummary.builder()
                        .title("Upload Lecture Materials to " + latest.getName())
                        .description("Add PDF notes or slides to generate concept maps, diagnostic quizzes, and grounded citations.")
                        .actionType("MATERIAL")
                        .projectId(latest.getId())
                        .spaceId(latest.getSpace() != null ? latest.getSpace().getId() : null)
                        .reason("Knowledge Grounding")
                        .build();
            } else {
                recommendedAction = AnalyticsOverviewDto.RecommendedActionSummary.builder()
                        .title("Continue AI Tutor Session in " + latest.getName())
                        .description("Explore next-level concepts or ask the AI tutor to test your recall with challenging questions.")
                        .actionType("TUTOR")
                        .projectId(latest.getId())
                        .spaceId(latest.getSpace() != null ? latest.getSpace().getId() : null)
                        .reason("Active Recall & Continuity")
                        .build();
            }
        }

        return AnalyticsOverviewDto.builder()
                .totalSpaces((int) spaceCount)
                .totalProjects((int) projectCount)
                .totalConversations((int) convCount)
                .totalQuizAttempts((int) quizCount)
                .averageMastery(roundedAvg)
                .activityBreakdown(Map.of(
                        "SPACES", spaceCount,
                        "PROJECTS", projectCount,
                        "CONVERSATIONS", convCount,
                        "QUIZZES", quizCount
                ))
                .recentProjects(recentProjects)
                .masteryByProject(recentProjects)
                .recentActivity(quizActivity)
                .weakestConcepts(weakConcepts)
                .nextRecommendedAction(recommendedAction)
                .build();
    }

    @Async
    public void recordEvent(UUID userId, UUID projectId, String eventType, String payloadJson, String idempotencyKey) {
        try {
            ActivityEvent event = ActivityEvent.builder()
                    .userId(userId)
                    .projectId(projectId)
                    .eventType(eventType)
                    .payloadJson(payloadJson)
                    .idempotencyKey(idempotencyKey)
                    .build();
            activityRepository.save(event);
        } catch (Exception e) {
            log.warn("Failed to record activity event: {}", e.getMessage());
        }
    }
}
