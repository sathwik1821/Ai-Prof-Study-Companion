package com.aiprof.studycompanion.dto.ai;

import lombok.Builder;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class AIRequest {
    private String feature;
    private UUID userId;
    private UUID projectId;
    private String systemPrompt;
    private String userPrompt;

    @Builder.Default
    private float temperature = 0.7f;
    @Builder.Default
    private int maxOutputTokens = 2048;

    private Map<String, Object> responseSchema;
}
