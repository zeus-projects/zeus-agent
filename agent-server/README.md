# Spring AI RAG 示例

本模块演示如何使用 Spring AI 构建一个完整的 RAG（Retrieval-Augmented Generation）系统，包含文档向量化、召回测试、以及一个基于知识库检索的 Agent。

## 功能模块

| 模块 | 接口 | 说明 |
|------|------|------|
| 文档向量化 | `POST /document/embedding` | 上传文档，解析并写入向量数据库 |
| 召回测试 | `GET /document/retrieval` | 基于向量相似度检索相关文档片段 |
| RAG Agent | `POST /agent/chat` | 支持知识库检索的对话 Agent |

## 技术选型

| 组件 | 选型 |
|------|------|
| Chat 模型 | 阿里云 DashScope（`DashScopeChatModel`） |
| Embedding 模型 | 阿里云 DashScope `text-embedding-v3`（维度 1024） |
| 向量数据库 | Milvus |
| 文档解析 | Apache Tika（支持 PDF、Word、TXT 等格式） |

## 架构思路

### 1. 文档向量化（Embedding Pipeline）

文档写入知识库的完整链路：

```
用户上传文件
    → TikaDocumentReader 解析为 Document 列表
    → TokenTextSplitter 按 token 数切割分块
    → VectorStore.add() 触发 DashScope Embedding
    → 写入 Milvus
```

**关键决策：**
- 使用 `TikaDocumentReader` 而非针对单一格式的 Reader，可以用同一套代码处理 PDF、Word、Markdown 等多种格式。
- 切割策略使用 `TokenTextSplitter`，相比按字符数切割，token 级别的切割与 Embedding 模型的输入限制更一致，避免单块超长被截断。

### 2. 召回测试（Vector Search）

召回测试接口独立存在，用于在接入 Agent 之前单独验证知识库的检索质量：

```
用户输入 query
    → VectorStore.similaritySearch(SearchRequest)
    → 返回 TopK 文档片段 + 相似度分数
```

通过独立的召回测试，可以在不引入 LLM 的情况下直接判断：
- Embedding 模型对业务语料的覆盖效果
- 文档切割粒度是否合理（块太大语义模糊，块太小上下文缺失）

### 3. RAG Agent（QuestionAnswerAdvisor + KnowledgeSearchTool）

Agent 采用 **`QuestionAnswerAdvisor` 强制检索 + `KnowledgeSearchTool` 补充**的混合方案：

```
用户提问
    → QuestionAnswerAdvisor 强制检索向量库（TopK 文档注入 prompt）
    → ChatClient（同时绑定 KnowledgeSearchTool）
    → LLM 基于注入的上下文生成回答
        └── 若初次检索结果不足，LLM 可主动调用 KnowledgeSearchTool 二次检索
```

**方案选型说明：**

最初采用纯 Tool-based Agent 方案（仅注册 `KnowledgeSearchTool`，由 LLM 决定是否调用），但实测发现：对于"出租屋严禁放置什么"等通用问题，模型认为自己已知答案，会直接回答而跳过工具调用，导致知识库形同虚设。

| 方案 | 检索时机 | 问题 |
|------|----------|------|
| 纯 Tool-based | LLM 自主决定 | 模型可能跳过检索，直接用训练知识回答 |
| **QuestionAnswerAdvisor（当前）** | **每次对话强制检索** | 无论问题类型，始终从知识库取证后再回答 |

`KnowledgeSearchTool` 保留的意义：当 Advisor 的初次检索结果不足时，LLM 可以主动用不同关键词发起二次检索。

## 项目结构

```
spring-ai-rag/
├── controller/
│   ├── FileEmbeddingController.java   # 文档上传向量化接口
│   ├── SearchController.java           # 召回测试接口
│   └── RagAgentController.java         # RAG Agent 对话接口
├── service/
│   ├── DocumentService.java            # 文档解析、切割、写入向量库
│   ├── SearchService.java              # 向量相似度检索
│   └── RagAgentService.java            # Agent 构建与对话
├── tool/
│   └── KnowledgeSearchTool.java        # 知识库检索 Tool（供 Agent 调用）
└── resources/
    └── application.yaml
```

## 配置说明

```yaml
server:
  port: 8080
  tomcat:
    max-http-form-post-size: 100MB         # Tomcat 表单/文件上传大小限制
  max-http-request-header-size: 100MB

spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 100MB                 # 单文件大小限制
      max-request-size: 100MB             # 单次请求总大小限制
  ai:
    dashscope:
      chat:
        api-key: ${DASHSCOPE_API_KEY}
      embedding:
        api-key: ${DASHSCOPE_API_KEY}
        options:
          model: text-embedding-v3
          dimensions: 1024
    vectorstore:
      milvus:
        client:
          host: zeus-milvus
          port: 19530
        initialize-schema: true             # 自动创建 Collection
        embeddingDimension: 1024            # 需与 Embedding 维度一致
        database-name: default             # 数据库需手动创建
        collectionName: spring_ai_collection
        indexType: IVF_FLAT
        metricType: COSINE
```

**环境变量：**
- `DASHSCOPE_API_KEY`：阿里云 DashScope API Key（Chat 模型与 Embedding 模型共用）

> **注意：** 上传大文件时需同时配置 `spring.servlet.multipart` 和 `server.tomcat` 两处大小限制，缺少任意一处都可能触发 `MaxUploadSizeExceededException`。
