package com.aiprof.studycompanion.dto.assessment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeQuestionDto {
    private String prompt;
    private String topic;
    private String hint;
    private String sourceMaterial;
    private List<String> expectedConcepts;
}
