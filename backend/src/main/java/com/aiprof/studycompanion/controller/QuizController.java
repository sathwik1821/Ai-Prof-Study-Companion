package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.quiz.QuizAnswerRequest;
import com.aiprof.studycompanion.dto.quiz.QuizAttemptDto;
import com.aiprof.studycompanion.dto.quiz.QuizQuestionDto;
import com.aiprof.studycompanion.dto.quiz.StartQuizRequest;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.QuizService;
import com.aiprof.studycompanion.security.RateLimitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final RateLimitService rateLimitService;

    @PostMapping
    public ResponseEntity<ApiResponse<QuizAttemptDto>> startQuiz(
            @PathVariable UUID projectId,
            @RequestBody(required = false) StartQuizRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        String limitKey = "user:" + principal.getId() + ":quiz";
        if (!rateLimitService.tryAcquire(limitKey, 1.0, 8.0, 0.1)) {
            int retryAfter = rateLimitService.getRetryAfterSeconds(limitKey, 1.0, 0.1);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(retryAfter))
                    .body(ApiResponse.error("Rate limit exceeded for Quiz Generation. Please wait " + retryAfter + "s before generating a new quiz.", "RATE_LIMIT_EXCEEDED"));
        }

        if (request == null) {
            request = new StartQuizRequest();
        }
        QuizAttemptDto attempt = quizService.startQuiz(projectId, principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(attempt));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuizAttemptDto>>> getQuizAttempts(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        List<QuizAttemptDto> attempts = quizService.getQuizAttempts(projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(attempts));
    }

    @GetMapping("/{attemptId}")
    public ResponseEntity<ApiResponse<QuizAttemptDto>> getQuizAttempt(
            @PathVariable UUID projectId,
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        QuizAttemptDto attempt = quizService.getQuizAttempt(attemptId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(attempt));
    }

    @PostMapping("/{attemptId}/questions/{questionId}/answer")
    public ResponseEntity<ApiResponse<QuizQuestionDto>> submitAnswer(
            @PathVariable UUID projectId,
            @PathVariable UUID attemptId,
            @PathVariable UUID questionId,
            @Valid @RequestBody QuizAnswerRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal) {

        QuizQuestionDto result = quizService.submitAnswer(attemptId, questionId, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
