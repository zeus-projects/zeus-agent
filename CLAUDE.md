# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zeus Agent is a full-stack RAG (Retrieval-Augmented Generation) agent system with:
- **`agent-server/`** — Spring Boot 3.4 + Spring AI 1.1 backend (Java 21)
- **`agent-ui/`** — React 19 + TypeScript + Vite frontend

## Build & Run Commands

### Backend (agent-server)
```bash
cd agent-server
mvn clean install           # Full build
mvn spring-boot:run         # Run locally (port 8080)
mvn test                    # Run all tests
mvn test -Dtest=ClassName   # Run single test class
```

### Frontend (agent-ui)
```bash
cd agent-ui
npm install                 # Install dependencies
npm run dev                 # Dev server at http://localhost:5173
npm run build               # Production build
npm run lint                # ESLint
```

## Required Environment Variables (Backend)

| Variable | Purpose |
|---|---|
| `DASHSCOPE_API_KEY` | Alibaba DashScope API key for chat + embedding models |
| `ZEUS_MYSQL_USERNAME` | MySQL username |
| `ZEUS_MYSQL_PASSWORD` | MySQL password |

External services expected at:
- MySQL: `zeus-mysql:3306` (database: `spring_ai_rag`)
- Milvus: `zeus-milvus:19530` (collection: `spring_ai_rag`)

## Architecture

### RAG Pipeline
1. **Embedding**: `DocumentService.embed()` → TikaDocumentReader → TokenTextSplitter → Milvus VectorStore. Each chunk is tagged with `knowledge_base_id` metadata for filtering.
2. **Retrieval**: `VectorStore.similaritySearch()` filtered by `knowledge_base_id`.
3. **Chat Agent** (`RagAgentService`): Advisor chain pattern:
   - `MessageChatMemoryAdvisor` — persists conversation history via JDBC
   - `QuestionAnswerAdvisor` — enforces KB-scoped retrieval
   - `KnowledgeSearchTool` — allows the LLM to trigger additional searches

### Backend Package Structure
```
tech.alexchen.daydayup.zeus.agent.server/
├── config/         # Spring Security config, bean definitions
├── security/       # JWT provider, filter, UserDetails impl, SecurityUtils
├── domain/         # MyBatis-Plus entities (User, KnowledgeBase, KnowledgeDocument, ChatSession)
├── dto/            # Request/response DTOs
├── mapper/         # MyBatis-Plus mappers
├── service/        # Business logic (AuthService, KnowledgeBaseService, DocumentService, RagAgentService, ChatSessionService)
├── controller/     # REST controllers
├── tool/           # Spring AI tools (KnowledgeSearchTool)
├── common/         # Result<T> wrapper, BusinessException, GlobalExceptionHandler
└── util/           # KbContextHolder (ThreadLocal for passing KB ID to tools)
```

### Authentication & Authorization
- JWT tokens in `Authorization: Bearer <token>` header
- Public routes: `/api/auth/**`; all others require JWT
- Roles: `USER` and `ADMIN`; admin can operate all resources, user is scoped to their own
- Knowledge base access: owner-only for private KBs, all authenticated users for public KBs
- CORS configured for `localhost:5173` and `localhost:3000`

### Frontend Structure
```
agent-ui/src/
├── api/            # Axios API clients (chat, knowledgeBase, document, session)
├── components/
│   ├── ChatPage/       # Main chat interface
│   ├── ChatWindow/     # Message rendering (react-markdown)
│   ├── KnowledgeBasePage/  # KB management UI
│   └── FileUpload/     # Document upload
└── App.tsx         # Root component
```

## Key Design Decisions

- **`KbContextHolder`** (ThreadLocal): Passes the active knowledge base ID from the HTTP request context into `KnowledgeSearchTool` during agent execution.
- **Streaming**: Chat responses use SSE (`Flux<String>`) via `POST /agent/chat/stream`.
- **File upload limits**: Max 100MB per file (configured in both `spring.servlet.multipart` and `server.tomcat`).
- **Default admin**: Schema inserts `admin@zeus.local` / `admin123` (BCrypt hashed) on first init.

## REST API Summary

| Prefix | Description |
|---|---|
| `POST /api/auth/register`, `/login`, `GET /api/auth/me` | Authentication |
| `GET/POST /knowledge-base`, `PUT/DELETE /knowledge-base/{id}` | KB CRUD |
| `GET/POST /knowledge-base/{id}/documents`, `DELETE .../documents/{docId}` | Document management |
| `GET /knowledge-base/{id}/retrieval?query=&topK=` | Retrieval test |
| `POST /agent/chat`, `POST /agent/chat/stream` | RAG chat (blocking / SSE) |
| `/chat-session/**` | Session management |

## Tech Stack

| Layer | Technology |
|---|---|
| AI Models | Alibaba DashScope (`text-embedding-v3`, DashScopeChatModel) |
| Vector DB | Milvus (IVF_FLAT, COSINE distance, 1024 dimensions) |
| ORM | MyBatis-Plus (lambda query wrappers, auto snake_case mapping) |
| Document Parsing | Apache Tika (multi-format) |
| Auth | Spring Security + JJWT 0.12.3 + BCrypt |
