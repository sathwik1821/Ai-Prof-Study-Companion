package com.aiprof.studycompanion.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "user_response", nullable = false, columnDefinition = "TEXT")
    private String userResponse;

    @Column
    private Integer score; // 0 to 10

    @Column(name = "understanding_level")
    private String understandingLevel; // NOVICE, DEVELOPING, PROFICIENT, ADVANCED

    @Column(name = "concepts_covered_json", columnDefinition = "TEXT")
    private String conceptsCoveredJson;

    @Column(name = "missing_concepts_json", columnDefinition = "TEXT")
    private String missingConceptsJson;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "ai_model_used")
    private String aiModelUsed;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
