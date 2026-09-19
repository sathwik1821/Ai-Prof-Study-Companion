package com.aiprof.studycompanion.dto.tutor;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ConversationDto {
    private UUID id;
    private UUID projectId;
    private String title;
    private Integer messageCount;
    private Instant createdAt;
    private Instant updatedAt;
}
