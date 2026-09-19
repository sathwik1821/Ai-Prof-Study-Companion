package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.mastery.MasteryDto;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.MasteryService;
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
@RequestMapping("/api/projects/{projectId}/mastery")
@RequiredArgsConstructor
public class MasteryController {

    private final MasteryService masteryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MasteryDto>>> getMastery(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        List<MasteryDto> list = masteryService.getProjectMastery(projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
}
