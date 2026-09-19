package com.aiprof.studycompanion.dto.tutor;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class TutorRequest {
    @NotBlank(message = "Question is required")
    private String question;
    private UUID conversationId; // null = new conversation
}
