package com.aiprof.studycompanion.dto.knowledge;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetrievedChunk {
    private UUID chunkId;
    private UUID materialId;
    private String materialName;
    private int pageNumber;
    private int chunkIndex;
    private String text;
    private double similarityScore;
}
