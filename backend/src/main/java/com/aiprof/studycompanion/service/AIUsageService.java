package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.admin.AIUsageSummaryDto;
import com.aiprof.studycompanion.entity.AIUsageRecord;
import com.aiprof.studycompanion.repository.AIUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIUsageService {

    private final AIUsageRepository usageRepository;

    // Pricing rates per million tokens (estimates for gemini-1.5-flash)
    private static final BigDecimal INPUT_COST_PER_M = new BigDecimal("0.075");
    private static final BigDecimal OUTPUT_COST_PER_M = new BigDecimal("0.30");

    @Async
    public void recordUsage(UUID userId, UUID projectId, String feature, String modelName,
                            int inputTokens, int outputTokens, long latencyMs,
                            String status, String errorMessage) {
        try {
            BigDecimal inCost = BigDecimal.valueOf(inputTokens)
                    .multiply(INPUT_COST_PER_M)
                    .divide(BigDecimal.valueOf(1_000_000), 6, RoundingMode.HALF_UP);
            BigDecimal outCost = BigDecimal.valueOf(outputTokens)
                    .multiply(OUTPUT_COST_PER_M)
                    .divide(BigDecimal.valueOf(1_000_000), 6, RoundingMode.HALF_UP);
            BigDecimal totalCost = inCost.add(outCost);

            AIUsageRecord record = AIUsageRecord.builder()
                    .userId(userId)
                    .projectId(projectId)
                    .feature(feature)
                    .modelName(modelName)
                    .inputTokens(inputTokens)
                    .outputTokens(outputTokens)
                    .latencyMs(latencyMs)
                    .estimatedCostUsd(totalCost)
                    .status(status)
                    .errorMessage(errorMessage)
                    .build();

            usageRepository.save(record);
        } catch (Exception e) {
            log.error("Failed to asynchronously persist AI usage record", e);
        }
    }

    public List<Map<String, Object>> getSummary() {
        return usageRepository.getSummaryByFeature();
    }

    public List<AIUsageSummaryDto> getSummaryDtos() {
        List<Map<String, Object>> raw = usageRepository.getSummaryByFeature();
        List<AIUsageSummaryDto> dtos = new ArrayList<>();
        for (Map<String, Object> r : raw) {
            String feature = (String) r.get("feature");
            long reqs = ((Number) r.getOrDefault("totalRequests", 0)).longValue();
            long inTok = ((Number) r.getOrDefault("totalInputTokens", 0)).longValue();
            long outTok = ((Number) r.getOrDefault("totalOutputTokens", 0)).longValue();
            BigDecimal cost = r.get("totalCostUsd") instanceof BigDecimal ? (BigDecimal) r.get("totalCostUsd") : BigDecimal.ZERO;
            double latency = ((Number) r.getOrDefault("avgLatencyMs", 0.0)).doubleValue();

            dtos.add(AIUsageSummaryDto.builder()
                    .feature(feature)
                    .totalRequests(reqs)
                    .totalInputTokens(inTok)
                    .totalOutputTokens(outTok)
                    .totalCostUsd(cost)
                    .avgLatencyMs(latency)
                    .build());
        }
        return dtos;
    }
}
