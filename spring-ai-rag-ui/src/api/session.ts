import axios from 'axios'

export interface Session {
  id: string
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
  listAll: () => axios.get<Session[]>('/agent/sessions').then(r => r.data),

  delete: (id: string) => axios.delete(`/agent/sessions/${id}`),

  getMessages: (id: string) =>
    axios.get<ChatMessage[]>(`/agent/sessions/${id}/messages`).then(r => r.data),
}
