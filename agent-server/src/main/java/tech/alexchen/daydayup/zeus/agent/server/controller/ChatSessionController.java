package tech.alexchen.daydayup.zeus.agent.server.controller;

import jakarta.annotation.Resource;
import org.springframework.ai.chat.messages.Message;
import org.springframework.web.bind.annotation.*;
import tech.alexchen.daydayup.zeus.agent.server.common.Result;
import tech.alexchen.daydayup.zeus.agent.server.dto.SessionVO;
import tech.alexchen.daydayup.zeus.agent.server.security.SecurityUtils;
import tech.alexchen.daydayup.zeus.agent.server.service.ChatSessionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/agent/sessions")
public class ChatSessionController {

    @Resource
    private ChatSessionService chatSessionService;

    @GetMapping
    public Result<List<SessionVO>> listAll() {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(chatSessionService.listAll(userId));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        Long userId = SecurityUtils.getCurrentUserId();
        chatSessionService.deleteSession(id, userId);
        return Result.success(null);
    }

    @GetMapping("/{id}/messages")
    public Result<List<Map<String, Object>>> getMessages(@PathVariable String id) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<Message> messages = chatSessionService.getMessages(id, userId);
        return Result.success(messages.stream()
                .map(msg -> Map.of(
                        "role", (Object) msg.getMessageType().getValue(),
                        "content", msg.getText()
                ))
                .toList());
    }
}
