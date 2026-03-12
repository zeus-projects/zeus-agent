import axios from 'axios'

export interface Session {
  id: string
  userId: number
  title: string
  kbId: number | null
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  role: string
  content: string
}

export const sessionApi = {
  listAll: () =>
    axios.get<{ code: number; data: Session[] }>('/agent/sessions').then(r => r.data.data),

  delete: (id: string) => axios.delete(`/agent/sessions/${id}`),

  getMessages: (id: string) =>
    axios.get<{ code: number; data: ChatMessage[] }>(`/agent/sessions/${id}/messages`).then(r => r.data.data),
}
