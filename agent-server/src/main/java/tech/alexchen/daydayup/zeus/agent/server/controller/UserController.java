package tech.alexchen.daydayup.zeus.agent.server.controller;

import jakarta.annotation.Resource;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tech.alexchen.daydayup.zeus.agent.server.common.Result;
import tech.alexchen.daydayup.zeus.agent.server.domain.User;
import tech.alexchen.daydayup.zeus.agent.server.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Resource
    private UserService userService;

    @GetMapping
    public Result<List<User>> listAll() {
        List<User> users = userService.listAll();
        users.forEach(u -> u.setPasswordHash(null));
        return Result.success(users);
    }

    @PutMapping("/{id}/enable")
    public Result<Void> enable(@PathVariable Long id) {
        userService.setEnabled(id, true);
        return Result.success(null);
    }

    @PutMapping("/{id}/disable")
    public Result<Void> disable(@PathVariable Long id) {
        userService.setEnabled(id, false);
        return Result.success(null);
    }
}
