package tech.alexchen.daydayup.zeus.agent.server.controller;

import jakarta.annotation.Resource;
import org.springframework.ai.document.Document;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import tech.alexchen.daydayup.zeus.agent.server.service.DocumentService;

import java.util.List;
import java.util.Map;

/**
 * 使用 Tika 将文档向量化，存入向量数据库
 *
 * @author alexchen
 * @since 2026-03-04 17:30
 */
@RestController
@RequestMapping("/document")
public class DocumentController {

    @Resource
    private DocumentService documentService;

    /**
     * 上传文件并向量化写入知识库
     *
     * @param file 上传的文档（PDF、Word、TXT 等）
     * @return 写入的分块数量
     */
    @PostMapping("/embedding")
    public String embedFile(@RequestParam("file") MultipartFile file) {
        int count = documentService.embed(file);
        return "文件向量化完成，共写入 " + count + " 个分块";
    }

    /**
     * 向量相似度召回测试
     *
     * @param query 查询文本
     * @param topK  返回结果数，默认 5
     * @return 匹配的文档片段（含 content 和 metadata）
     */
    @GetMapping("/retrieval")
    public List<Map<String, Object>> retrieval(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topK) {
        List<Document> documents = documentService.retrieval(query, topK);
        return documents.stream()
                .filter(i -> i != null && i.getText() != null)
                .map(doc -> Map.of(
                        "content", doc.getText(),
                        "metadata", doc.getMetadata()
                ))
                .toList();
    }
}
