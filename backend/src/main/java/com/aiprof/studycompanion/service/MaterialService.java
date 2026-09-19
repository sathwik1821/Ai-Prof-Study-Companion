package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.material.MaterialDto;
import com.aiprof.studycompanion.dto.material.MaterialStatusDto;
import com.aiprof.studycompanion.entity.Material;
import com.aiprof.studycompanion.entity.Project;
import com.aiprof.studycompanion.entity.User;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.exception.ErrorCode;
import com.aiprof.studycompanion.repository.DocumentChunkRepository;
import com.aiprof.studycompanion.repository.MaterialRepository;
import com.aiprof.studycompanion.repository.ProjectRepository;
import com.aiprof.studycompanion.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DocumentChunkRepository chunkRepository;
    private final JobSchedulerService jobSchedulerService;

    private static final String UPLOAD_DIR = "uploads";

    @Transactional
    public MaterialDto uploadMaterial(UUID projectId, UUID userId, MultipartFile file) throws IOException {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found: " + userId));

        if (file.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Uploaded file is empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Only PDF files are supported");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String uniqueFilename = UUID.randomUUID() + "_" + originalFilename;
        Path targetPath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), targetPath);

        Material material = Material.builder()
                .project(project)
                .user(user)
                .originalFilename(originalFilename)
                .storagePath(targetPath.toAbsolutePath().toString())
                .fileSizeBytes(file.getSize())
                .processingStatus("QUEUED")
                .pageCount(0)
                .chunkCount(0)
                .build();

        Material saved = materialRepository.save(material);

        // Schedule background job for extraction & embedding
        jobSchedulerService.enqueueMaterialProcessing(saved.getId(), userId, projectId);

        return toDto(saved);
    }

    public List<MaterialDto> getMaterialsByProject(UUID projectId, UUID userId) {
        requireProjectAccess(projectId, userId);
        return materialRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public MaterialDto getMaterial(UUID projectId, UUID materialId, UUID userId) {
        requireProjectAccess(projectId, userId);
        Material m = materialRepository.findByIdAndProjectId(materialId, projectId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Material not found: " + materialId));
        return toDto(m);
    }

    public MaterialStatusDto getMaterialStatus(UUID projectId, UUID materialId, UUID userId) {
        requireProjectAccess(projectId, userId);
        Material m = materialRepository.findByIdAndProjectId(materialId, projectId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Material not found: " + materialId));

        return MaterialStatusDto.builder()
                .id(m.getId())
                .status(m.getProcessingStatus())
                .pageCount(m.getPageCount())
                .chunkCount(m.getChunkCount())
                .error(m.getProcessingError())
                .build();
    }

    @Transactional
    public void deleteMaterial(UUID projectId, UUID materialId, UUID userId) {
        requireProjectAccess(projectId, userId);
        Material m = materialRepository.findByIdAndProjectId(materialId, projectId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Material not found: " + materialId));

        chunkRepository.deleteByMaterialId(materialId);
        try {
            Files.deleteIfExists(Paths.get(m.getStoragePath()));
        } catch (Exception e) {
            log.warn("Failed to delete physical file: {}", m.getStoragePath());
        }
        materialRepository.delete(m);
    }

    private void requireProjectAccess(UUID projectId, UUID userId) {
        if (!projectRepository.existsByIdAndUserId(projectId, userId)) {
            throw new AppException(ErrorCode.PROJECT_NOT_FOUND, "Project not found: " + projectId);
        }
    }

    public MaterialDto toDto(Material m) {
        return MaterialDto.builder()
                .id(m.getId())
                .projectId(m.getProject().getId())
                .originalFilename(m.getOriginalFilename())
                .fileSizeBytes(m.getFileSizeBytes())
                .processingStatus(m.getProcessingStatus())
                .processingError(m.getProcessingError())
                .pageCount(m.getPageCount())
                .chunkCount(m.getChunkCount())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
