package tech.alexchen.daydayup.zeus.agent.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tech.alexchen.daydayup.zeus.agent.server.common.exception.BusinessException;
import tech.alexchen.daydayup.zeus.agent.server.domain.User;
import tech.alexchen.daydayup.zeus.agent.server.dto.RegisterRequest;
import tech.alexchen.daydayup.zeus.agent.server.mapper.UserMapper;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(RegisterRequest request) {
        // Check if username exists
        Long count = userMapper.selectCount(
                Wrappers.<User>lambdaQuery().eq(User::getUsername, request.username())
        );
        if (count > 0) {
            throw new BusinessException("用户名已存在");
        }

        // Check if email exists
        count = userMapper.selectCount(
                Wrappers.<User>lambdaQuery().eq(User::getEmail, request.email())
        );
        if (count > 0) {
            throw new BusinessException("邮箱已被注册");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole("USER");
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.insert(user);

        // Clear password before returning
        user.setPasswordHash(null);
        return user;
    }

    public User getCurrentUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        return user;
    }
}
