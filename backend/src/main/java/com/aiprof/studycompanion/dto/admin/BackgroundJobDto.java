package com.aiprof.studycompanion.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackgroundJobDto {
    private UUID id;
    private String jobType;
    private UUID resourceId;
    private String status;
    private int attempts;
    private int maxAttempts;
    private String errorMessage;
    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;
}
