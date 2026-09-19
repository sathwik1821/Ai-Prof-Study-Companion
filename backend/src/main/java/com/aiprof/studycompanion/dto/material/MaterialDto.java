package com.aiprof.studycompanion.dto.material;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class MaterialDto {
    private UUID id;
    private UUID projectId;
    private String originalFilename;
    private Long fileSizeBytes;
    private String processingStatus;
    private String processingError;
    private Integer pageCount;
    private Integer chunkCount;
    private Instant createdAt;
    private Instant updatedAt;
}
