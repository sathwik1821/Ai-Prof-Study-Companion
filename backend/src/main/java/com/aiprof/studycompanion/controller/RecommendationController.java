package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.recommendation.RecommendationDto;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RecommendationDto>>> getRecommendations(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        List<RecommendationDto> list = recommendationService.getRecommendations(projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<ApiResponse<Void>> dismiss(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        recommendationService.dismissRecommendation(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Recommendation dismissed"));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Void>> complete(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        recommendationService.completeRecommendation(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Recommendation marked completed"));
    }
}
