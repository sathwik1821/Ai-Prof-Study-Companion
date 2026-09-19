package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.mastery.MasteryDto;
import com.aiprof.studycompanion.dto.mastery.ProjectMasterySummaryDto;
import com.aiprof.studycompanion.dto.mastery.SpaceMasteryDto;
import com.aiprof.studycompanion.entity.Concept;
import com.aiprof.studycompanion.entity.ConceptMastery;
import com.aiprof.studycompanion.entity.Project;
import com.aiprof.studycompanion.entity.Space;
import com.aiprof.studycompanion.entity.User;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.exception.ErrorCode;
import com.aiprof.studycompanion.repository.ConceptMasteryRepository;
import com.aiprof.studycompanion.repository.ConceptRepository;
import com.aiprof.studycompanion.repository.ProjectRepository;
import com.aiprof.studycompanion.repository.SpaceRepository;
import com.aiprof.studycompanion.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasteryService {

    private final ConceptMasteryRepository masteryRepository;
    private final ConceptRepository conceptRepository;
    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;

    @Transactional
    public SpaceMasteryDto getSpaceMastery(UUID spaceId, UUID userId) {
        Space space = spaceRepository.findByIdAndUserId(spaceId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Space not found: " + spaceId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        List<Project> projects = projectRepository.findBySpaceIdAndUserIdOrderByCreatedAtDesc(spaceId, userId);

        List<ConceptMastery> allMasteries = masteryRepository.findBySpaceIdAndUserId(spaceId, userId);
        List<ConceptMastery> assessedMasteries = allMasteries.stream()
                .filter(m -> m.getEvidenceCount() != null && m.getEvidenceCount() > 0)
                .toList();

        int totalConcepts = allMasteries.size();
        int masteredCount = (int) assessedMasteries.stream()
                .filter(m -> applyTemporalDecay(m.getMasteryScore(), m.getLastAssessedAt()) >= 75.0)
                .count();
        int improvingCount = (int) assessedMasteries.stream()
                .filter(m -> {
                    double s = applyTemporalDecay(m.getMasteryScore(), m.getLastAssessedAt());
                    return s >= 50.0 && s < 75.0;
                })
                .count();
        int attentionCount = (int) assessedMasteries.stream()
                .filter(m -> applyTemporalDecay(m.getMasteryScore(), m.getLastAssessedAt()) < 50.0)
                .count();

        double overallScore = assessedMasteries.isEmpty() ? 0.0 :
                assessedMasteries.stream()
                        .mapToDouble(m -> applyTemporalDecay(m.getMasteryScore(), m.getLastAssessedAt()))
                        .average()
                        .orElse(0.0);

        List<MasteryDto> weakest = masteryRepository.findWeakestConceptsBySpace(spaceId, userId).stream()
                .filter(m -> m.getEvidenceCount() != null && m.getEvidenceCount() > 0)
                .limit(5)
                .map(this::toDto)
                .toList();

        List<ProjectMasterySummaryDto> projectBreakdown = new ArrayList<>();
        for (Project p : projects) {
            List<ConceptMastery> projMasteries = allMasteries.stream()
                    .filter(m -> m.getProject().getId().equals(p.getId()))
                    .toList();

            List<ConceptMastery> projAssessed = projMasteries.stream()
                    .filter(m -> m.getEvidenceCount() != null && m.getEvidenceCount() > 0)
                    .toList();

            double projAvg = projAssessed.isEmpty() ? 0.0 :
                    projAssessed.stream()
                            .mapToDouble(m -> applyTemporalDecay(m.getMasteryScore(), m.getLastAssessedAt()))
                            .average()
                            .orElse(0.0);

            projectBreakdown.add(ProjectMasterySummaryDto.builder()
                    .projectId(p.getId())
                    .projectName(p.getName())
                    .averageMastery(Math.round(projAvg * 10.0) / 10.0)
                    .conceptCount(projMasteries.size())
                    .status(p.getStatus())
                    .build());
        }

        return SpaceMasteryDto.builder()
                .spaceId(space.getId())
                .spaceName(space.getName())
                .overallMasteryScore(Math.round(overallScore * 10.0) / 10.0)
                .totalConcepts(totalConcepts)
                .masteredCount(masteredCount)
                .improvingCount(improvingCount)
                .attentionCount(attentionCount)
                .weakestConcepts(weakest)
                .projectBreakdown(projectBreakdown)
                .build();
    }

    @Transactional
    public List<MasteryDto> getProjectMastery(UUID projectId, UUID userId) {
        if (!projectRepository.existsByIdAndUserId(projectId, userId)) {
            throw new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId);
        }

        List<ConceptMastery> masteries = masteryRepository.findByProjectIdAndUserId(projectId, userId);
        return masteries.stream().map(this::toDto).toList();
    }

    @Transactional
    public void recordMasteryDelta(UUID conceptId, UUID userId, double delta) {
        ConceptMastery mastery = masteryRepository.findByConceptIdAndUserId(conceptId, userId)
                .orElse(null);

        if (mastery == null) {
            Concept concept = conceptRepository.findById(conceptId).orElse(null);
            if (concept == null) return;
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;

            mastery = ConceptMastery.builder()
                    .concept(concept)
                    .user(user)
                    .project(concept.getProject())
                    .masteryScore(20.0) // Start at 20% base baseline
                    .evidenceCount(0)
                    .build();
        }

        double current = mastery.getMasteryScore() != null ? mastery.getMasteryScore() : 20.0;
        
        // Bayesian Knowledge Tracing evidence weighting:
        // When mastery is high, incremental positive evidence has diminishing returns (preventing false 100% ceiling saturation)
        // Negative evidence is weighted to distinguish between slips and genuine misunderstanding
        double adjustedDelta;
        if (delta > 0) {
            adjustedDelta = delta * Math.max(0.35, 1.0 - (current / 115.0));
        } else {
            adjustedDelta = delta * (0.6 + 0.4 * (current / 100.0));
        }

        double newScore = Math.max(5.0, Math.min(100.0, current + adjustedDelta));
        mastery.setMasteryScore(Math.round(newScore * 10.0) / 10.0);
        mastery.setEvidenceCount(mastery.getEvidenceCount() + 1);
        mastery.setLastAssessedAt(Instant.now());

        masteryRepository.save(mastery);
    }

    /**
     * Ebbinghaus forgetting curve decay calculation.
     * Models human knowledge decay over time if a concept is not periodically rehearsed.
     */
    public double applyTemporalDecay(Double storedScore, Instant lastAssessedAt) {
        if (storedScore == null || storedScore <= 0.0) return 0.0;
        if (lastAssessedAt == null) return storedScore;

        long hoursElapsed = java.time.Duration.between(lastAssessedAt, Instant.now()).toHours();
        if (hoursElapsed < 24) return storedScore; // Fresh retention within 24h

        double days = hoursElapsed / 24.0;
        // Half-life ~40 days, asymptotic floor at 20%
        double decayRate = 0.012;
        double retention = Math.exp(-decayRate * days);
        double effectiveScore = 20.0 + (storedScore - 20.0) * retention;
        return Math.round(Math.max(0.0, Math.min(100.0, effectiveScore)) * 10.0) / 10.0;
    }

    public List<ConceptMastery> getWeakestConcepts(UUID projectId, UUID userId) {
        return masteryRepository.findWeakestConcepts(projectId, userId);
    }

    public Double getAverageMastery(UUID projectId, UUID userId) {
        Double avg = masteryRepository.getAverageMastery(projectId, userId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    @Transactional
    public synchronized void ensureConceptsExist(Project project, User user) {
        try {
            if (conceptRepository.findByProjectId(project.getId()).isEmpty()) {
                String pName = project.getName();
                Concept candidate = Concept.builder()
                        .project(project)
                        .name(pName + " Core Principles")
                        .description(project.getLearningGoal() != null && !project.getLearningGoal().isBlank()
                                ? project.getLearningGoal()
                                : "Key concepts and foundational knowledge for " + pName)
                        .build();

                Concept saved = conceptRepository.save(candidate);
                ConceptMastery cm = ConceptMastery.builder()
                        .concept(saved)
                        .user(user)
                        .project(project)
                        .masteryScore(0.0)
                        .evidenceCount(0)
                        .build();
                masteryRepository.save(cm);
            }
        } catch (Exception e) {
            log.warn("Concept seeding skipped: {}", e.getMessage());
        }
    }

    public MasteryDto toDto(ConceptMastery cm) {
        int count = cm.getEvidenceCount() != null ? cm.getEvidenceCount() : 0;
        double rawScore = cm.getMasteryScore() != null ? cm.getMasteryScore() : 0.0;
        double score = count > 0 ? applyTemporalDecay(rawScore, cm.getLastAssessedAt()) : 0.0;
        
        String status;
        if (count == 0) {
            status = "UNASSESSED";
        } else if (score >= 70.0 || (count >= 2 && score >= 60.0)) {
            status = "IMPROVING";
        } else if (score < 40.0 || (count >= 1 && score < 45.0)) {
            status = "REQUIRING_ATTENTION";
        } else {
            status = "STABLE";
        }

        return MasteryDto.builder()
                .id(cm.getId())
                .conceptId(cm.getConcept().getId())
                .conceptName(cm.getConcept().getName())
                .conceptDescription(cm.getConcept().getDescription())
                .masteryScore(score)
                .growthStatus(status)
                .evidenceCount(count)
                .lastAssessedAt(cm.getLastAssessedAt())
                .updatedAt(cm.getUpdatedAt())
                .build();
    }
}
