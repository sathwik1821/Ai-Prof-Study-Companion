package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.recommendation.RecommendationDto;
import com.aiprof.studycompanion.entity.*;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.exception.ErrorCode;
import com.aiprof.studycompanion.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ConceptRepository conceptRepository;
    private final MaterialRepository materialRepository;
    private final MasteryService masteryService;

    @Transactional
    public List<RecommendationDto> getRecommendations(UUID projectId, UUID userId) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        List<Recommendation> active = recommendationRepository.findByProjectIdAndUserIdAndStatus(projectId, userId, "ACTIVE");
        if (active.isEmpty()) {
            active = generateNextBestActions(project, user);
        }

        return active.stream().map(this::toDto).toList();
    }

    @Transactional
    public List<Recommendation> generateNextBestActions(Project project, User user) {
        List<Recommendation> recommendations = new ArrayList<>();

        long materialCount = materialRepository.countByProjectId(project.getId());
        if (materialCount == 0) {
            Recommendation uploadRec = Recommendation.builder()
                    .project(project)
                    .user(user)
                    .type("UPLOAD")
                    .title("Upload Study Materials")
                    .description("Upload your course syllabus, slides, or PDF notes to enable grounded AI tutoring and personalized quizzes.")
                    .reason("No documents have been indexed yet for this project.")
                    .priority(10)
                    .status("ACTIVE")
                    .build();
            recommendations.add(recommendationRepository.save(uploadRec));
            return recommendations;
        }

        List<ConceptMastery> weakConcepts = masteryService.getWeakestConcepts(project.getId(), user.getId());
        List<ConceptMastery> assessedWeak = weakConcepts.stream()
                .filter(m -> m.getEvidenceCount() != null && m.getEvidenceCount() > 0)
                .toList();

        if (!assessedWeak.isEmpty()) {
            ConceptMastery weakest = assessedWeak.get(0);
            Concept c = weakest.getConcept();

            if (weakest.getMasteryScore() < 40.0) {
                Recommendation tutorRec = Recommendation.builder()
                        .project(project)
                        .user(user)
                        .concept(c)
                        .type("TUTOR")
                        .title("Review " + c.getName() + " with AI Tutor")
                        .description("Your current mastery is " + Math.round(weakest.getMasteryScore()) + "%. Ask the Socratic tutor to explain foundational principles.")
                        .reason("Identified as your lowest mastery concept.")
                        .priority(9)
                        .status("ACTIVE")
                        .build();
                recommendations.add(recommendationRepository.save(tutorRec));

                Recommendation quizRec = Recommendation.builder()
                        .project(project)
                        .user(user)
                        .concept(c)
                        .type("QUIZ")
                        .title("Test Knowledge with a Quick Quiz")
                        .description("Take a 5-question adaptive multiple-choice quiz to strengthen your recall on " + c.getName() + ".")
                        .reason("Active recall is the fastest way to boost mastery.")
                        .priority(8)
                        .status("ACTIVE")
                        .build();
                recommendations.add(recommendationRepository.save(quizRec));
            } else {
                Recommendation assessRec = Recommendation.builder()
                        .project(project)
                        .user(user)
                        .concept(c)
                        .type("ASSESS")
                        .title("Complete Open-Ended Assessment")
                        .description("Demonstrate deep understanding on " + c.getName() + " through a free-form explanation.")
                        .reason("High-level synthesis validates comprehensive conceptual grasp.")
                        .priority(7)
                        .status("ACTIVE")
                        .build();
                recommendations.add(recommendationRepository.save(assessRec));
            }
        } else {
            Recommendation quizRec = Recommendation.builder()
                    .project(project)
                    .user(user)
                    .type("QUIZ")
                    .title("Take Diagnostic Quiz")
                    .description("Take a quick adaptive quiz to test your initial knowledge and benchmark your concept mastery.")
                    .reason("Benchmark your starting knowledge across " + project.getName() + ".")
                    .priority(9)
                    .status("ACTIVE")
                    .build();
            recommendations.add(recommendationRepository.save(quizRec));

            Recommendation tutorRec = Recommendation.builder()
                    .project(project)
                    .user(user)
                    .type("TUTOR")
                    .title("Explore Topics with AI Tutor")
                    .description("Ask the Socratic tutor questions about your uploaded materials to discover key concepts.")
                    .reason("Interactive dialogue accelerates conceptual understanding.")
                    .priority(8)
                    .status("ACTIVE")
                    .build();
            recommendations.add(recommendationRepository.save(tutorRec));
        }

        return recommendations;
    }

    @Transactional
    public void dismissRecommendation(UUID recommendationId, UUID userId) {
        Recommendation r = recommendationRepository.findById(recommendationId)
                .filter(rec -> rec.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Recommendation not found"));
        r.setStatus("DISMISSED");
        recommendationRepository.save(r);
    }

    @Transactional
    public void completeRecommendation(UUID recommendationId, UUID userId) {
        Recommendation r = recommendationRepository.findById(recommendationId)
                .filter(rec -> rec.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Recommendation not found"));
        r.setStatus("COMPLETED");
        recommendationRepository.save(r);
    }

    private RecommendationDto toDto(Recommendation r) {
        return RecommendationDto.builder()
                .id(r.getId())
                .type(r.getType())
                .title(r.getTitle())
                .description(r.getDescription())
                .reason(r.getReason())
                .conceptId(r.getConcept() != null ? r.getConcept().getId() : null)
                .conceptName(r.getConcept() != null ? r.getConcept().getName() : null)
                .priority(r.getPriority())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
