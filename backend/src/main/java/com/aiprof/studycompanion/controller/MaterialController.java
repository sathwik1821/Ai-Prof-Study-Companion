package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.material.MaterialDto;
import com.aiprof.studycompanion.dto.material.MaterialStatusDto;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/materials")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<MaterialDto>> uploadMaterial(
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AppUserPrincipal principal) throws IOException {

        MaterialDto dto = materialService.uploadMaterial(projectId, principal.getId(), file);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok(dto, "Material uploaded and queued for processing"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MaterialDto>>> listMaterials(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        List<MaterialDto> list = materialService.getMaterialsByProject(projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{materialId}")
    public ResponseEntity<ApiResponse<MaterialDto>> getMaterial(
            @PathVariable UUID projectId,
            @PathVariable UUID materialId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        MaterialDto dto = materialService.getMaterial(projectId, materialId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @GetMapping("/{materialId}/status")
    public ResponseEntity<ApiResponse<MaterialStatusDto>> getMaterialStatus(
            @PathVariable UUID projectId,
            @PathVariable UUID materialId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        MaterialStatusDto status = materialService.getMaterialStatus(projectId, materialId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @DeleteMapping("/{materialId}")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(
            @PathVariable UUID projectId,
            @PathVariable UUID materialId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        materialService.deleteMaterial(projectId, materialId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Material deleted successfully"));
    }
}
