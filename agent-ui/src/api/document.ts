import axios from 'axios'

export async function uploadDocument(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post<string>('/document/embedding', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
