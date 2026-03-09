package tech.alexchen.daydayup.zeus.agent.server.dto;

import java.time.LocalDateTime;

public record SessionVO(String id, String title, Long kbId, LocalDateTime createdAt, LocalDateTime updatedAt) {}
