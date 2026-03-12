package tech.alexchen.daydayup.zeus.agent.server.config;

import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.dashscope.embedding.DashScopeEmbeddingModel;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * @author alexchen
 * @since 2026-03-04 18:48
 */
@Configuration
public class ModelConfig {

    @Bean
    EmbeddingModel embeddingModel(DashScopeEmbeddingModel dashScopeEmbeddingModel) {
        return dashScopeEmbeddingModel;
    }

    @Bean
    ChatModel chatModel(DashScopeChatModel chatModel) {
        return chatModel;
    }

    @Bean
    ChatMemory chatMemory(JdbcChatMemoryRepository repo) {
        return MessageWindowChatMemory.builder()
                .chatMemoryRepository(repo)
                .maxMessages(20)
                .build();
    }
}
