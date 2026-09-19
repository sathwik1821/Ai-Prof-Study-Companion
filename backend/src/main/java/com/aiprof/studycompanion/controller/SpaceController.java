package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.mastery.SpaceMasteryDto;
import com.aiprof.studycompanion.dto.space.CreateSpaceRequest;
import com.aiprof.studycompanion.dto.space.SpaceDto;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.MasteryService;
import com.aiprof.studycompanion.service.SpaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;
    private final MasteryService masteryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SpaceDto>>> getSpaces(
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(spaceService.getSpaces(principal.getUserId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SpaceDto>> createSpace(
            @Valid @RequestBody CreateSpaceRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        SpaceDto space = spaceService.createSpace(request, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(space));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SpaceDto>> getSpace(
            @PathVariable UUID id,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(spaceService.getSpace(id, principal.getUserId())));
    }

    @GetMapping("/{id}/mastery")
    public ResponseEntity<ApiResponse<SpaceMasteryDto>> getSpaceMastery(
            @PathVariable UUID id,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(masteryService.getSpaceMastery(id, principal.getUserId())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SpaceDto>> updateSpace(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSpaceRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(spaceService.updateSpace(id, request, principal.getUserId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSpace(
            @PathVariable UUID id,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        spaceService.deleteSpace(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Space deleted"));
    }
}
