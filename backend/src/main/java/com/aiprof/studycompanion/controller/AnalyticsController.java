package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.analytics.AnalyticsOverviewDto;
import com.aiprof.studycompanion.dto.growth.GrowthPointDto;
import com.aiprof.studycompanion.dto.project.ProjectOverviewDto;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/api/projects/{projectId}/growth")
    public ResponseEntity<ApiResponse<List<GrowthPointDto>>> getGrowthCurve(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        List<GrowthPointDto> points = analyticsService.getGrowthCurve(projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(points));
    }

    @GetMapping("/api/projects/{projectId}/overview")
    public ResponseEntity<ApiResponse<ProjectOverviewDto>> getProjectOverview(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        ProjectOverviewDto overview = analyticsService.getProjectOverview(projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(overview));
    }

    @GetMapping("/api/analytics/overview")
    public ResponseEntity<ApiResponse<AnalyticsOverviewDto>> getOverallAnalytics(
            @AuthenticationPrincipal AppUserPrincipal principal) {

        AnalyticsOverviewDto overview = analyticsService.getOverallAnalytics(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(overview));
    }
}
