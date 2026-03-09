package tech.alexchen.daydayup.zeus.agent.server.service;

import jakarta.annotation.Resource;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 文档解析、切割、写入向量库
 *
 * @author alexchen
 * @since 2026-03-04
 */
@Service
public class DocumentService {

    @Resource
    private VectorStore vectorStore;

    private final TokenTextSplitter splitter = new TokenTextSplitter();

    private final static double DEFAULT_THRESHOLD = 0.6;

    /**
     * 将上传的文件解析、切割后写入向量数据库（兼容旧接口）
     */
    public int embed(MultipartFile file) {
        TikaDocumentReader reader = new TikaDocumentReader(file.getResource());
        List<Document> documents = reader.read();
        List<Document> chunks = splitter.apply(documents);
        vectorStore.add(chunks);
        return chunks.size();
    }

    /**
     * 将上传的文件解析、切割后写入向量数据库，并注入知识库 ID 到 metadata
     *
     * @param file     上传的文件
     * @param kbId     知识库 ID
     * @param filename 原始文件名
     * @return 写入的文档分块数量
     */
    public int embed(MultipartFile file, Long kbId, String filename) {
        TikaDocumentReader reader = new TikaDocumentReader(file.getResource());
        List<Document> documents = reader.read();
        List<Document> chunks = splitter.apply(documents);

        // Inject knowledge_base_id into each chunk's metadata
        List<Document> taggedChunks = chunks.stream()
                .map(doc -> {
                    doc.getMetadata().put("knowledge_base_id", String.valueOf(kbId));
                    doc.getMetadata().put("source_filename", filename);
                    return doc;
                })
                .toList();

        vectorStore.add(taggedChunks);
        return taggedChunks.size();
    }

    /**
     * 基于向量相似度检索文档片段（兼容旧接口，无知识库过滤）
     */
    public List<Document> retrieval(String query, int topK) {
        return vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(topK)
                        .similarityThreshold(DEFAULT_THRESHOLD)
                        .build()
        );
    }

    /**
     * 基于向量相似度检索文档片段，可按知识库过滤
     *
     * @param query 查询文本
     * @param topK  返回的最大结果数
     * @param kbId  知识库 ID（null 时不过滤）
     * @return 匹配的文档片段列表
     */
    public List<Document> retrieval(String query, int topK, Long kbId) {
        if (kbId == null) {
            return retrieval(query, topK);
        }
        FilterExpressionBuilder b = new FilterExpressionBuilder();
        return vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(topK)
                        .similarityThreshold(DEFAULT_THRESHOLD)
                        .filterExpression(b.eq("knowledge_base_id", String.valueOf(kbId)).build())
                        .build()
        );
    }
}
