package com.aiprof.studycompanion.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChunkingService {

    public record TextChunk(int chunkIndex, int pageNumber, String text, int estimatedTokens) {}

    private static final int TARGET_WORDS = 350;
    private static final int OVERLAP_WORDS = 50;

    public List<TextChunk> chunkPages(List<PdfExtractionService.PageContent> pages) {
        List<TextChunk> result = new ArrayList<>();
        int globalChunkIndex = 0;

        for (PdfExtractionService.PageContent page : pages) {
            String text = page.text();
            if (text == null || text.isBlank()) {
                continue;
            }

            String[] words = text.split("\\s+");
            if (words.length == 0) continue;

            if (words.length <= TARGET_WORDS) {
                int tokens = (int) Math.ceil(words.length * 1.3);
                result.add(new TextChunk(globalChunkIndex++, page.pageNumber(), String.join(" ", words), tokens));
            } else {
                int start = 0;
                while (start < words.length) {
                    int end = Math.min(start + TARGET_WORDS, words.length);
                    int sliceLen = end - start;
                    String[] slice = new String[sliceLen];
                    System.arraycopy(words, start, slice, 0, sliceLen);

                    String chunkText = String.join(" ", slice);
                    int tokens = (int) Math.ceil(sliceLen * 1.3);
                    result.add(new TextChunk(globalChunkIndex++, page.pageNumber(), chunkText, tokens));

                    if (end >= words.length) {
                        break;
                    }
                    start += (TARGET_WORDS - OVERLAP_WORDS);
                }
            }
        }
        return result;
    }
}
