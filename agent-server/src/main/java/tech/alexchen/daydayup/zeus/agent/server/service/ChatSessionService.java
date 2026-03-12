package tech.alexchen.daydayup.zeus.agent.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.stereotype.Service;
import tech.alexchen.daydayup.zeus.agent.server.common.exception.BusinessException;
import tech.alexchen.daydayup.zeus.agent.server.domain.ChatSession;
import tech.alexchen.daydayup.zeus.agent.server.dto.SessionVO;
import tech.alexchen.daydayup.zeus.agent.server.mapper.ChatSessionMapper;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatSessionService {

    private final ChatSessionMapper sessionMapper;
    private final ChatMemory chatMemory;

    public ChatSessionService(ChatSessionMapper sessionMapper, ChatMemory chatMemory) {
        this.sessionMapper = sessionMapper;
        this.chatMemory = chatMemory;
    }

    public List<SessionVO> listAll(Long userId) {
        return sessionMapper.selectList(
                Wrappers.<ChatSession>lambdaQuery()
                        .eq(ChatSession::getUserId, userId)
                        .orderByDesc(ChatSession::getUpdatedAt)
        ).stream().map(s -> new SessionVO(
                s.getId(), s.getUserId(), s.getTitle(), s.getKbId(), s.getCreatedAt(), s.getUpdatedAt()
        )).toList();
    }

    public void createSession(String id, String title, Long kbId, Long userId) {
        ChatSession session = new ChatSession();
        session.setId(id);
        session.setTitle(title);
        session.setKbId(kbId);
        session.setUserId(userId);
        session.setCreatedAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        sessionMapper.insert(session);
    }

    public void touchSession(String id) {
        ChatSession session = new ChatSession();
        session.setId(id);
        session.setUpdatedAt(LocalDateTime.now());
        sessionMapper.updateById(session);
    }

    public void deleteSession(String id, Long userId) {
        ChatSession session = sessionMapper.selectById(id);
        if (session == null) {
            throw new BusinessException("会话不存在");
        }
        if (!session.getUserId().equals(userId)) {
            throw new BusinessException("无权删除此会话");
        }
        chatMemory.clear(id);
        sessionMapper.deleteById(id);
    }

    public List<Message> getMessages(String sessionId, Long userId) {
        ChatSession session = sessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException("会话不存在");
        }
        if (!session.getUserId().equals(userId)) {
            throw new BusinessException("无权访问此会话");
        }
        return chatMemory.get(sessionId);
    }
}
