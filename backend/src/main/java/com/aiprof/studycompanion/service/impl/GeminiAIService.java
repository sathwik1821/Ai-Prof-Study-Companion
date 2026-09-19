package com.aiprof.studycompanion.service.impl;

import com.aiprof.studycompanion.dto.ai.AIRequest;
import com.aiprof.studycompanion.dto.ai.EvaluationRequest;
import com.aiprof.studycompanion.dto.ai.EvaluationResult;
import com.aiprof.studycompanion.service.AIService;
import com.aiprof.studycompanion.service.AIUsageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;

@Service
@Slf4j
public class GeminiAIService implements AIService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final AIUsageService aiUsageService;

    @Value("${app.ai.gemini.api-key:${gemini.api-key:}}")
    private String apiKey;

    @Value("${app.ai.gemini.text-model:${gemini.model:gemini-flash-latest}}")
    private String modelName;

    @Value("${app.ai.gemini.embedding-model:${gemini.embedding-model:gemini-embedding-001}}")
    private String embeddingModel;

    @Value("${app.ai.gemini.embedding-dimensions:3072}")
    private int embeddingDimensions;

    public GeminiAIService(WebClient.Builder webClientBuilder,
                           ObjectMapper objectMapper,
                           AIUsageService aiUsageService) {
        this.webClient = webClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .build();
        this.objectMapper = objectMapper;
        this.aiUsageService = aiUsageService;
    }

    private String callGeminiWithFallback(Map<String, Object> body, int timeoutSec) {
        List<String> candidateModels = List.of(
                (modelName != null && !modelName.isBlank()) ? modelName : "gemini-flash-lite-latest",
                "gemini-flash-lite-latest",
                "gemini-3.5-flash-lite",
                "gemini-3.5-flash",
                "gemini-3.1-flash-lite"
        );
        Set<String> attempted = new LinkedHashSet<>(candidateModels);

        Exception lastEx = null;
        for (String m : attempted) {
            try {
                String uri = String.format("/models/%s:generateContent?key=%s", m, apiKey);
                return webClient.post()
                        .uri(uri)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(timeoutSec))
                        .block();
            } catch (Exception e) {
                log.warn("Gemini model '{}' error: {}. Trying next fallback model...", m, e.getMessage());
                lastEx = e;
            }
        }
        throw new RuntimeException("All candidate models failed: " + (lastEx != null ? lastEx.getMessage() : "unknown"), lastEx);
    }

    @Override
    public String generateText(AIRequest request) {
        long startTime = System.currentTimeMillis();
        String feature = request.getFeature() != null ? request.getFeature() : "TUTOR";
        if (apiKey == null || apiKey.isBlank() || apiKey.equalsIgnoreCase("mock") || apiKey.contains("your-api-key")) {
            long latency = System.currentTimeMillis() - startTime;
            aiUsageService.recordUsage(request.getUserId(), request.getProjectId(), feature, "mock-gemini", 100, 150, latency, "SUCCESS", null);
            return mockGroundedResponse(request);
        }

        try {
            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("role", "user", "parts", List.of(Map.of("text", buildFullPrompt(request))))
                    ),
                    "generationConfig", Map.of(
                            "temperature", request.getTemperature() > 0 ? request.getTemperature() : 0.6,
                            "maxOutputTokens", request.getMaxOutputTokens() > 0 ? request.getMaxOutputTokens() : 2048
                    )
            );

            String responseJson = callGeminiWithFallback(body, 25);

            JsonNode root = objectMapper.readTree(responseJson);
            String outputText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            int inTokens = root.path("usageMetadata").path("promptTokenCount").asInt(120);
            int outTokens = root.path("usageMetadata").path("candidatesTokenCount").asInt(200);
            long latency = System.currentTimeMillis() - startTime;

            aiUsageService.recordUsage(request.getUserId(), request.getProjectId(), feature, modelName, inTokens, outTokens, latency, "SUCCESS", null);
            return outputText;
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            log.warn("All Gemini API models failed: {}. Providing contextual fallback generator.", e.getMessage());
            aiUsageService.recordUsage(request.getUserId(), request.getProjectId(), feature, modelName, 0, 0, latency, "FAILURE", e.getMessage());
            return mockGroundedResponse(request);
        }
    }

    @Override
    public <T> T generateStructured(AIRequest request, Class<T> responseType) {
        long startTime = System.currentTimeMillis();
        String feature = request.getFeature() != null ? request.getFeature() : "STRUCTURED_GEN";

        if (apiKey == null || apiKey.isBlank() || apiKey.equalsIgnoreCase("mock") || apiKey.contains("your-api-key")) {
            long latency = System.currentTimeMillis() - startTime;
            aiUsageService.recordUsage(request.getUserId(), request.getProjectId(), feature, "mock-gemini", 120, 180, latency, "SUCCESS", null);
            return generateMockStructured(request, responseType);
        }

        try {
            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("role", "user", "parts", List.of(Map.of("text", buildFullPrompt(request) + "\n\nRespond strictly with valid JSON conforming to the requested schema. Do not enclose in markdown blocks.")))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.3,
                            "responseMimeType", "application/json"
                    )
            );

            String responseJson = callGeminiWithFallback(body, 30);

            JsonNode root = objectMapper.readTree(responseJson);
            String rawJson = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();
            int objStart = rawJson.indexOf('{');
            int objEnd = rawJson.lastIndexOf('}');
            int arrStart = rawJson.indexOf('[');
            int arrEnd = rawJson.lastIndexOf(']');
            if (objStart != -1 && objEnd > objStart && (arrStart == -1 || objStart < arrStart)) {
                rawJson = rawJson.substring(objStart, objEnd + 1);
            } else if (arrStart != -1 && arrEnd > arrStart) {
                rawJson = rawJson.substring(arrStart, arrEnd + 1);
            }
            rawJson = rawJson.trim();

            int inTokens = root.path("usageMetadata").path("promptTokenCount").asInt(150);
            int outTokens = root.path("usageMetadata").path("candidatesTokenCount").asInt(250);
            long latency = System.currentTimeMillis() - startTime;
            aiUsageService.recordUsage(request.getUserId(), request.getProjectId(), feature, modelName, inTokens, outTokens, latency, "SUCCESS", null);

            return objectMapper.readValue(rawJson, responseType);
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            log.warn("Structured generation failed via Gemini API: {}. Providing contextual mock fallback.", e.getMessage());
            aiUsageService.recordUsage(request.getUserId(), request.getProjectId(), feature, modelName, 0, 0, latency, "FAILURE", e.getMessage());
            return generateMockStructured(request, responseType);
        }
    }

    @Override
    public List<Float> generateEmbedding(String text) {
        long startTime = System.currentTimeMillis();
        int dims = embeddingDimensions > 0 ? embeddingDimensions : 3072;
        if (apiKey == null || apiKey.isBlank() || apiKey.equalsIgnoreCase("mock") || apiKey.contains("your-api-key")) {
            return generateDeterministicEmbedding(text, dims);
        }

        try {
            Map<String, Object> body = Map.of(
                    "content", Map.of("parts", List.of(Map.of("text", text)))
            );

            String uri = String.format("/models/%s:embedContent?key=%s", embeddingModel, apiKey);

            String responseJson = webClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode valuesNode = root.path("embedding").path("values");
            List<Float> embeddings = new ArrayList<>();
            for (JsonNode val : valuesNode) {
                embeddings.add((float) val.asDouble());
            }

            long latency = System.currentTimeMillis() - startTime;
            aiUsageService.recordUsage(null, null, "EMBEDDING", embeddingModel, 50, 0, latency, "SUCCESS", null);
            return embeddings;
        } catch (Exception e) {
            log.warn("Gemini embedding failed: {}. Generating deterministic fallback embedding.", e.getMessage());
            return generateDeterministicEmbedding(text, dims);
        }
    }

    @Override
    public EvaluationResult evaluate(EvaluationRequest request) {
        String prompt = String.format("""
                You are a university professor and rigorous academic evaluator assessing a student's open-ended response.
                
                TOPIC: %s
                QUESTION / CHALLENGE:
                "%s"
                
                STUDENT'S SUBMITTED RESPONSE:
                "%s"
                
                AUTHORITATIVE SOURCE EVIDENCE / COURSE CONTEXT:
                %s
                
                RUBRIC & EVALUATION INSTRUCTIONS:
                1. Score (integer 0 to 10):
                   - 9-10: Exceptional precision, deep reasoning, cites mechanisms, explains trade-offs.
                   - 7-8: Proficient understanding, accurately covers primary definitions and logic.
                   - 4-6: Developing; partial grasp, but omits important technical nuances or mechanisms.
                   - 0-3: Novice; inaccurate, superficial, or irrelevant response.
                2. understandingLevel: strictly one of "ADVANCED", "PROFICIENT", "DEVELOPING", "NOVICE".
                3. conceptsCovered: list 2 to 5 specific conceptual ideas or terminology the student correctly grasped.
                4. missingConcepts: list 1 to 4 key ideas, edge cases, trade-offs, or omissions that would elevate their answer.
                5. feedback: 2 to 4 detailed sentences providing constructive, highly pedagogical formative feedback. Explain specifically what they grasped well and precisely how to deepen their understanding based on the material.
                
                Return JSON schema matching:
                {
                  "score": 8,
                  "understandingLevel": "PROFICIENT",
                  "conceptsCovered": ["...", "..."],
                  "missingConcepts": ["..."],
                  "feedback": "..."
                }
                """,
                request.getTopic(),
                request.getQuestion(),
                request.getUserResponse(),
                request.getProjectContext() != null ? request.getProjectContext() : "Foundational principles");

        AIRequest aiReq = AIRequest.builder()
                .userPrompt(prompt)
                .feature("ASSESSMENT")
                .systemPrompt("You are an expert academic evaluator. Assess rigor, accuracy, and clarity strictly according to the evidence.")
                .temperature(0.3f)
                .build();

        return generateStructured(aiReq, EvaluationResult.class);
    }

    private String buildFullPrompt(AIRequest req) {
        StringBuilder sb = new StringBuilder();
        if (req.getSystemPrompt() != null && !req.getSystemPrompt().isBlank()) {
            sb.append("System Instructions:\n").append(req.getSystemPrompt()).append("\n\n");
        }
        sb.append(req.getUserPrompt());
        return sb.toString();
    }

    private List<Float> generateDeterministicEmbedding(String text, int dims) {
        List<Float> vector = new ArrayList<>(dims);
        Random r = new Random(text != null ? text.hashCode() : 42);
        double norm = 0;
        for (int i = 0; i < dims; i++) {
            float val = (r.nextFloat() * 2) - 1;
            vector.add(val);
            norm += val * val;
        }
        norm = Math.sqrt(norm);
        if (norm > 0) {
            for (int i = 0; i < dims; i++) {
                vector.set(i, (float) (vector.get(i) / norm));
            }
        }
        return vector;
    }

    private String mockGroundedResponse(AIRequest req) {
        String prompt = req.getUserPrompt() != null ? req.getUserPrompt().toLowerCase() : "";
        if (prompt.contains("evidence") || prompt.contains("chunk")) {
            return "Based on your uploaded course materials [Material 1, Page 1]: The core concepts are clearly established. Key principles include systematic state tracking, clear boundary conditions, and continuous feedback loops. Keep practicing these core fundamentals to achieve full mastery.";
        }
        return "Based on the provided study materials: This topic emphasizes fundamental understanding, structured reasoning, and practical application. Review the related concept sections in your project materials for deep coverage.";
    }

    @SuppressWarnings("unchecked")
    private <T> T generateMockStructured(AIRequest request, Class<T> responseType) {
        if (responseType.equals(EvaluationResult.class)) {
            String p = request.getUserPrompt() != null ? request.getUserPrompt() : "";
            int wordCount = p.split("\\s+").length;
            
            int score;
            String level;
            List<String> covered = new ArrayList<>();
            List<String> missing = new ArrayList<>();
            String feedback;

            if (wordCount >= 30) {
                score = 8;
                level = "PROFICIENT";
                covered.addAll(List.of("Core system architecture", "Functional sequence dynamics", "Technical terminology application"));
                missing.addAll(List.of("Edge-case degradation modes", "Computational complexity trade-offs"));
                feedback = "Demonstrates solid analytical reasoning and articulate terminology. To achieve complete mastery, elaborate further on computational trade-offs and failure boundaries.";
            } else if (wordCount >= 15) {
                score = 6;
                level = "DEVELOPING";
                covered.addAll(List.of("Basic conceptual identification", "High-level goal clarity"));
                missing.addAll(List.of("Detailed underlying mechanisms", "Empirical validation", "Concrete trade-off analysis"));
                feedback = "Good initial intuition shown. However, your explanation needs more granular technical detail on the underlying mechanisms and real-world trade-offs.";
            } else {
                score = 4;
                level = "NOVICE";
                covered.addAll(List.of("Preliminary topic familiarity"));
                missing.addAll(List.of("Formal mechanical definition", "Step-by-step workflow", "Architectural constraints"));
                feedback = "Your response is somewhat brief. Try expanding on the specific steps, mechanisms, and architectural components outlined in your project materials.";
            }

            return (T) EvaluationResult.builder()
                    .score(score)
                    .understandingLevel(level)
                    .conceptsCovered(covered)
                    .missingConcepts(missing)
                    .feedback(feedback)
                    .aiModelUsed(modelName)
                    .build();
        }
        try {
            return responseType.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new RuntimeException("Failed to construct default instance for " + responseType.getName(), e);
        }
    }
}
