package com.aiprof.studycompanion.security;

import lombok.Getter;

import java.util.UUID;

@Getter
public class AppUserPrincipal {

    private final UUID userId;
    private final String email;
    private final String role;

    public AppUserPrincipal(UUID userId, String email, String role) {
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    public UUID getId() {
        return userId;
    }

    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }
}
