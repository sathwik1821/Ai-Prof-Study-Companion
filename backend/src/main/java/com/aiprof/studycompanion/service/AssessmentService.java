package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.ai.EvaluationRequest;
import com.aiprof.studycompanion.dto.ai.EvaluationResult;
import com.aiprof.studycompanion.dto.assessment.AssessmentRequest;
import com.aiprof.studycompanion.dto.assessment.AssessmentResultDto;
import com.aiprof.studycompanion.entity.Assessment;
import com.aiprof.studycompanion.entity.Concept;
import com.aiprof.studycompanion.entity.Project;
import com.aiprof.studycompanion.entity.User;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.exception.ErrorCode;
import com.aiprof.studycompanion.repository.AssessmentRepository;
import com.aiprof.studycompanion.repository.ConceptRepository;
import com.aiprof.studycompanion.repository.ProjectRepository;
import com.aiprof.studycompanion.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ConceptRepository conceptRepository;
    private final MasteryService masteryService;
    private final AIService aiService;
    private final KnowledgeRetrievalService retrievalService;
    private final ObjectMapper objectMapper;
    private final com.aiprof.studycompanion.repository.MaterialRepository materialRepository;

    @Transactional
    public AssessmentResultDto submitAssessment(UUID projectId, UUID userId, AssessmentRequest request) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (materialRepository.countByProjectId(projectId) == 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "NO_MATERIALS", "Please upload study materials before taking open-ended assessments.");
        }

        masteryService.ensureConceptsExist(project, user);

        // Retrieve actual document chunks to ground the evaluation in real course material
        List<com.aiprof.studycompanion.dto.knowledge.RetrievedChunk> chunks =
                retrievalService.retrieveRelevantChunks(projectId, request.getPrompt() + " " + request.getUserResponse(), 3);

        StringBuilder ctx = new StringBuilder();
        if (project.getLearningGoal() != null) {
            ctx.append("Project Goal: ").append(project.getLearningGoal()).append("\n\n");
        }
        if (!chunks.isEmpty()) {
            ctx.append("Authoritative Course Material Excerpts:\n");
            for (var rc : chunks) {
                ctx.append(String.format("--- [%s, Page %d] ---\n%s\n\n",
                        rc.getMaterialName(), rc.getPageNumber(), rc.getText()));
            }
        }

        EvaluationRequest evalReq = EvaluationRequest.builder()
                .topic(project.getName())
                .question(request.getPrompt())
                .userResponse(request.getUserResponse())
                .projectContext(ctx.length() > 0 ? ctx.toString() : "Foundational principles and system mechanics")
                .build();

        EvaluationResult evalResult = aiService.evaluate(evalReq);

        String coveredJson = "[]";
        String missingJson = "[]";
        try {
            if (evalResult.getConceptsCovered() != null) {
                coveredJson = objectMapper.writeValueAsString(evalResult.getConceptsCovered());
            }
            if (evalResult.getMissingConcepts() != null) {
                missingJson = objectMapper.writeValueAsString(evalResult.getMissingConcepts());
            }
        } catch (Exception e) {
            log.warn("Failed to serialize concepts JSON", e);
        }

        Assessment assessment = Assessment.builder()
                .project(project)
                .user(user)
                .prompt(request.getPrompt())
                .userResponse(request.getUserResponse())
                .score(evalResult.getScore())
                .understandingLevel(evalResult.getUnderstandingLevel())
                .conceptsCoveredJson(coveredJson)
                .missingConceptsJson(missingJson)
                .feedback(evalResult.getFeedback())
                .aiModelUsed(evalResult.getAiModelUsed())
                .build();

        Assessment saved = assessmentRepository.save(assessment);

        // Update mastery delta based on score (0-10 -> scaled delta)
        double delta = (evalResult.getScore() - 4.0) * 3.5;
        List<Concept> projectConcepts = conceptRepository.findByProjectId(projectId);
        if (!projectConcepts.isEmpty()) {
            masteryService.recordMasteryDelta(projectConcepts.get(0).getId(), userId, delta);
        }

        return toDto(saved);
    }

    public List<AssessmentResultDto> getAssessments(UUID projectId, UUID userId) {
        if (!projectRepository.existsByIdAndUserId(projectId, userId)) {
            throw new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId);
        }

        return assessmentRepository.findByProjectIdAndUserIdOrderByCreatedAtDesc(projectId, userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public AssessmentResultDto getAssessment(UUID projectId, UUID assessmentId, UUID userId) {
        if (!projectRepository.existsByIdAndUserId(projectId, userId)) {
            throw new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId);
        }

        Assessment a = assessmentRepository.findById(assessmentId)
                .filter(item -> item.getUser().getId().equals(userId) && item.getProject().getId().equals(projectId))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Assessment not found"));

        return toDto(a);
    }

    public com.aiprof.studycompanion.dto.assessment.ChallengeQuestionDto generateChallenge(UUID projectId, UUID userId) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId));

        if (materialRepository.countByProjectId(projectId) == 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "NO_MATERIALS", "Please upload study materials before generating open-ended assessments.");
        }

        List<com.aiprof.studycompanion.dto.knowledge.RetrievedChunk> chunks =
                retrievalService.retrieveRelevantChunks(projectId, project.getName(), 3);
        
        String excerpt = !chunks.isEmpty()
                ? chunks.get(0).getText()
                : (project.getLearningGoal() != null ? project.getLearningGoal() : "Core subject principles");

        if (excerpt.length() > 600) {
            excerpt = excerpt.substring(0, 600) + "...";
        }

        String prompt = String.format("""
                Based on this course excerpt from project "%s":
                "%s"
                
                Generate 1 thought-provoking, deep open-ended challenge question that asks the student to analyze the system mechanics, compare techniques, or explain core trade-offs.
                CRITICAL ISOLATION RULE: The challenge question must strictly pertain to project "%s". Do NOT introduce questions, topics, or terminology from any other projects or subjects.
                Respond strictly with JSON schema:
                {
                  "prompt": "...",
                  "topic": "...",
                  "hint": "...",
                  "expectedConcepts": ["...", "..."]
                }
                """, project.getName(), excerpt, project.getName());

        com.aiprof.studycompanion.dto.ai.AIRequest aiReq = com.aiprof.studycompanion.dto.ai.AIRequest.builder()
                .feature("ASSESSMENT")
                .systemPrompt("You are an elite professor designing challenging, thought-provoking examination questions.")
                .userPrompt(prompt)
                .temperature(0.7f)
                .build();

        try {
            com.aiprof.studycompanion.dto.assessment.ChallengeQuestionDto dto =
                    aiService.generateStructured(aiReq, com.aiprof.studycompanion.dto.assessment.ChallengeQuestionDto.class);
            if (dto != null && dto.getPrompt() != null && !dto.getPrompt().isBlank()) {
                if (!chunks.isEmpty()) {
                    dto.setSourceMaterial(chunks.get(0).getMaterialName());
                }
                return dto;
            }
        } catch (Exception e) {
            log.warn("AI challenge generation failed: {}. Providing contextual fallback.", e.getMessage());
        }

        List<Concept> concepts = conceptRepository.findByProjectId(projectId);
        String conceptName = !concepts.isEmpty() ? concepts.get(new Random().nextInt(concepts.size())).getName() : project.getName();

        return com.aiprof.studycompanion.dto.assessment.ChallengeQuestionDto.builder()
                .prompt(String.format("In the context of %s, explain the primary operational mechanisms and analyze how they mitigate key bottlenecks or trade-offs.", conceptName))
                .topic(conceptName)
                .hint("Reference specific architectural components and state transitions in your answer.")
                .sourceMaterial(!chunks.isEmpty() ? chunks.get(0).getMaterialName() : "Course Materials")
                .expectedConcepts(List.of("Component interactions", "Trade-off mitigation", "Architectural flow"))
                .build();
    }

    private AssessmentResultDto toDto(Assessment a) {
        List<String> covered = Collections.emptyList();
        List<String> missing = Collections.emptyList();
        try {
            if (a.getConceptsCoveredJson() != null) {
                covered = objectMapper.readValue(a.getConceptsCoveredJson(), new TypeReference<List<String>>() {});
            }
            if (a.getMissingConceptsJson() != null) {
                missing = objectMapper.readValue(a.getMissingConceptsJson(), new TypeReference<List<String>>() {});
            }
        } catch (Exception ignored) {}

        return AssessmentResultDto.builder()
                .id(a.getId())
                .prompt(a.getPrompt())
                .userResponse(a.getUserResponse())
                .score(a.getScore() != null ? a.getScore() : 0)
                .understandingLevel(a.getUnderstandingLevel())
                .conceptsCovered(covered)
                .missingConcepts(missing)
                .feedback(a.getFeedback())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
