package tech.alexchen.daydayup.zeus.agent.server.controller;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import tech.alexchen.daydayup.zeus.agent.server.common.Result;
import tech.alexchen.daydayup.zeus.agent.server.dto.ChatRequest;
import tech.alexchen.daydayup.zeus.agent.server.security.SecurityUtils;
import tech.alexchen.daydayup.zeus.agent.server.service.RagAgentService;

@RestController
@RequestMapping("/agent")
public class RagAgentController {

    @Resource
    private RagAgentService ragAgentService;

    @PostMapping("/chat")
    public Result<String> chat(@RequestBody ChatRequest req) {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(ragAgentService.chat(req, userId));
    }

    @PostMapping(value = "/chat/stream", produces = "text/event-stream;charset=UTF-8")
    public Flux<String> chatStream(@RequestBody ChatRequest req, HttpServletResponse response) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ragAgentService.chatStream(req, response, userId);
    }
}
