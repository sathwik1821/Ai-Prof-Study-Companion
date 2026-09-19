package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.ActivityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {
    List<ActivityEvent> findTop20ByUserIdOrderByCreatedAtDesc(UUID userId);
    List<ActivityEvent> findTop20ByProjectIdOrderByCreatedAtDesc(UUID projectId);
    Page<ActivityEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
