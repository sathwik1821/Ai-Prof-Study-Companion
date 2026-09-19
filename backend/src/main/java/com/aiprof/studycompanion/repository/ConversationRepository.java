package com.aiprof.studycompanion.repository;

import com.aiprof.studycompanion.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    List<Conversation> findByProjectIdAndUserIdOrderByUpdatedAtDesc(UUID projectId, UUID userId);
    Optional<Conversation> findByIdAndUserId(UUID id, UUID userId);
    Optional<Conversation> findByIdAndProjectIdAndUserId(UUID id, UUID projectId, UUID userId);
    long countByProjectId(UUID projectId);
    long countByProjectIdAndUserId(UUID projectId, UUID userId);
    long countByUserId(UUID userId);
}
