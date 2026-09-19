package com.aiprof.studycompanion.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationResult {
    private int score; // 0 - 10
    private String understandingLevel; // NOVICE, DEVELOPING, PROFICIENT, ADVANCED
    private List<String> conceptsCovered;
    private List<String> missingConcepts;
    private String feedback;
    private String aiModelUsed;
}
