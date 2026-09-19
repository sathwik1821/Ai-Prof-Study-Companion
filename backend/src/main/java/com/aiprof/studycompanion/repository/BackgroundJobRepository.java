package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.BackgroundJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BackgroundJobRepository extends JpaRepository<BackgroundJob, UUID> {

    @Query("SELECT j FROM BackgroundJob j WHERE j.status = 'QUEUED' AND (j.nextRetryAt IS NULL OR j.nextRetryAt <= :now) ORDER BY j.queuedAt ASC")
    List<BackgroundJob> findJobsToProcess(Instant now, Pageable pageable);

    Optional<BackgroundJob> findFirstByReferenceIdAndStatusIn(UUID referenceId, List<String> statuses);

    Page<BackgroundJob> findAllByOrderByQueuedAtDesc(Pageable pageable);

    long countByStatus(String status);
}
