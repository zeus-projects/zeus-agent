import axios from 'axios'

export interface UserInfo {
  id: number
  username: string
  email: string
  role: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    axios.post<{ code: number; data: UserInfo }>('/api/auth/register', { username, email, password }).then(r => r.data.data),

  me: () =>
    axios.get<{ code: number; data: UserInfo }>('/api/auth/me').then(r => r.data.data),
}
