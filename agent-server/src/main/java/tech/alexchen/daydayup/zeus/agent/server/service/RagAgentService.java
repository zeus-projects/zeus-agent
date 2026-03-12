package tech.alexchen.daydayup.zeus.agent.server.service;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import tech.alexchen.daydayup.zeus.agent.server.dto.ChatRequest;
import tech.alexchen.daydayup.zeus.agent.server.tool.KnowledgeSearchTool;
import tech.alexchen.daydayup.zeus.agent.server.util.KbContextHolder;

import java.util.UUID;

@Service
public class RagAgentService {

    private static final String SYSTEM_PROMPT = """
            你是一个智能助手，请根据用户的历史查询记录，并严格依据提供的参考资料回答用户问题。
            如果参考资料中没有相关信息，请明确告知用户"知识库中暂无相关内容"，不要凭空捏造答案。
            如果没有提供知识库，请根据你的通用知识回答用户问题。
            回答时保持简洁准确。
            """;

    private final ChatClient.Builder chatClientBuilder;
    private final VectorStore vectorStore;
    private final KnowledgeSearchTool knowledgeSearchTool;
    private final ChatMemory chatMemory;
    private final ChatSessionService chatSessionService;

    public RagAgentService(ChatModel chatModel,
                           VectorStore vectorStore,
                           KnowledgeSearchTool knowledgeSearchTool,
                           ChatMemory chatMemory,
                           ChatSessionService chatSessionService) {
        this.chatClientBuilder = ChatClient.builder(chatModel).defaultSystem(SYSTEM_PROMPT);
        this.vectorStore = vectorStore;
        this.knowledgeSearchTool = knowledgeSearchTool;
        this.chatMemory = chatMemory;
        this.chatSessionService = chatSessionService;
    }

    public Flux<String> chatStream(ChatRequest req, HttpServletResponse response, Long userId) {
        String sessionId = req.sessionId() != null ? req.sessionId() : UUID.randomUUID().toString();
        boolean isNewSession = req.sessionId() == null;

        response.setHeader("X-Session-Id", sessionId);

        Long kbId = req.knowledgeBaseId();
        KbContextHolder.set(kbId);

        MessageChatMemoryAdvisor memoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory)
                .conversationId(sessionId)
                .build();

        ChatClient.ChatClientRequestSpec spec = chatClientBuilder.build().prompt()
                .advisors(memoryAdvisor);

        if (kbId != null) {
            FilterExpressionBuilder b = new FilterExpressionBuilder();
            QuestionAnswerAdvisor qaAdvisor = QuestionAnswerAdvisor.builder(vectorStore)
                    .searchRequest(SearchRequest.builder()
                            .topK(5)
                            .filterExpression(b.eq("knowledge_base_id", String.valueOf(kbId)).build())
                            .build())
                    .build();
            spec = spec.advisors(qaAdvisor);
        }

        final String finalSessionId = sessionId;
        final boolean finalIsNewSession = isNewSession;

        return spec
                .tools(knowledgeSearchTool)
                .user(req.message())
                .stream()
                .content()
                .doOnSubscribe(s -> {
                    if (finalIsNewSession) {
                        String title = req.message().length() > 30
                                ? req.message().substring(0, 30) + "..."
                                : req.message();
                        chatSessionService.createSession(finalSessionId, title, kbId, userId);
                    }
                })
                .doOnComplete(() -> {
                    KbContextHolder.clear();
                    chatSessionService.touchSession(finalSessionId);
                })
                .doOnError(e -> KbContextHolder.clear());
    }

    public String chat(ChatRequest req, Long userId) {
        String sessionId = req.sessionId() != null ? req.sessionId() : UUID.randomUUID().toString();
        boolean isNewSession = req.sessionId() == null;
        Long kbId = req.knowledgeBaseId();
        KbContextHolder.set(kbId);

        try {
            MessageChatMemoryAdvisor memoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory)
                    .conversationId(sessionId)
                    .build();

            ChatClient.ChatClientRequestSpec spec = chatClientBuilder.build().prompt()
                    .advisors(memoryAdvisor);

            if (kbId != null) {
                FilterExpressionBuilder b = new FilterExpressionBuilder();
                QuestionAnswerAdvisor qaAdvisor = QuestionAnswerAdvisor.builder(vectorStore)
                        .searchRequest(SearchRequest.builder()
                                .topK(5)
                                .filterExpression(b.eq("knowledge_base_id", String.valueOf(kbId)).build())
                                .build())
                        .build();
                spec = spec.advisors(qaAdvisor);
            }

            String result = spec
                    .tools(knowledgeSearchTool)
                    .user(req.message())
                    .call()
                    .content();

            if (isNewSession) {
                String title = req.message().length() > 30
                        ? req.message().substring(0, 30) + "..."
                        : req.message();
                chatSessionService.createSession(sessionId, title, kbId, userId);
            } else {
                chatSessionService.touchSession(sessionId);
            }

            return result;
        } finally {
            KbContextHolder.clear();
        }
    }
}
