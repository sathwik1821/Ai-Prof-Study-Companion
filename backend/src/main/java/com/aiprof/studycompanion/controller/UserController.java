package com.aiprof.studycompanion.controller;

import com.aiprof.studycompanion.common.ApiResponse;
import com.aiprof.studycompanion.dto.user.UserDto;
import com.aiprof.studycompanion.security.AppUserPrincipal;
import com.aiprof.studycompanion.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> getProfile(@AuthenticationPrincipal AppUserPrincipal principal) {
        UserDto dto = userService.toDto(userService.getById(principal.getUserId()));
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
