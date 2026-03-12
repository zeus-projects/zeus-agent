package tech.alexchen.daydayup.zeus.agent.server.dto;

public record RegisterRequest(
        String username,
        String email,
        String password
) {
}
