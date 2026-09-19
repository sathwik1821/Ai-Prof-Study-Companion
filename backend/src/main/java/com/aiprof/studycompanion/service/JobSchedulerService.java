package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.entity.BackgroundJob;
import com.aiprof.studycompanion.repository.BackgroundJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobSchedulerService {

    private final BackgroundJobRepository jobRepository;

    @Transactional
    public BackgroundJob enqueueMaterialProcessing(UUID materialId, UUID userId, UUID projectId) {
        // Prevent duplicate queued/processing jobs for the same material
        Optional<BackgroundJob> existing = jobRepository.findFirstByReferenceIdAndStatusIn(
                materialId, List.of("QUEUED", "PROCESSING")
        );
        if (existing.isPresent()) {
            return existing.get();
        }

        BackgroundJob job = BackgroundJob.builder()
                .jobType("MATERIAL_PROCESSING")
                .status("QUEUED")
                .referenceId(materialId)
                .userId(userId)
                .projectId(projectId)
                .attemptCount(0)
                .maxAttempts(3)
                .build();

        return jobRepository.save(job);
    }
}
