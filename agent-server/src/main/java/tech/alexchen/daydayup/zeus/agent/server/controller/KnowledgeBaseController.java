package tech.alexchen.daydayup.zeus.agent.server.controller;

import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tech.alexchen.daydayup.zeus.agent.server.common.Result;
import tech.alexchen.daydayup.zeus.agent.server.domain.KnowledgeBase;
import tech.alexchen.daydayup.zeus.agent.server.domain.KnowledgeDocument;
import tech.alexchen.daydayup.zeus.agent.server.dto.CreateKbRequest;
import tech.alexchen.daydayup.zeus.agent.server.dto.UpdateKbRequest;
import tech.alexchen.daydayup.zeus.agent.server.security.SecurityUtils;
import tech.alexchen.daydayup.zeus.agent.server.service.KnowledgeBaseService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/knowledge-base")
public class KnowledgeBaseController {

    @Resource
    private KnowledgeBaseService knowledgeBaseService;

    @GetMapping
    public Result<List<KnowledgeBase>> listAll() {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(knowledgeBaseService.listAll(userId));
    }

    @PostMapping
    public Result<KnowledgeBase> create(@RequestBody CreateKbRequest req) {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(knowledgeBaseService.create(req.name(), req.description(), req.isPublic(), userId));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody UpdateKbRequest req) {
        Long userId = SecurityUtils.getCurrentUserId();
        knowledgeBaseService.update(id, req.name(), req.description(), req.isPublic(), userId);
        return Result.success(null);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        knowledgeBaseService.delete(id, userId);
        return Result.success(null);
    }

    @GetMapping("/{id}/documents")
    public Result<List<KnowledgeDocument>> listDocuments(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(knowledgeBaseService.listDocuments(id, userId));
    }

    @PostMapping("/{id}/documents")
    public Result<KnowledgeDocument> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(knowledgeBaseService.uploadDocument(id, file, userId));
    }

    @DeleteMapping("/{id}/documents/{docId}")
    public Result<Void> deleteDocument(@PathVariable Long id, @PathVariable Long docId) {
        Long userId = SecurityUtils.getCurrentUserId();
        knowledgeBaseService.deleteDocument(id, docId, userId);
        return Result.success(null);
    }

    @GetMapping("/{id}/retrieval")
    public Result<List<Map<String, Object>>> retrieval(
            @PathVariable Long id,
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topK) {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(knowledgeBaseService.retrieval(id, query, topK, userId));
    }
}
