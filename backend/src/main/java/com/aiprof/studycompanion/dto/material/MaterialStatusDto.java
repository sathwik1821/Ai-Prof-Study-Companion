package com.aiprof.studycompanion.dto.material;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class MaterialStatusDto {
    private UUID id;
    private String status;
    private Integer pageCount;
    private Integer chunkCount;
    private String error;
}
