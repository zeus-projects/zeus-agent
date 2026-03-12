package tech.alexchen.daydayup.zeus.agent.server.dto;

public record CreateKbRequest(
        String name,
        String description,
        Boolean isPublic
) {
    public CreateKbRequest {
        if (isPublic == null) {
            isPublic = false;
        }
    }
}
