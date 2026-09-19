package com.aiprof.studycompanion.dto.user;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class UserDto {
    private UUID id;
    private String email;
    private String fullName;
    private String role;
    private boolean emailVerified;
    private Instant createdAt;
}
