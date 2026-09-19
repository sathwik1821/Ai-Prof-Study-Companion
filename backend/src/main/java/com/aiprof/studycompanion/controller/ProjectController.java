package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.project.CreateProjectRequest;
import com.aiprof.studycompanion.dto.project.ProjectDto;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // Projects within a space
    @GetMapping("/api/spaces/{spaceId}/projects")
    public ResponseEntity<ApiResponse<List<ProjectDto>>> getProjects(
            @PathVariable UUID spaceId,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.getProjectsForSpace(spaceId, principal.getUserId())));
    }

    @PostMapping("/api/spaces/{spaceId}/projects")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(
            @PathVariable UUID spaceId,
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        ProjectDto project = projectService.createProject(spaceId, request, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(project));
    }

    // Individual project operations
    @GetMapping("/api/projects/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> getProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.getProject(id, principal.getUserId())));
    }

    @PutMapping("/api/projects/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.updateProject(id, request, principal.getUserId())));
    }

    @DeleteMapping("/api/projects/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        projectService.deleteProject(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Project deleted"));
    }
}
