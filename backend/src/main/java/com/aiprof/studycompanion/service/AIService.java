package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.ai.AIRequest;
import com.aiprof.studycompanion.dto.ai.EvaluationRequest;
import com.aiprof.studycompanion.dto.ai.EvaluationResult;

import java.util.List;

/**
 * Core AI service abstraction.
 * All AI provider-specific code is contained in implementations.
 * The rest of the application depends only on this interface.
 */
public interface AIService {

    /**
     * Generate plain text response.
     */
    String generateText(AIRequest request);

    /**
     * Generate structured JSON response, parsed into the given type.
     */
    <T> T generateStructured(AIRequest request, Class<T> responseType);

    /**
     * Generate embedding vector for the given text.
     * Returns a 768-dimensional vector (text-embedding-004).
     */
    List<Float> generateEmbedding(String text);

    /**
     * Evaluate an open-ended assessment response.
     */
    EvaluationResult evaluate(EvaluationRequest request);
}
