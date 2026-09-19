package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.ConceptMastery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConceptMasteryRepository extends JpaRepository<ConceptMastery, UUID> {

    List<ConceptMastery> findByProjectIdAndUserId(UUID projectId, UUID userId);

    Optional<ConceptMastery> findByConceptIdAndUserId(UUID conceptId, UUID userId);

    @Query("SELECT cm FROM ConceptMastery cm WHERE cm.project.id = :projectId AND cm.user.id = :userId ORDER BY cm.masteryScore ASC")
    List<ConceptMastery> findWeakestConcepts(@Param("projectId") UUID projectId, @Param("userId") UUID userId);

    @Query("SELECT AVG(cm.masteryScore) FROM ConceptMastery cm WHERE cm.project.id = :projectId AND cm.user.id = :userId AND cm.evidenceCount > 0")
    Double getAverageMastery(@Param("projectId") UUID projectId, @Param("userId") UUID userId);

    @Query("SELECT cm FROM ConceptMastery cm WHERE cm.project.space.id = :spaceId AND cm.user.id = :userId")
    List<ConceptMastery> findBySpaceIdAndUserId(@Param("spaceId") UUID spaceId, @Param("userId") UUID userId);

    @Query("SELECT cm FROM ConceptMastery cm WHERE cm.project.space.id = :spaceId AND cm.user.id = :userId ORDER BY cm.masteryScore ASC")
    List<ConceptMastery> findWeakestConceptsBySpace(@Param("spaceId") UUID spaceId, @Param("userId") UUID userId);

    @Query("SELECT AVG(cm.masteryScore) FROM ConceptMastery cm WHERE cm.project.space.id = :spaceId AND cm.user.id = :userId AND cm.evidenceCount > 0")
    Double getAverageMasteryBySpace(@Param("spaceId") UUID spaceId, @Param("userId") UUID userId);

    @Query("SELECT AVG(cm.masteryScore) FROM ConceptMastery cm WHERE cm.user.id = :userId AND cm.evidenceCount > 0")
    Double getAverageMasteryByUser(@Param("userId") UUID userId);

    @Query("SELECT cm FROM ConceptMastery cm JOIN FETCH cm.concept JOIN FETCH cm.project p JOIN FETCH p.space WHERE cm.user.id = :userId ORDER BY cm.masteryScore ASC")
    List<ConceptMastery> findWeakestConceptsByUser(@Param("userId") UUID userId);
}
