package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.knowledge.RetrievedChunk;
import com.aiprof.studycompanion.entity.DocumentChunk;
import com.aiprof.studycompanion.repository.DocumentChunkRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeRetrievalService {

    private final DocumentChunkRepository chunkRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper;

    /**
     * Retrieve top-K most relevant chunks for a user question strictly filtered by projectId.
     */
    public List<RetrievedChunk> retrieveRelevantChunks(UUID projectId, String query, int topK) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        List<DocumentChunk> chunks = chunkRepository.findByProjectId(projectId);
        if (chunks.isEmpty()) {
            return Collections.emptyList();
        }

        List<Float> queryEmbedding = aiService.generateEmbedding(query);
        String[] queryKeywords = query.toLowerCase().split("\\W+");

        List<RetrievedChunk> scoredChunks = new ArrayList<>();

        for (DocumentChunk chunk : chunks) {
            double cosineSim = 0.0;
            if (chunk.getEmbeddingJson() != null && !chunk.getEmbeddingJson().isBlank()) {
                try {
                    List<Float> chunkVec = objectMapper.readValue(chunk.getEmbeddingJson(), new TypeReference<List<Float>>() {});
                    cosineSim = cosineSimilarity(queryEmbedding, chunkVec);
                } catch (Exception e) {
                    log.warn("Failed to parse embedding json for chunk {}", chunk.getId());
                }
            }

            // Keyword boost for high exact-term overlap
            double keywordScore = 0.0;
            String textLower = chunk.getChunkText().toLowerCase();
            int matchCount = 0;
            for (String kw : queryKeywords) {
                if (kw.length() > 2 && textLower.contains(kw)) {
                    matchCount++;
                }
            }
            if (queryKeywords.length > 0) {
                keywordScore = (double) matchCount / Math.max(1, queryKeywords.length);
            }

            // Hybrid score: 70% vector cosine similarity + 30% lexical keyword overlap
            double finalScore = (0.7 * Math.max(0.0, cosineSim)) + (0.3 * keywordScore);

            String materialName = chunk.getMaterial() != null ? chunk.getMaterial().getOriginalFilename() : "Document";
            int pageNum = chunk.getPageNumber() != null ? chunk.getPageNumber() : 1;

            scoredChunks.add(RetrievedChunk.builder()
                    .chunkId(chunk.getId())
                    .materialId(chunk.getMaterial() != null ? chunk.getMaterial().getId() : null)
                    .materialName(materialName)
                    .pageNumber(pageNum)
                    .chunkIndex(chunk.getChunkIndex())
                    .text(chunk.getChunkText())
                    .similarityScore(finalScore)
                    .build());
        }

        scoredChunks.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));
        return scoredChunks.stream().limit(topK).toList();
    }

    private double cosineSimilarity(List<Float> vecA, List<Float> vecB) {
        if (vecA == null || vecB == null || vecA.size() != vecB.size()) {
            return 0.0;
        }
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vecA.size(); i++) {
            float a = vecA.get(i);
            float b = vecB.get(i);
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }
        if (normA <= 0 || normB <= 0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
