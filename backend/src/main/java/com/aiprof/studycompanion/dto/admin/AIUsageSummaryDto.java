package com.aiprof.studycompanion.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIUsageSummaryDto {
    private String feature;
    private long totalRequests;
    private long totalInputTokens;
    private long totalOutputTokens;
    private BigDecimal totalCostUsd;
    private double avgLatencyMs;
}
