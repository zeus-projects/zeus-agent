package tech.alexchen.daydayup.zeus.agent.server.controller;

import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;
import tech.alexchen.daydayup.zeus.agent.server.common.Result;
import tech.alexchen.daydayup.zeus.agent.server.domain.User;
import tech.alexchen.daydayup.zeus.agent.server.dto.RegisterRequest;
import tech.alexchen.daydayup.zeus.agent.server.security.SecurityUtils;
import tech.alexchen.daydayup.zeus.agent.server.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Resource
    private AuthService authService;

    @PostMapping("/register")
    public Result<User> register(@RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return Result.success(user);
    }

    @GetMapping("/me")
    public Result<User> getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = authService.getCurrentUser(userId);
        // Clear password before returning
        user.setPasswordHash(null);
        return Result.success(user);
    }
}
