import axios from 'axios'

export interface KnowledgeBase {
  id: number
  userId: number
  name: string
  description: string
  isPublic: boolean
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
  listAll: () =>
    axios.get<{ code: number; data: KnowledgeBase[] }>('/knowledge-base').then(r => r.data.data),

  create: (name: string, description: string, isPublic: boolean) =>
    axios.post<{ code: number; data: KnowledgeBase }>('/knowledge-base', { name, description, isPublic }).then(r => r.data.data),

  update: (id: number, name: string, description: string, isPublic: boolean) =>
    axios.put(`/knowledge-base/${id}`, { name, description, isPublic }),

  delete: (id: number) => axios.delete(`/knowledge-base/${id}`),

  listDocuments: (kbId: number) =>
    axios.get<{ code: number; data: KnowledgeDocument[] }>(`/knowledge-base/${kbId}/documents`).then(r => r.data.data),

  uploadDocument: (kbId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post<{ code: number; data: KnowledgeDocument }>(`/knowledge-base/${kbId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data)
  },

  deleteDocument: (kbId: number, docId: number) =>
    axios.delete(`/knowledge-base/${kbId}/documents/${docId}`),

  retrieval: (kbId: number, query: string, topK = 5) =>
    axios.get<{ code: number; data: RetrievalResult[] }>(`/knowledge-base/${kbId}/retrieval`, { params: { query, topK } })
      .then(r => r.data.data),
}
