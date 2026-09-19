package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.ai.AIRequest;
import com.aiprof.studycompanion.dto.knowledge.RetrievedChunk;
import com.aiprof.studycompanion.dto.tutor.*;
import com.aiprof.studycompanion.entity.Conversation;
import com.aiprof.studycompanion.entity.Message;
import com.aiprof.studycompanion.entity.Project;
import com.aiprof.studycompanion.entity.User;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.exception.ErrorCode;
import com.aiprof.studycompanion.repository.ConversationRepository;
import com.aiprof.studycompanion.repository.MessageRepository;
import com.aiprof.studycompanion.repository.ProjectRepository;
import com.aiprof.studycompanion.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TutorService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final KnowledgeRetrievalService retrievalService;
    private final AIService aiService;
    private final MasteryService masteryService;
    private final ObjectMapper objectMapper;

    @Transactional
    public TutorResponse askTutor(UUID projectId, UUID userId, TutorRequest request) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        Conversation conversation = null;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findByIdAndUserId(request.getConversationId(), userId)
                    .filter(c -> c.getProject().getId().equals(projectId))
                    .orElse(null);
        }

        if (conversation == null) {
            String title = request.getQuestion().length() > 60
                    ? request.getQuestion().substring(0, 57) + "..."
                    : request.getQuestion();
            conversation = Conversation.builder()
                    .project(project)
                    .user(user)
                    .title(title)
                    .messageCount(0)
                    .build();
            conversation = conversationRepository.save(conversation);
        }

        // 1. Retrieve RAG chunks strictly isolated to this project
        List<RetrievedChunk> chunks = retrievalService.retrieveRelevantChunks(projectId, request.getQuestion(), 4);
        boolean hasEvidence = !chunks.isEmpty() && chunks.get(0).getSimilarityScore() >= 0.18;

        StringBuilder contextBuilder = new StringBuilder();
        List<SourceReference> sources = new ArrayList<>();

        if (hasEvidence) {
            for (RetrievedChunk chunk : chunks) {
                contextBuilder.append(String.format("--- SOURCE: [%s, Page %d] ---\n%s\n\n",
                        chunk.getMaterialName(), chunk.getPageNumber(), chunk.getText()));

                String excerpt = chunk.getText().length() > 150
                        ? chunk.getText().substring(0, 147) + "..."
                        : chunk.getText();

                sources.add(SourceReference.builder()
                        .materialName(chunk.getMaterialName())
                        .pageNumber(chunk.getPageNumber())
                        .excerpt(excerpt)
                        .build());
            }
        }

        // 2. Build PRD-compliant strict contextual isolation prompt
        String systemPrompt = String.format("""
                You are an elite, contextual AI Study Companion strictly bounded to the current project: "%s".
                
                PRD CORE DIRECTIVES & PROJECT DATA ISOLATION (PRD §3, §4, §7, §15):
                1. STRICT PROJECT ISOLATION ("CONTEXT FIRST"):
                   - You are operating exclusively within Project: "%s" (Goal: "%s").
                   - You MUST NOT access, reference, or be influenced by topics, questions, or materials from any OTHER projects (even if within the same space or user account). Unrelated project data is strictly quarantined.
                   - If the student asks about a concept from another project, or an unrelated domain not present in this project's materials:
                     You MUST explicitly state:
                     "This topic is outside the scope of the current project '%s'. Knowledge from other projects does not influence this learning journey. Please switch to the relevant project or upload matching materials to study this topic."
                2. EVIDENCE OVER GUESSING:
                   - If the project materials do NOT contain enough evidence to answer reliably, communicate uncertainty clearly rather than fabricating an answer.
                   - Current Evidence Status: %s
                3. GROUNDED CITATIONS:
                   - Cite exact sources whenever quoting or drawing upon project materials:
                     Source: [MaterialName] — Page [PageNumber]
                4. PEDAGOGY:
                   - Deliver a high-intellect, clear, and encouraging explanation with structured sections, technical definitions, practical examples, and an engaging Socratic follow-up question.
                """,
                project.getName(),
                project.getName(),
                project.getLearningGoal() != null ? project.getLearningGoal() : "Core Subject Knowledge",
                project.getName(),
                hasEvidence ? "SUFFICIENT EVIDENCE FOUND IN THIS PROJECT'S MATERIALS" : "NO RELIABLE EVIDENCE FOUND IN THIS PROJECT'S MATERIALS");

        String userPrompt = String.format("""
                Student Question: %s
                
                Project Learning Goal: %s
                
                Context from Uploaded Materials:
                %s
                """, request.getQuestion(), project.getLearningGoal() != null ? project.getLearningGoal() : "Mastery",
                hasEvidence ? contextBuilder.toString() : "No matching evidence found in the current project's materials.");

        AIRequest aiReq = AIRequest.builder()
                .feature("TUTOR")
                .userId(userId)
                .projectId(projectId)
                .systemPrompt(systemPrompt)
                .userPrompt(userPrompt)
                .temperature(0.6f)
                .maxOutputTokens(2048)
                .build();

        String answer = aiService.generateText(aiReq);

        // If response indicates out of scope or no reliable evidence, do not attach project citations
        if (answer.toLowerCase().contains("outside the scope of the current project") ||
            answer.toLowerCase().contains("no reliable evidence found")) {
            sources = Collections.emptyList();
        }

        // 3. Persist messages
        Message userMsg = Message.builder()
                .conversation(conversation)
                .role("USER")
                .content(request.getQuestion())
                .build();
        messageRepository.save(userMsg);

        String sourcesJson = null;
        try {
            sourcesJson = objectMapper.writeValueAsString(sources);
        } catch (Exception e) {
            log.warn("Failed to serialize sources json", e);
        }

        Message assistantMsg = Message.builder()
                .conversation(conversation)
                .role("ASSISTANT")
                .content(answer)
                .sourcesJson(sourcesJson)
                .build();
        messageRepository.save(assistantMsg);

        conversation.setMessageCount(conversation.getMessageCount() + 2);
        conversationRepository.save(conversation);

        // Small engagement delta to project mastery
        masteryService.ensureConceptsExist(project, user);

        return TutorResponse.builder()
                .conversationId(conversation.getId())
                .answer(answer)
                .sources(sources)
                .build();
    }

    public List<ConversationDto> getConversations(UUID projectId, UUID userId) {
        if (!projectRepository.existsByIdAndUserId(projectId, userId)) {
            throw new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId);
        }
        return conversationRepository.findByProjectIdAndUserIdOrderByUpdatedAtDesc(projectId, userId)
                .stream()
                .map(c -> ConversationDto.builder()
                        .id(c.getId())
                        .projectId(c.getProject().getId())
                        .title(c.getTitle())
                        .messageCount(c.getMessageCount())
                        .createdAt(c.getCreatedAt())
                        .updatedAt(c.getUpdatedAt())
                        .build())
                .toList();
    }

    public List<MessageDto> getMessages(UUID projectId, UUID conversationId, UUID userId) {
        Conversation conv = conversationRepository.findByIdAndUserId(conversationId, userId)
                .filter(c -> c.getProject().getId().equals(projectId))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Conversation not found or does not belong to project: " + projectId));

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(m -> {
                    List<SourceReference> sources = new ArrayList<>();
                    if (m.getSourcesJson() != null && !m.getSourcesJson().isBlank()) {
                        try {
                            sources = objectMapper.readValue(m.getSourcesJson(), new TypeReference<List<SourceReference>>() {});
                        } catch (Exception ignored) {}
                    }
                    return MessageDto.builder()
                            .id(m.getId())
                            .role(m.getRole())
                            .content(m.getContent())
                            .sources(sources)
                            .createdAt(m.getCreatedAt())
                            .build();
                })
                .toList();
    }

    @Transactional
    public void deleteConversation(UUID projectId, UUID conversationId, UUID userId) {
        Conversation conv = conversationRepository.findByIdAndUserId(conversationId, userId)
                .filter(c -> c.getProject().getId().equals(projectId))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Conversation not found or does not belong to project: " + projectId));
        messageRepository.deleteByConversationId(conversationId);
        conversationRepository.delete(conv);
    }
}
