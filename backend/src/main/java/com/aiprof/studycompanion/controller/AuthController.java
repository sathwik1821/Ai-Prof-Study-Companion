package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.auth.AuthResponse;
import com.aiprof.studycompanion.dto.auth.LoginRequest;
import com.aiprof.studycompanion.dto.auth.LogoutRequest;
import com.aiprof.studycompanion.dto.auth.RefreshTokenRequest;
import com.aiprof.studycompanion.dto.auth.RegisterRequest;
import com.aiprof.studycompanion.dto.auth.ResendOtpRequest;
import com.aiprof.studycompanion.dto.auth.VerifyOtpRequest;
import com.aiprof.studycompanion.dto.user.UserDto;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.AuthService;
import com.aiprof.studycompanion.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Registration successful. Please verify your email with the 6-digit code sent to your inbox."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Email verified successfully"));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request
    ) {
        authService.resendOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null, "A new verification code has been sent to your email"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Logged in successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) LogoutRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        UUID userId = principal != null ? principal.getUserId() : null;
        authService.logout(request, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me(
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        UserDto user = userService.toDto(userService.getById(principal.getUserId()));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * One-time admin promotion endpoint.
     * Requires a secret key header: X-Promote-Secret: aiprof-admin-secret-2026
     * Call this once while logged in to promote your account to ADMIN.
     */
    @PostMapping("/promote-admin")
    public ResponseEntity<ApiResponse<UserDto>> promoteToAdmin(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @RequestHeader("X-Promote-Secret") String secret
    ) {
        if (!"aiprof-admin-secret-2026".equals(secret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FORBIDDEN", "Invalid secret key"));
        }
        com.aiprof.studycompanion.entity.User user = userService.getById(principal.getUserId());
        user.setRole("ADMIN");
        userService.save(user);
        return ResponseEntity.ok(ApiResponse.success(userService.toDto(user), "You are now an ADMIN! Please log out and log back in."));
    }
}
