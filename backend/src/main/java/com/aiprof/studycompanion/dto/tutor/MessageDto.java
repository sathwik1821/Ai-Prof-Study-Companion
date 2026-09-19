package com.aiprof.studycompanion.dto.tutor;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MessageDto {
    private UUID id;
    private String role; // USER, ASSISTANT
    private String content;
    private List<SourceReference> sources;
    private Instant createdAt;
}
