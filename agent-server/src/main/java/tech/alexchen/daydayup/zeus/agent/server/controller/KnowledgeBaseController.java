package tech.alexchen.daydayup.zeus.agent.server.controller;

import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tech.alexchen.daydayup.zeus.agent.server.domain.KnowledgeBase;
import tech.alexchen.daydayup.zeus.agent.server.domain.KnowledgeDocument;
import tech.alexchen.daydayup.zeus.agent.server.dto.CreateKbRequest;
import tech.alexchen.daydayup.zeus.agent.server.dto.UpdateKbRequest;
import tech.alexchen.daydayup.zeus.agent.server.service.KnowledgeBaseService;

import java.util.List;
import java.util.Map;

/**
 * 知识库管理接口
 *
 * @author alexchen
 */
@RestController
@RequestMapping("/knowledge-base")
public class KnowledgeBaseController {

    @Resource
    private KnowledgeBaseService knowledgeBaseService;

    @GetMapping
    public List<KnowledgeBase> listAll() {
        return knowledgeBaseService.listAll();
    }

    @PostMapping
    public KnowledgeBase create(@RequestBody CreateKbRequest req) {
        return knowledgeBaseService.create(req.name(), req.description());
    }

    @PutMapping("/{id}")
    public void update(@PathVariable Long id, @RequestBody UpdateKbRequest req) {
        knowledgeBaseService.update(id, req.name(), req.description());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        knowledgeBaseService.delete(id);
    }

    @GetMapping("/{id}/documents")
    public List<KnowledgeDocument> listDocuments(@PathVariable Long id) {
        return knowledgeBaseService.listDocuments(id);
    }

    @PostMapping("/{id}/documents")
    public KnowledgeDocument uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return knowledgeBaseService.uploadDocument(id, file);
    }

    @DeleteMapping("/{id}/documents/{docId}")
    public void deleteDocument(@PathVariable Long id, @PathVariable Long docId) {
        knowledgeBaseService.deleteDocument(docId);
    }

    @GetMapping("/{id}/retrieval")
    public List<Map<String, Object>> retrieval(
            @PathVariable Long id,
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topK) {
        return knowledgeBaseService.retrieval(id, query, topK);
    }
}
