package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.AIUsageRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public interface AIUsageRepository extends JpaRepository<AIUsageRecord, UUID> {

    Page<AIUsageRecord> findByFeature(String feature, Pageable pageable);

    Page<AIUsageRecord> findByProjectIdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    @Query("SELECT r.feature as feature, COUNT(r) as callCount, SUM(r.inputTokens) as totalInputTokens, " +
           "SUM(r.outputTokens) as totalOutputTokens, AVG(r.latencyMs) as avgLatencyMs, SUM(r.estimatedCostUsd) as totalCost " +
           "FROM AIUsageRecord r GROUP BY r.feature")
    List<Map<String, Object>> getSummaryByFeature();

    @Query("SELECT COUNT(r) FROM AIUsageRecord r WHERE r.status = 'SUCCESS'")
    long countSuccessfulCalls();

    @Query("SELECT COUNT(r) FROM AIUsageRecord r WHERE r.status <> 'SUCCESS'")
    long countFailedCalls();
}
