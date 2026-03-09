package tech.alexchen.daydayup.zeus.agent.server.dto;

public record ChatRequest(String message, String sessionId, Long knowledgeBaseId) {}
