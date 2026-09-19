package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.ai.AIRequest;
import com.aiprof.studycompanion.entity.DocumentChunk;
import com.aiprof.studycompanion.entity.Material;
import com.aiprof.studycompanion.repository.DocumentChunkRepository;
import com.aiprof.studycompanion.repository.MaterialRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialProcessingService {

    private final MaterialRepository materialRepository;
    private final DocumentChunkRepository chunkRepository;
    private final PdfExtractionService pdfExtractionService;
    private final ChunkingService chunkingService;
    private final AIService aiService;
    private final ObjectMapper objectMapper;

    @Transactional
    public void processMaterial(UUID materialId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new IllegalArgumentException("Material not found: " + materialId));

        try {
            material.setProcessingStatus("PROCESSING");
            materialRepository.save(material);

            File file = new File(material.getStoragePath());
            if (!file.exists()) {
                throw new IllegalStateException("Material file not found on disk: " + material.getStoragePath());
            }

            // 1. Extract text per page
            List<PdfExtractionService.PageContent> pages = pdfExtractionService.extractPages(file);
            material.setPageCount(pages.size());

            // 2. Chunk text with sliding window
            List<ChunkingService.TextChunk> chunks = chunkingService.chunkPages(pages);
            material.setChunkCount(chunks.size());

            // Clean up existing chunks if reprocessing
            chunkRepository.deleteByMaterialId(materialId);

            // 3. Embed and store each chunk
            List<DocumentChunk> documentChunks = new ArrayList<>();
            for (ChunkingService.TextChunk chunk : chunks) {
                List<Float> embedding = aiService.generateEmbedding(chunk.text());
                String embeddingJson = objectMapper.writeValueAsString(embedding);

                DocumentChunk docChunk = DocumentChunk.builder()
                        .material(material)
                        .projectId(material.getProject().getId())
                        .chunkIndex(chunk.chunkIndex())
                        .pageNumber(chunk.pageNumber())
                        .chunkText(chunk.text())
                        .tokenCount(chunk.estimatedTokens())
                        .embeddingJson(embeddingJson)
                        .build();

                documentChunks.add(docChunk);
            }

            chunkRepository.saveAll(documentChunks);

            material.setProcessingStatus("READY");
            material.setProcessingError(null);
            materialRepository.save(material);

            log.info("Material {} successfully processed: {} pages, {} chunks created.",
                    materialId, pages.size(), chunks.size());

        } catch (Exception e) {
            log.error("Failed to process material: {}", materialId, e);
            material.setProcessingStatus("FAILED");
            material.setProcessingError(e.getMessage());
            materialRepository.save(material);
            throw new RuntimeException("Material processing failed: " + e.getMessage(), e);
        }
    }
}
