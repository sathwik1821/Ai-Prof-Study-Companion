package com.aiprof.studycompanion.dto.tutor;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TutorResponse {
    private UUID conversationId;
    private String answer;
    private List<SourceReference> sources;
}
