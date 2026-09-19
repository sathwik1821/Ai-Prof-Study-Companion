package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.GrowthSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrowthSnapshotRepository extends JpaRepository<GrowthSnapshot, UUID> {
    List<GrowthSnapshot> findByProjectIdAndUserIdOrderBySnapshotDateAsc(UUID projectId, UUID userId);
    Optional<GrowthSnapshot> findByUserIdAndProjectIdAndConceptIdAndSnapshotDate(
            UUID userId, UUID projectId, UUID conceptId, LocalDate snapshotDate
    );
}
