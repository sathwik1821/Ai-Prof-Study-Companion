package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.Concept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConceptRepository extends JpaRepository<Concept, UUID> {
    List<Concept> findByProjectId(UUID projectId);
    Optional<Concept> findByProjectIdAndNameIgnoreCase(UUID projectId, String name);
    boolean existsByProjectIdAndName(UUID projectId, String name);
    long countByProjectId(UUID projectId);
}
