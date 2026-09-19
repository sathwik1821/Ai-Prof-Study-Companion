package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.tutor.ConversationDto;
import com.aiprof.studycompanion.dto.tutor.MessageDto;
import com.aiprof.studycompanion.dto.tutor.TutorRequest;
import com.aiprof.studycompanion.dto.tutor.TutorResponse;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.security.RateLimitService;
import com.aiprof.studycompanion.service.TutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/tutor")
@RequiredArgsConstructor
public class TutorController {

    private final TutorService tutorService;
    private final RateLimitService rateLimitService;

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<TutorResponse>> askTutor(
            @PathVariable UUID projectId,
            @Valid @RequestBody TutorRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        String limitKey = "user:" + principal.getId() + ":tutor";
        if (!rateLimitService.tryAcquire(limitKey, 1.0, 20.0, 0.4)) {
            int retryAfter = rateLimitService.getRetryAfterSeconds(limitKey, 1.0, 0.4);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(retryAfter))
                    .body(ApiResponse.error("Rate limit exceeded for AI Tutor. Please wait " + retryAfter + "s before sending another prompt.", "RATE_LIMIT_EXCEEDED"));
        }

        TutorResponse response = tutorService.askTutor(projectId, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getConversations(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        List<ConversationDto> list = tutorService.getConversations(projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getMessages(
            @PathVariable UUID projectId,
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        List<MessageDto> messages = tutorService.getMessages(projectId, conversationId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable UUID projectId,
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        tutorService.deleteConversation(projectId, conversationId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Conversation deleted"));
    }
}
