package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.admin.BackgroundJobDto;
import com.aiprof.studycompanion.entity.BackgroundJob;
import com.aiprof.studycompanion.repository.BackgroundJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobWorkerService {

    private final BackgroundJobRepository jobRepository;
    private final MaterialProcessingService materialProcessingService;

    @Scheduled(fixedDelayString = "${app.jobs.poll-interval-ms:${jobs.poll-interval-ms:5000}}")
    public void processNextJobs() {
        List<BackgroundJob> jobs = jobRepository.findJobsToProcess(Instant.now(), PageRequest.of(0, 2));
        for (BackgroundJob job : jobs) {
            executeJob(job.getId());
        }
    }

    @Transactional
    public void executeJob(UUID jobId) {
        BackgroundJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null || !"QUEUED".equals(job.getStatus())) {
            return;
        }

        job.setStatus("PROCESSING");
        job.setStartedAt(Instant.now());
        job.setAttemptCount(job.getAttemptCount() + 1);
        jobRepository.save(job);

        try {
            if ("MATERIAL_PROCESSING".equals(job.getJobType())) {
                materialProcessingService.processMaterial(job.getReferenceId());
            }

            job.setStatus("DONE");
            job.setCompletedAt(Instant.now());
            job.setErrorMessage(null);
            jobRepository.save(job);
            log.info("Job {} completed successfully.", jobId);

        } catch (Exception e) {
            log.error("Job {} execution failed on attempt {}: {}", jobId, job.getAttemptCount(), e.getMessage());
            if (job.getAttemptCount() < job.getMaxAttempts()) {
                job.setStatus("QUEUED");
                // Linear retry backoff of 15 seconds
                job.setNextRetryAt(Instant.now().plus(15, ChronoUnit.SECONDS));
                job.setErrorMessage("Attempt " + job.getAttemptCount() + " failed: " + e.getMessage());
            } else {
                job.setStatus("FAILED");
                job.setCompletedAt(Instant.now());
                job.setErrorMessage("Failed after " + job.getAttemptCount() + " attempts: " + e.getMessage());
            }
            jobRepository.save(job);
        }
    }

    public List<BackgroundJobDto> getAllJobs() {
        return jobRepository.findAll().stream().map(j -> (BackgroundJobDto) BackgroundJobDto.builder()
                .id(j.getId())
                .jobType(j.getJobType())
                .resourceId(j.getReferenceId())
                .status(j.getStatus())
                .attempts(j.getAttemptCount())
                .maxAttempts(j.getMaxAttempts())
                .errorMessage(j.getErrorMessage())
                .createdAt(j.getQueuedAt())
                .startedAt(j.getStartedAt())
                .completedAt(j.getCompletedAt())
                .build()
        ).toList();
    }
}
