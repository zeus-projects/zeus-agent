import axios from 'axios'
import type { UserInfo } from './auth'

export const adminApi = {
  listUsers: () =>
    axios.get<{ code: number; data: UserInfo[] }>('/api/admin/users').then(r => r.data.data),

  enableUser: (id: number) =>
    axios.put(`/api/admin/users/${id}/enable`),

  disableUser: (id: number) =>
    axios.put(`/api/admin/users/${id}/disable`),
}
