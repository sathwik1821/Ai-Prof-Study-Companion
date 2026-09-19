package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.assessment.AssessmentRequest;
import com.aiprof.studycompanion.dto.assessment.AssessmentResultDto;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.AssessmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AssessmentService assessmentService;

    @GetMapping("/challenge")
    public ResponseEntity<ApiResponse<com.aiprof.studycompanion.dto.assessment.ChallengeQuestionDto>> getChallenge(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        var challenge = assessmentService.generateChallenge(projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(challenge));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AssessmentResultDto>> submitAssessment(
            @PathVariable UUID projectId,
            @Valid @RequestBody AssessmentRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        AssessmentResultDto result = assessmentService.submitAssessment(projectId, principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AssessmentResultDto>>> getAssessments(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        List<AssessmentResultDto> list = assessmentService.getAssessments(projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{assessmentId}")
    public ResponseEntity<ApiResponse<AssessmentResultDto>> getAssessment(
            @PathVariable UUID projectId,
            @PathVariable UUID assessmentId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        AssessmentResultDto result = assessmentService.getAssessment(projectId, assessmentId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
