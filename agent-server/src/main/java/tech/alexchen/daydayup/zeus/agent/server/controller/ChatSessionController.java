package tech.alexchen.daydayup.zeus.agent.server.controller;

import jakarta.annotation.Resource;
import org.springframework.ai.chat.messages.Message;
import org.springframework.web.bind.annotation.*;
import tech.alexchen.daydayup.zeus.agent.server.dto.SessionVO;
import tech.alexchen.daydayup.zeus.agent.server.service.ChatSessionService;

import java.util.List;
import java.util.Map;

/**
 * 会话管理接口
 *
 * @author alexchen
 */
@RestController
@RequestMapping("/agent/sessions")
public class ChatSessionController {

    @Resource
    private ChatSessionService chatSessionService;

    @GetMapping
    public List<SessionVO> listAll() {
        return chatSessionService.listAll();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        chatSessionService.deleteSession(id);
    }

    @GetMapping("/{id}/messages")
    public List<Map<String, Object>> getMessages(@PathVariable String id) {
        List<Message> messages = chatSessionService.getMessages(id);
        return messages.stream()
                .map(msg -> Map.of(
                        "role", (Object) msg.getMessageType().getValue(),
                        "content", msg.getText()
                ))
                .toList();
    }
}
