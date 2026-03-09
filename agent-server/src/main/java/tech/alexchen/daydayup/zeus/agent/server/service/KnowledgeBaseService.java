package tech.alexchen.daydayup.zeus.agent.server.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tech.alexchen.daydayup.zeus.agent.server.domain.KnowledgeBase;
import tech.alexchen.daydayup.zeus.agent.server.domain.KnowledgeDocument;
import tech.alexchen.daydayup.zeus.agent.server.mapper.KnowledgeBaseMapper;
import tech.alexchen.daydayup.zeus.agent.server.mapper.KnowledgeDocumentMapper;

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

    public List<KnowledgeBase> listAll() {
        return kbMapper.selectList(
                Wrappers.<KnowledgeBase>lambdaQuery().orderByDesc(KnowledgeBase::getCreatedAt)
        );
    }

    public KnowledgeBase create(String name, String description) {
        KnowledgeBase kb = new KnowledgeBase();
        kb.setName(name);
        kb.setDescription(description);
        kbMapper.insert(kb);
        return kb;
    }

    public void update(Long id, String name, String description) {
        KnowledgeBase kb = new KnowledgeBase();
        kb.setId(id);
        kb.setName(name);
        kb.setDescription(description);
        kbMapper.updateById(kb);
    }

    public void delete(Long id) {
        kbMapper.deleteById(id);
    }

    public List<KnowledgeDocument> listDocuments(Long kbId) {
        LambdaQueryWrapper<KnowledgeDocument> wrapper = Wrappers.<KnowledgeDocument>lambdaQuery()
                .eq(KnowledgeDocument::getKbId, kbId)
                .orderByDesc(KnowledgeDocument::getCreatedAt);
        return docMapper.selectList(wrapper);
    }

    public KnowledgeDocument uploadDocument(Long kbId, MultipartFile file) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
        int chunkCount = documentService.embed(file, kbId, filename);
        KnowledgeDocument doc = new KnowledgeDocument();
        doc.setKbId(kbId);
        doc.setFilename(filename);
        doc.setChunkCount(chunkCount);
        docMapper.insert(doc);
        return doc;
    }

    public void deleteDocument(Long docId) {
        docMapper.deleteById(docId);
    }

    public List<Map<String, Object>> retrieval(Long kbId, String query, int topK) {
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
