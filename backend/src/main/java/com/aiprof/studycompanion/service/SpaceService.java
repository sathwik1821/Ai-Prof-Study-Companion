package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.space.CreateSpaceRequest;
import com.aiprof.studycompanion.dto.space.SpaceDto;
import com.aiprof.studycompanion.entity.Space;
import com.aiprof.studycompanion.entity.User;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.repository.ProjectRepository;
import com.aiprof.studycompanion.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final ProjectRepository projectRepository;
    private final UserService userService;

    public List<SpaceDto> getSpaces(UUID userId) {
        return spaceRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(s -> toDto(s, projectRepository.countBySpaceId(s.getId())))
                .toList();
    }

    public SpaceDto getSpace(UUID spaceId, UUID userId) {
        Space space = requireOwned(spaceId, userId);
        return toDto(space, projectRepository.countBySpaceId(spaceId));
    }

    @Transactional
    public SpaceDto createSpace(CreateSpaceRequest request, UUID userId) {
        User user = userService.getById(userId);
        Space space = Space.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .color(StringUtils.hasText(request.getColor()) ? request.getColor() : "#6366f1")
                .build();
        space = spaceRepository.save(space);
        return toDto(space, 0);
    }

    @Transactional
    public SpaceDto updateSpace(UUID spaceId, CreateSpaceRequest request, UUID userId) {
        Space space = requireOwned(spaceId, userId);
        if (StringUtils.hasText(request.getName()))        space.setName(request.getName());
        if (StringUtils.hasText(request.getDescription())) space.setDescription(request.getDescription());
        if (StringUtils.hasText(request.getColor()))       space.setColor(request.getColor());
        return toDto(spaceRepository.save(space), projectRepository.countBySpaceId(spaceId));
    }

    @Transactional
    public void deleteSpace(UUID spaceId, UUID userId) {
        Space space = requireOwned(spaceId, userId);
        spaceRepository.delete(space);
    }

    public Space requireOwned(UUID spaceId, UUID userId) {
        return spaceRepository.findByIdAndUserId(spaceId, userId)
                .orElseThrow(() -> AppException.notFound("Space", spaceId));
    }

    private SpaceDto toDto(Space space, long projectCount) {
        return SpaceDto.builder()
                .id(space.getId())
                .name(space.getName())
                .description(space.getDescription())
                .color(space.getColor())
                .projectCount((int) projectCount)
                .createdAt(space.getCreatedAt())
                .updatedAt(space.getUpdatedAt())
                .build();
    }
}
