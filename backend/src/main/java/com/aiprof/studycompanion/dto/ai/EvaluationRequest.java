package com.aiprof.studycompanion.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationRequest {
    private String topic;
    private String question;
    private String userResponse;
    private String projectContext;
}
