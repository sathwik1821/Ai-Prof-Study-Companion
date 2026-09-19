package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.project.CreateProjectRequest;
import com.aiprof.studycompanion.dto.project.ProjectDto;
import com.aiprof.studycompanion.entity.Project;
import com.aiprof.studycompanion.entity.Space;
import com.aiprof.studycompanion.entity.User;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.repository.MaterialRepository;
import com.aiprof.studycompanion.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final SpaceService spaceService;
    private final UserService userService;
    private final MaterialRepository materialRepository;
    private final MasteryService masteryService;

    public List<ProjectDto> getProjectsForSpace(UUID spaceId, UUID userId) {
        // Ownership check on space first
        spaceService.requireOwned(spaceId, userId);
        return projectRepository.findBySpaceIdAndUserIdOrderByCreatedAtDesc(spaceId, userId)
                .stream()
                .map(p -> toDto(p, userId))
                .toList();
    }

    public ProjectDto getProject(UUID projectId, UUID userId) {
        Project project = requireOwned(projectId, userId);
        return toDto(project, userId);
    }

    @Transactional
    public ProjectDto createProject(UUID spaceId, CreateProjectRequest request, UUID userId) {
        Space space = spaceService.requireOwned(spaceId, userId);
        User user = userService.getById(userId);

        Project project = Project.builder()
                .space(space)
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .learningGoal(request.getLearningGoal())
                .build();

        return toDto(projectRepository.save(project));
    }

    @Transactional
    public ProjectDto updateProject(UUID projectId, CreateProjectRequest request, UUID userId) {
        Project project = requireOwned(projectId, userId);
        if (StringUtils.hasText(request.getName()))        project.setName(request.getName());
        if (StringUtils.hasText(request.getDescription())) project.setDescription(request.getDescription());
        if (StringUtils.hasText(request.getLearningGoal())) project.setLearningGoal(request.getLearningGoal());
        return toDto(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(UUID projectId, UUID userId) {
        Project project = requireOwned(projectId, userId);
        projectRepository.delete(project);
    }

    /**
     * Authorization gate — throws 404 (not 403) to prevent enumeration attacks.
     */
    public Project requireOwned(UUID projectId, UUID userId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> AppException.notFound("Project", projectId));
    }

    public ProjectDto toDto(Project project) {
        UUID userId = project.getUser() != null ? project.getUser().getId() : null;
        return toDto(project, userId);
    }

    public ProjectDto toDto(Project project, UUID userId) {
        long matCount = materialRepository.countByProjectId(project.getId());
        double avgMastery = userId != null ? masteryService.getAverageMastery(project.getId(), userId) : 0.0;

        return ProjectDto.builder()
                .id(project.getId())
                .spaceId(project.getSpace().getId())
                .spaceName(project.getSpace().getName())
                .name(project.getName())
                .description(project.getDescription())
                .learningGoal(project.getLearningGoal())
                .status(project.getStatus())
                .materialCount(matCount)
                .averageMastery(Math.round(avgMastery * 10.0) / 10.0)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
