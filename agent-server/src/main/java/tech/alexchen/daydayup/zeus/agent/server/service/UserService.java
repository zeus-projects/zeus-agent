package tech.alexchen.daydayup.zeus.agent.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import org.springframework.stereotype.Service;
import tech.alexchen.daydayup.zeus.agent.server.common.exception.BusinessException;
import tech.alexchen.daydayup.zeus.agent.server.domain.User;
import tech.alexchen.daydayup.zeus.agent.server.mapper.UserMapper;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public List<User> listAll() {
        return userMapper.selectList(
                Wrappers.<User>lambdaQuery().orderByAsc(User::getCreatedAt)
        );
    }

    public void setEnabled(Long id, boolean enabled) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        User update = new User();
        update.setId(id);
        update.setEnabled(enabled);
        update.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(update);
    }
}
