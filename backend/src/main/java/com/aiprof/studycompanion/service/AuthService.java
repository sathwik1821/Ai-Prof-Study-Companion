package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.dto.auth.AuthResponse;
import com.aiprof.studycompanion.dto.auth.LoginRequest;
import com.aiprof.studycompanion.dto.auth.LogoutRequest;
import com.aiprof.studycompanion.dto.auth.RefreshTokenRequest;
import com.aiprof.studycompanion.dto.auth.RegisterRequest;
import com.aiprof.studycompanion.dto.auth.ResendOtpRequest;
import com.aiprof.studycompanion.dto.auth.VerifyOtpRequest;
import com.aiprof.studycompanion.entity.RefreshToken;
import com.aiprof.studycompanion.entity.User;
import com.aiprof.studycompanion.exception.AppException;
import com.aiprof.studycompanion.repository.RefreshTokenRepository;
import com.aiprof.studycompanion.repository.UserRepository;
import com.aiprof.studycompanion.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

/**
 * Authentication service — registration, OTP email verification, login, refresh tokens, and logout.
 * Passwords are hashed with BCrypt before storage.
 * Issues JWT access tokens and database-persisted refresh tokens upon verification.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}") // 7 days
    private long refreshTokenExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(email);
        User user;

        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            if (existing.isEmailVerified()) {
                throw AppException.conflict("EMAIL_TAKEN", "An account with this email already exists");
            }
            // User had registered earlier but never completed OTP verification — refresh details and send new OTP
            existing.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                existing.setFullName(request.getFullName().trim());
            }
            user = existing;
        } else {
            user = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .fullName(request.getFullName() != null ? request.getFullName().trim() : null)
                    .role("USER")
                    .emailVerified(false)
                    .build();
        }

        generateAndSendOtp(user);
        log.info("New registration registered (pending OTP verification): {}", user.getEmail());

        // Return user info with emailVerified=false (no JWT token issued until OTP is confirmed)
        return AuthResponse.builder()
                .user(userService.toDto(user))
                .build();
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> AppException.notFound("User", email));

        if (user.isEmailVerified()) {
            return buildAuthResponse(user);
        }

        if (user.getOtpCode() == null || user.getOtpExpiresAt() == null) {
            throw AppException.badRequest("INVALID_OTP", "No active verification code found. Please request a new code.");
        }

        if (Instant.now().isAfter(user.getOtpExpiresAt())) {
            throw AppException.badRequest("OTP_EXPIRED", "Verification code has expired. Please request a new code.");
        }

        if (!user.getOtpCode().trim().equals(request.getOtp().trim())) {
            throw AppException.badRequest("INVALID_OTP", "Invalid verification code. Please check and try again.");
        }

        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        user = userRepository.save(user);

        log.info("User successfully verified email: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    @Transactional
    public void resendOtp(ResendOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> AppException.notFound("User", email));

        if (user.isEmailVerified()) {
            throw AppException.badRequest("ALREADY_VERIFIED", "This account is already verified. Please log in.");
        }

        // Rate limit: 30-second cooldown before requesting another OTP
        if (user.getOtpExpiresAt() != null) {
            Instant cooldownThreshold = Instant.now().plusSeconds(570); // 10m - 30s
            if (user.getOtpExpiresAt().isAfter(cooldownThreshold)) {
                throw AppException.badRequest("RATE_LIMITED", "Please wait 30 seconds before requesting another code.");
            }
        }

        generateAndSendOtp(user);
        log.info("Resent OTP verification code to: {}", user.getEmail());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> AppException.badRequest("INVALID_CREDENTIALS", "Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw AppException.badRequest("INVALID_CREDENTIALS", "Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            // Trigger a fresh OTP email automatically for smooth onboarding
            generateAndSendOtp(user);
            throw AppException.badRequest("EMAIL_NOT_VERIFIED", "Your email address is not verified yet. A new 6-digit verification code has been sent to your inbox.");
        }

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken rt = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> AppException.unauthorized("INVALID_REFRESH_TOKEN", "Refresh token not found"));

        if (rt.isRevoked()) {
            refreshTokenRepository.revokeAllUserTokens(rt.getUser());
            log.warn("Revoked refresh token reused for user: {}", rt.getUser().getEmail());
            throw AppException.unauthorized("REVOKED_REFRESH_TOKEN", "Refresh token has been revoked");
        }

        if (rt.getExpiryDate().isBefore(Instant.now())) {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
            throw AppException.unauthorized("EXPIRED_REFRESH_TOKEN", "Refresh token has expired");
        }

        rt.setRevoked(true);
        refreshTokenRepository.save(rt);

        User user = rt.getUser();
        log.info("Refreshed tokens for user: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(LogoutRequest request, UUID userId) {
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            refreshTokenRepository.findByToken(request.getRefreshToken())
                    .ifPresent(rt -> {
                        rt.setRevoked(true);
                        refreshTokenRepository.save(rt);
                    });
        }
        if (userId != null) {
            userRepository.findById(userId).ifPresent(refreshTokenRepository::revokeAllUserTokens);
        }
        log.info("Logout processed for userId: {}", userId);
    }

    private void generateAndSendOtp(User user) {
        int code = 100000 + RANDOM.nextInt(900000);
        String otpStr = String.valueOf(code);
        user.setOtpCode(otpStr);
        user.setOtpExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        userRepository.save(user);
        emailService.sendOtpEmail(user.getEmail(), otpStr, user.getFullName());
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = createRefreshToken(user);
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpirationMs)
                .user(userService.toDto(user))
                .build();
    }

    private String createRefreshToken(User user) {
        String tokenStr = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .token(tokenStr)
                .expiryDate(Instant.now().plusMillis(refreshTokenExpirationMs))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);
        return tokenStr;
    }
}
