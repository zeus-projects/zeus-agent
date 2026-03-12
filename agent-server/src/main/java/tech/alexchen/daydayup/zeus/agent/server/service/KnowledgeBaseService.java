package tech.alexchen.daydayup.zeus.agent.server.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tech.alexchen.daydayup.zeus.agent.server.common.exception.BusinessException;
import tech.alexchen.daydayup.zeus.agent.server.domain.KnowledgeBase;
import tech.alexchen.daydayup.zeus.agent.server.domain.KnowledgeDocument;
import tech.alexchen.daydayup.zeus.agent.server.mapper.KnowledgeBaseMapper;
import tech.alexchen.daydayup.zeus.agent.server.mapper.KnowledgeDocumentMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class KnowledgeBaseService {

    private final KnowledgeBaseMapper kbMapper;
    private final KnowledgeDocumentMapper docMapper;
    private final DocumentService documentService;

    public KnowledgeBaseService(KnowledgeBaseMapper kbMapper,
                                KnowledgeDocumentMapper docMapper,
                                DocumentService documentService) {
        this.kbMapper = kbMapper;
        this.docMapper = docMapper;
        this.documentService = documentService;
    }

    /**
     * List all knowledge bases accessible to the user:
     * - User's own knowledge bases
     * - Public knowledge bases from other users
     */
    public List<KnowledgeBase> listAll(Long currentUserId) {
        return kbMapper.selectList(
                Wrappers.<KnowledgeBase>lambdaQuery()
                        .and(wrapper -> wrapper
                                .eq(KnowledgeBase::getUserId, currentUserId)
                                .or()
                                .eq(KnowledgeBase::getIsPublic, true)
                        )
                        .orderByDesc(KnowledgeBase::getCreatedAt)
        );
    }

    /**
     * Create a new knowledge base for the user
     */
    public KnowledgeBase create(String name, String description, Boolean isPublic, Long userId) {
        KnowledgeBase kb = new KnowledgeBase();
        kb.setName(name);
        kb.setDescription(description);
        kb.setIsPublic(isPublic != null ? isPublic : false);
        kb.setUserId(userId);
        kb.setCreatedAt(LocalDateTime.now());
        kb.setUpdatedAt(LocalDateTime.now());
        kbMapper.insert(kb);
        return kb;
    }

    /**
     * Update a knowledge base (only owner can update)
     */
    public void update(Long id, String name, String description, Boolean isPublic, Long userId) {
        KnowledgeBase existing = kbMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("知识库不存在");
        }
        if (!existing.getUserId().equals(userId)) {
            throw new BusinessException("无权修改此知识库");
        }

        KnowledgeBase kb = new KnowledgeBase();
        kb.setId(id);
        kb.setName(name);
        kb.setDescription(description);
        kb.setIsPublic(isPublic);
        kbMapper.updateById(kb);
    }

    /**
     * Delete a knowledge base (only owner can delete)
     */
    public void delete(Long id, Long userId) {
        KnowledgeBase existing = kbMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("知识库不存在");
        }
        if (!existing.getUserId().equals(userId)) {
            throw new BusinessException("无权删除此知识库");
        }
        kbMapper.deleteById(id);
    }

    /**
     * List documents for a knowledge base (user must have access)
     */
    public List<KnowledgeDocument> listDocuments(Long kbId, Long userId) {
        KnowledgeBase kb = kbMapper.selectById(kbId);
        if (kb == null) {
            throw new BusinessException("知识库不存在");
        }
        if (!kb.getUserId().equals(userId) && !kb.getIsPublic()) {
            throw new BusinessException("无权访问此知识库");
        }

        LambdaQueryWrapper<KnowledgeDocument> wrapper = Wrappers.<KnowledgeDocument>lambdaQuery()
                .eq(KnowledgeDocument::getKbId, kbId)
                .orderByDesc(KnowledgeDocument::getCreatedAt);
        return docMapper.selectList(wrapper);
    }

    /**
     * Upload a document to a knowledge base (only owner can upload)
     */
    public KnowledgeDocument uploadDocument(Long kbId, MultipartFile file, Long userId) {
        KnowledgeBase kb = kbMapper.selectById(kbId);
        if (kb == null) {
            throw new BusinessException("知识库不存在");
        }
        if (!kb.getUserId().equals(userId)) {
            throw new BusinessException("无权上传到此知识库");
        }

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
        int chunkCount = documentService.embed(file, kbId, filename);
        KnowledgeDocument doc = new KnowledgeDocument();
        doc.setKbId(kbId);
        doc.setFilename(filename);
        doc.setChunkCount(chunkCount);
        doc.setUploadedBy(userId);
        doc.setCreatedAt(LocalDateTime.now());
        docMapper.insert(doc);
        return doc;
    }

    /**
     * Delete a document from a knowledge base (only owner can delete)
     */
    public void deleteDocument(Long kbId, Long docId, Long userId) {
        KnowledgeBase kb = kbMapper.selectById(kbId);
        if (kb == null) {
            throw new BusinessException("知识库不存在");
        }
        if (!kb.getUserId().equals(userId)) {
            throw new BusinessException("无权删除此知识库的文档");
        }

        docMapper.deleteById(docId);
    }

    /**
     * Test retrieval for a knowledge base (user must have access)
     */
    public List<Map<String, Object>> retrieval(Long kbId, String query, int topK, Long userId) {
        KnowledgeBase kb = kbMapper.selectById(kbId);
        if (kb == null) {
            throw new BusinessException("知识库不存在");
        }
        if (!kb.getUserId().equals(userId) && !kb.getIsPublic()) {
            throw new BusinessException("无权访问此知识库");
        }

        List<Document> docs = documentService.retrieval(query, topK, kbId);
        return docs.stream()
                .filter(d -> d != null && d.getText() != null)
                .map(doc -> Map.of(
                        "content", (Object) doc.getText(),
                        "metadata", doc.getMetadata()
                ))
                .toList();
    }
}
