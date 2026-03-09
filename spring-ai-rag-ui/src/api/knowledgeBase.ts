import axios from 'axios'

export interface KnowledgeBase {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface KnowledgeDocument {
  id: number
  kbId: number
  filename: string
  chunkCount: number
  createdAt: string
}

export interface RetrievalResult {
  content: string
  metadata: Record<string, unknown>
}

export const knowledgeBaseApi = {
  listAll: () => axios.get<KnowledgeBase[]>('/knowledge-base').then(r => r.data),

  create: (name: string, description: string) =>
    axios.post<KnowledgeBase>('/knowledge-base', { name, description }).then(r => r.data),

  update: (id: number, name: string, description: string) =>
    axios.put(`/knowledge-base/${id}`, { name, description }),

  delete: (id: number) => axios.delete(`/knowledge-base/${id}`),

  listDocuments: (kbId: number) =>
    axios.get<KnowledgeDocument[]>(`/knowledge-base/${kbId}/documents`).then(r => r.data),

  uploadDocument: (kbId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post<KnowledgeDocument>(`/knowledge-base/${kbId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  deleteDocument: (kbId: number, docId: number) =>
    axios.delete(`/knowledge-base/${kbId}/documents/${docId}`),

  retrieval: (kbId: number, query: string, topK = 5) =>
    axios.get<RetrievalResult[]>(`/knowledge-base/${kbId}/retrieval`, { params: { query, topK } })
      .then(r => r.data),
}
