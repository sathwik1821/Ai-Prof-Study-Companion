package com.aiprof.studycompanion.dto.auth;

import com.aiprof.studycompanion.dto.user.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private UserDto user;
    private String previewOtp;
}
