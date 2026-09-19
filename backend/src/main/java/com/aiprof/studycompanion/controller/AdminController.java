package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.admin.AIUsageSummaryDto;
import com.aiprof.studycompanion.dto.admin.BackgroundJobDto;
import com.aiprof.studycompanion.entity.ActivityEvent;
import com.aiprof.studycompanion.entity.User;
import com.aiprof.studycompanion.repository.*;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.AIUsageService;
import com.aiprof.studycompanion.service.JobWorkerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AIUsageService aiUsageService;
    private final JobWorkerService jobWorkerService;
    private final UserRepository userRepository;
    private final SpaceRepository spaceRepository;
    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final ActivityEventRepository activityEventRepository;
    private final BackgroundJobRepository jobRepository;
    private final AIUsageRepository usageRepository;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminOverview(
            @AuthenticationPrincipal AppUserPrincipal principal) {
        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers", userRepository.count());
        data.put("totalSpaces", spaceRepository.count());
        data.put("totalProjects", projectRepository.count());
        data.put("totalMaterials", materialRepository.count());
        data.put("totalAiCalls", usageRepository.count());
        data.put("totalBackgroundJobs", jobRepository.count());
        data.put("systemHealth", "HEALTHY");
        data.put("dbStatus", "CONNECTED");
        data.put("aiStatus", "ONLINE");
        data.put("aiModel", "gemini-3.6-flash");
        data.put("embeddingModel", "gemini-embedding-001");
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAdminUsers(
            @AuthenticationPrincipal AppUserPrincipal principal) {
        List<User> all = userRepository.findAll();
        List<Map<String, Object>> result = all.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("email", u.getEmail());
            m.put("fullName", u.getFullName() != null ? u.getFullName() : "");
            m.put("role", u.getRole());
            m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt() : Instant.now());
            return m;
        }).toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<List<ActivityEvent>>> getAdminActivity(
            @AuthenticationPrincipal AppUserPrincipal principal) {
        Page<ActivityEvent> page = activityEventRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 30));
        return ResponseEntity.ok(ApiResponse.ok(page.getContent()));
    }

    @GetMapping("/usage")
    public ResponseEntity<ApiResponse<List<AIUsageSummaryDto>>> getAIUsage(
            @AuthenticationPrincipal AppUserPrincipal principal) {
        List<AIUsageSummaryDto> summary = aiUsageService.getSummaryDtos();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<List<BackgroundJobDto>>> getJobs(
            @AuthenticationPrincipal AppUserPrincipal principal) {
        List<BackgroundJobDto> jobs = jobWorkerService.getAllJobs();
        return ResponseEntity.ok(ApiResponse.ok(jobs));
    }
}
