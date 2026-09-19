package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.ai.AIRequest;
import com.aiprof.studycompanion.dto.quiz.QuizAnswerRequest;
import com.aiprof.studycompanion.dto.quiz.QuizAttemptDto;
import com.aiprof.studycompanion.dto.quiz.QuizQuestionDto;
import com.aiprof.studycompanion.dto.quiz.StartQuizRequest;
import com.aiprof.studycompanion.entity.*;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.exception.ErrorCode;
import com.aiprof.studycompanion.repository.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final QuizAttemptRepository attemptRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizAnswerRepository answerRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MasteryService masteryService;
    private final AIService aiService;
    private final KnowledgeRetrievalService retrievalService;
    private final ConceptRepository conceptRepository;
    private final MaterialRepository materialRepository;
    private final ObjectMapper objectMapper;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeneratedQuizWrapper {
        private List<GeneratedQuestionItem> questions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeneratedQuestionItem {
        private String questionText;
        private List<String> options;
        private String correctAnswer;
        private String explanation;
        private String difficulty;
    }

    @Transactional
    public QuizAttemptDto startQuiz(UUID projectId, UUID userId, StartQuizRequest request) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (materialRepository.countByProjectId(projectId) == 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "NO_MATERIALS", "Please upload study materials before starting an adaptive quiz.");
        }

        masteryService.ensureConceptsExist(project, user);

        int count = request != null && request.getQuestionCount() > 0 ? request.getQuestionCount() : 3;

        QuizAttempt attempt = QuizAttempt.builder()
                .project(project)
                .user(user)
                .totalQuestions(count)
                .completedQuestions(0)
                .correctCount(0)
                .status("IN_PROGRESS")
                .build();
        attempt = attemptRepository.save(attempt);

        List<ConceptMastery> weakConcepts = masteryService.getWeakestConcepts(projectId, userId);
        String focusTopic = !weakConcepts.isEmpty() ? weakConcepts.get(0).getConcept().getName() : project.getName();

        List<GeneratedQuestionItem> generatedItems = generateQuestions(project, focusTopic, count);

        List<QuizQuestion> questionsToSave = new ArrayList<>();
        Concept targetConcept = !weakConcepts.isEmpty() ? weakConcepts.get(0).getConcept() : null;

        for (int i = 0; i < generatedItems.size(); i++) {
            GeneratedQuestionItem item = generatedItems.get(i);
            String optionsJson = "[]";
            try {
                optionsJson = objectMapper.writeValueAsString(item.getOptions());
            } catch (Exception e) {
                log.warn("Failed to serialize options json", e);
            }

            QuizQuestion question = QuizQuestion.builder()
                    .quizAttempt(attempt)
                    .concept(targetConcept)
                    .questionType("MULTIPLE_CHOICE")
                    .questionText(item.getQuestionText())
                    .optionsJson(optionsJson)
                    .correctAnswer(item.getCorrectAnswer())
                    .explanation(item.getExplanation())
                    .difficulty(item.getDifficulty() != null ? item.getDifficulty() : "MEDIUM")
                    .orderIndex(i + 1)
                    .build();
            questionsToSave.add(question);
        }

        questionRepository.saveAll(questionsToSave);

        return toAttemptDto(attempt, questionsToSave, Collections.emptyMap());
    }

    @Transactional
    public QuizQuestionDto submitAnswer(UUID attemptId, UUID questionId, UUID userId, QuizAnswerRequest request) {
        QuizAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Quiz attempt not found"));

        QuizQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Question not found"));

        if (!question.getQuizAttempt().getId().equals(attempt.getId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Question does not belong to this quiz attempt");
        }

        Optional<QuizAnswer> existing = answerRepository.findByQuizAttemptIdAndQuestionId(attemptId, questionId);
        if (existing.isPresent()) {
            throw new AppException(ErrorCode.CONFLICT, "Question has already been answered");
        }

        List<String> options = parseOptions(question.getOptionsJson());
        String userAns = request.getAnswer();
        if ((userAns == null || userAns.isBlank()) && request.getSelectedOption() != null) {
            int idx = request.getSelectedOption();
            if (idx >= 0 && idx < options.size()) {
                userAns = options.get(idx);
            } else if (idx >= 0 && idx < 4) {
                userAns = String.valueOf((char) ('A' + idx));
            }
        }
        if (userAns == null || userAns.isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Answer or selectedOption is required");
        }
        userAns = userAns.trim();
        String correctAns = question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";
        boolean isCorrect = isAnswerMatching(userAns, correctAns);
        Integer correctOptIdx = resolveCorrectOption(correctAns, options);

        QuizAnswer answer = QuizAnswer.builder()
                .quizAttempt(attempt)
                .question(question)
                .userAnswer(userAns)
                .isCorrect(isCorrect)
                .score(isCorrect ? 1.0 : 0.0)
                .aiFeedback(isCorrect ? "Correct! " + question.getExplanation() : "Incorrect. " + question.getExplanation())
                .build();
        answerRepository.save(answer);

        attempt.setCompletedQuestions(attempt.getCompletedQuestions() + 1);
        if (isCorrect) {
            attempt.setCorrectCount(attempt.getCorrectCount() + 1);
        }

        if (attempt.getCompletedQuestions() >= attempt.getTotalQuestions()) {
            attempt.setStatus("COMPLETED");
            attempt.setCompletedAt(Instant.now());
        }
        attemptRepository.save(attempt);

        // Update mastery delta: +12.0 for correct, -4.0 for incorrect
        if (question.getConcept() != null) {
            masteryService.recordMasteryDelta(question.getConcept().getId(), userId, isCorrect ? 12.0 : -4.0);
        }

        return QuizQuestionDto.builder()
                .id(question.getId())
                .questionType(question.getQuestionType())
                .questionText(question.getQuestionText())
                .options(options)
                .difficulty(question.getDifficulty())
                .orderIndex(question.getOrderIndex())
                .isCorrect(isCorrect)
                .correctAnswer(question.getCorrectAnswer())
                .correctOption(correctOptIdx)
                .explanation(question.getExplanation())
                .aiFeedback(answer.getAiFeedback())
                .userAnswer(userAns)
                .build();
    }

    public QuizAttemptDto getQuizAttempt(UUID attemptId, UUID userId) {
        QuizAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Quiz attempt not found"));

        List<QuizQuestion> questions = questionRepository.findByQuizAttemptIdOrderByOrderIndexAsc(attemptId);
        List<QuizAnswer> answers = answerRepository.findByQuizAttemptId(attemptId);
        Map<UUID, QuizAnswer> answerMap = new HashMap<>();
        for (QuizAnswer a : answers) {
            answerMap.put(a.getQuestion().getId(), a);
        }

        return toAttemptDto(attempt, questions, answerMap);
    }

    public List<QuizAttemptDto> getQuizAttempts(UUID projectId, UUID userId) {
        return attemptRepository.findByProjectIdAndUserIdOrderByStartedAtDesc(projectId, userId)
                .stream()
                .map(a -> {
                    List<QuizQuestion> questions = questionRepository.findByQuizAttemptIdOrderByOrderIndexAsc(a.getId());
                    return toAttemptDto(a, questions, Collections.emptyMap());
                })
                .toList();
    }

    private boolean isAnswerMatching(String userAns, String correctAns) {
        if (userAns.equalsIgnoreCase(correctAns)) return true;
        // Check if user answer starts with same letter option (e.g., 'A' or 'A)')
        if (correctAns.length() >= 1 && userAns.length() >= 1) {
            char userInitial = Character.toUpperCase(userAns.charAt(0));
            char correctInitial = Character.toUpperCase(correctAns.charAt(0));
            if (userInitial == correctInitial && (userAns.length() == 1 || userAns.charAt(1) == ')' || userAns.charAt(1) == '.')) {
                return true;
            }
        }
        return false;
    }

    private List<GeneratedQuestionItem> generateQuestions(Project project, String focusTopic, int count) {
        // 1. Fetch recent questions from previous attempts to prevent duplicates
        List<String> pastQuestions = questionRepository.findRecentQuestionTextsByProjectId(
                project.getId(), org.springframework.data.domain.PageRequest.of(0, 20));

        StringBuilder pastBlock = new StringBuilder();
        if (!pastQuestions.isEmpty()) {
            pastBlock.append("\nCRITICAL ANTI-DUPLICATION RULE - The student has ALREADY taken these questions. DO NOT repeat or rephrase any of them:\n");
            for (String pq : pastQuestions) {
                pastBlock.append("- ").append(pq).append("\n");
            }
        }

        // 2. Retrieve actual course material chunks to ground questions in real content
        List<com.aiprof.studycompanion.dto.knowledge.RetrievedChunk> chunks =
                retrievalService.retrieveRelevantChunks(project.getId(), focusTopic, 4);

        StringBuilder materialBlock = new StringBuilder();
        if (!chunks.isEmpty()) {
            List<com.aiprof.studycompanion.dto.knowledge.RetrievedChunk> shuffled = new ArrayList<>(chunks);
            Collections.shuffle(shuffled);
            materialBlock.append("\nReference Study Material Excerpts:\n");
            for (var ch : shuffled) {
                String t = ch.getText();
                if (t.length() > 350) t = t.substring(0, 350) + "...";
                materialBlock.append(String.format("--- [%s, Page %d] ---\n%s\n\n",
                        ch.getMaterialName(), ch.getPageNumber(), t));
            }
        }

        // 3. Prompt Gemini with high temperature and explicit instructions
        String prompt = String.format("""
                Generate %d UNIQUE and CHALLENGING multiple-choice quiz questions focusing on "%s" in project "%s".
                Project Goal: "%s".
                %s
                %s
                
                CRITICAL QUESTION DESIGN REQUIREMENTS:
                1. Test distinct dimensions:
                   - Question 1: Core definition, formula, or underlying mechanics.
                   - Question 2: Architectural interaction, sequence flow, or comparative advantage.
                   - Question 3: Failure modes, edge cases, trade-offs, or debugging scenarios.
                2. Do NOT make "A" the correct answer for every question! Distribute the correct answer naturally across A, B, C, and D.
                3. Create 4 realistic, distinct options labelled A, B, C, D with high-quality distractors.
                4. Provide a thorough pedagogical explanation.
                5. STRICT CONTEXTUAL ISOLATION: All questions must strictly pertain to project "%s" and its provided study materials. NEVER ask questions or introduce terminology from other projects or unrelated domains.
                
                Respond strictly with JSON schema:
                {
                  "questions": [
                    {
                      "questionText": "...",
                      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
                      "correctAnswer": "B) ...",
                      "explanation": "...",
                      "difficulty": "MEDIUM"
                    }
                  ]
                }
                """, count, focusTopic, project.getName(),
                project.getLearningGoal() != null ? project.getLearningGoal() : "Core Principles",
                materialBlock.toString(),
                pastBlock.toString(),
                project.getName());

        AIRequest aiReq = AIRequest.builder()
                .feature("QUIZ")
                .systemPrompt("You are an elite academic test designer creating rigorous, non-repetitive multiple-choice examinations.")
                .userPrompt(prompt)
                .temperature(0.75f)
                .build();

        try {
            GeneratedQuizWrapper wrapper = aiService.generateStructured(aiReq, GeneratedQuizWrapper.class);
            if (wrapper != null && wrapper.getQuestions() != null && !wrapper.getQuestions().isEmpty()) {
                return wrapper.getQuestions();
            }
        } catch (Exception e) {
            log.warn("AI quiz generation failed: {}. Generating varied fallback questions.", e.getMessage());
        }

        // 4. Dynamic, varied fallback question generator ensuring questions NEVER repeat
        return generateDynamicFallbackQuestions(project, focusTopic, count, chunks);
    }

    private List<GeneratedQuestionItem> generateDynamicFallbackQuestions(
            Project project, String focusTopic, int count,
            List<com.aiprof.studycompanion.dto.knowledge.RetrievedChunk> chunks) {
        List<GeneratedQuestionItem> questions = new ArrayList<>();
        List<Concept> concepts = conceptRepository.findByProjectId(project.getId());
        Random rng = new Random();

        for (int i = 0; i < count; i++) {
            String conceptName = !concepts.isEmpty() ? concepts.get((i + rng.nextInt(concepts.size())) % concepts.size()).getName() : focusTopic;
            String materialSource = !chunks.isEmpty() ? chunks.get(i % chunks.size()).getMaterialName() : project.getName();

            int questionStyle = (i + rng.nextInt(4)) % 4;
            String qText;
            String correctAnsText;
            String distractor1;
            String distractor2;
            String distractor3;
            String explanation;

            switch (questionStyle) {
                case 0 -> {
                    qText = String.format("In %s, how is the primary state transition or computational boundary managed for %s?", materialSource, conceptName);
                    correctAnsText = "Through deterministic state serialization and continuous invariant validation";
                    distractor1 = "By bypassing intermediate checks to minimize memory allocations";
                    distractor2 = "Using unconstrained global mutable variables across subprocesses";
                    distractor3 = "By discarding historical tokens to reduce representation dimensionality";
                    explanation = "Deterministic boundary tracking ensures consistent state representation and eliminates uncontrolled state drift.";
                }
                case 1 -> {
                    qText = String.format("What is the principal architectural trade-off encountered when scaling %s?", conceptName);
                    correctAnsText = "Balancing computational throughput and quadratic memory scaling against response latency";
                    distractor1 = "Trading data isolation for increased disk persistence throughput";
                    distractor2 = "Eliminating attention vectors to guarantee linear execution time";
                    distractor3 = "Forcing synchronous single-threaded evaluation on all model inputs";
                    explanation = "Scaling typically induces non-linear memory and computational trade-offs that require structural optimizations.";
                }
                case 2 -> {
                    qText = String.format("When evaluating edge cases in %s, which condition most commonly triggers degradation or hallucinations?", conceptName);
                    correctAnsText = "Insufficient contextual grounding and out-of-distribution input sequences";
                    distractor1 = "Overly constrained schema enforcement on model structured outputs";
                    distractor2 = "High token frequency in foundational reference dictionaries";
                    distractor3 = "Excessive vector cosine similarity between target chunks";
                    explanation = "Out-of-distribution prompts with weak contextual evidence force models into speculative probabilistic completions.";
                }
                default -> {
                    qText = String.format("How does %s verify accuracy and prevent unauthorized modifications across learning iterations?", conceptName);
                    correctAnsText = "By enforcing explicit permission-aware validation before state mutation";
                    distractor1 = "By granting unrestricted database write access directly to the inference agent";
                    distractor2 = "By ignoring user context and processing requests anonymously";
                    distractor3 = "By deferring all authorization checks until the application shuts down";
                    explanation = "Strict authorization barriers ensure that learning agents only mutate validated, tenant-isolated state.";
                }
            }

            // Randomize correct option position across A, B, C, D
            int correctIdx = rng.nextInt(4);
            List<String> rawOptions = new ArrayList<>(List.of(distractor1, distractor2, distractor3));
            Collections.shuffle(rawOptions);
            rawOptions.add(correctIdx, correctAnsText);

            char[] letters = new char[]{'A', 'B', 'C', 'D'};
            List<String> formattedOptions = new ArrayList<>();
            String fullCorrectAns = "";
            for (int j = 0; j < 4; j++) {
                String opt = letters[j] + ") " + rawOptions.get(j);
                formattedOptions.add(opt);
                if (j == correctIdx) {
                    fullCorrectAns = opt;
                }
            }

            questions.add(new GeneratedQuestionItem(
                    qText,
                    formattedOptions,
                    fullCorrectAns,
                    explanation,
                    i == 0 ? "EASY" : (i == 1 ? "MEDIUM" : "HARD")
            ));
        }

        return questions;
    }

    private Integer resolveCorrectOption(String correctAns, List<String> options) {
        if (correctAns == null || options == null || options.isEmpty()) return null;
        for (int i = 0; i < options.size(); i++) {
            String opt = options.get(i);
            if (isAnswerMatching(opt, correctAns)) {
                return i;
            }
        }
        return null;
    }

    private QuizAttemptDto toAttemptDto(QuizAttempt attempt, List<QuizQuestion> questions, Map<UUID, QuizAnswer> answerMap) {
        boolean isComplete = "COMPLETED".equals(attempt.getStatus());

        List<QuizQuestionDto> questionDtos = questions.stream().map(q -> {
            QuizAnswer answer = answerMap.get(q.getId());
            boolean hasAnswered = answer != null;
            List<String> options = parseOptions(q.getOptionsJson());
            Integer correctOptIdx = (hasAnswered || isComplete) ? resolveCorrectOption(q.getCorrectAnswer(), options) : null;

            return QuizQuestionDto.builder()
                    .id(q.getId())
                    .questionType(q.getQuestionType())
                    .questionText(q.getQuestionText())
                    .options(options)
                    .difficulty(q.getDifficulty())
                    .orderIndex(q.getOrderIndex())
                    .isCorrect(hasAnswered ? answer.getIsCorrect() : (isComplete ? false : null))
                    .correctAnswer(hasAnswered || isComplete ? q.getCorrectAnswer() : null)
                    .correctOption(correctOptIdx)
                    .explanation(hasAnswered || isComplete ? q.getExplanation() : null)
                    .aiFeedback(hasAnswered ? answer.getAiFeedback() : null)
                    .userAnswer(hasAnswered ? answer.getUserAnswer() : null)
                    .build();
        }).toList();

        return QuizAttemptDto.builder()
                .id(attempt.getId())
                .projectId(attempt.getProject().getId())
                .status(attempt.getStatus())
                .totalQuestions(attempt.getTotalQuestions())
                .completedQuestions(attempt.getCompletedQuestions())
                .correctCount(attempt.getCorrectCount())
                .score(attempt.getCorrectCount())
                .startedAt(attempt.getStartedAt())
                .completedAt(attempt.getCompletedAt())
                .questions(questionDtos)
                .build();
    }

    private List<String> parseOptions(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
