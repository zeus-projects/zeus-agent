export function streamChat(
  message: string,
  sessionId: string | null,
  knowledgeBaseId: number | null,
  onChunk: (chunk: string) => void,
  onDone: (newSessionId: string) => void,
  onError: (err: Error) => void,
): () => void {
  const controller = new AbortController()

  fetch('/agent/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, knowledgeBaseId }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const newSessionId = response.headers.get('X-Session-Id') ?? sessionId ?? ''
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5)
            if (data !== '[DONE]') {
              onChunk(data)
            }
          }
        }
      }

      // Flush remaining buffer
      if (buffer.startsWith('data:')) {
        const data = buffer.slice(5)
        if (data && data !== '[DONE]') onChunk(data)
      }

      onDone(newSessionId)
    })
    .catch((err: Error) => {
      if (err.name !== 'AbortError') onError(err)
    })

  return () => controller.abort()
}
