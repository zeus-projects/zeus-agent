package tech.alexchen.daydayup.zeus.agent.server.controller;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import tech.alexchen.daydayup.zeus.agent.server.dto.ChatRequest;
import tech.alexchen.daydayup.zeus.agent.server.service.RagAgentService;

/**
 * RAG Agent 对话接口
 *
 * @author alexchen
 * @since 2026-03-04
 */
@RestController
@RequestMapping("/agent")
public class RagAgentController {

    @Resource
    private RagAgentService ragAgentService;

    /**
     * 普通对话
     */
    @PostMapping("/chat")
    public String chat(@RequestBody ChatRequest req) {
        return ragAgentService.chat(req);
    }

    /**
     * 流式对话（SSE）
     */
    @PostMapping(value = "/chat/stream", produces = "text/event-stream;charset=UTF-8")
    public Flux<String> chatStream(@RequestBody ChatRequest req, HttpServletResponse response) {
        return ragAgentService.chatStream(req, response);
    }
}
