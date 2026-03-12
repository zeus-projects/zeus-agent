package tech.alexchen.daydayup.zeus.agent.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import tech.alexchen.daydayup.zeus.agent.server.domain.User;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
