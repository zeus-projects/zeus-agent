package tech.alexchen.daydayup.zeus.agent.server.tool;

import jakarta.annotation.Resource;
import org.springframework.ai.document.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;
import tech.alexchen.daydayup.zeus.agent.server.service.DocumentService;
import tech.alexchen.daydayup.zeus.agent.server.util.KbContextHolder;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 知识库检索工具，供 RAG Agent 调用
 *
 * @author alexchen
 * @since 2026-03-04
 */
@Component
public class KnowledgeSearchTool {

    @Resource
    private DocumentService documentService;

    @Tool(description = "从知识库中检索与问题相关的文档片段，当需要查询专业知识或文档内容时调用")
    public String searchKnowledge(@ToolParam(description = "检索关键词或问题") String query) {
        Long kbId = KbContextHolder.get();
        List<Document> documents = documentService.retrieval(query, 5, kbId);
        if (documents.isEmpty()) {
            return "知识库中未找到相关内容";
        }
        return documents.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n\n---\n\n"));
    }
}
