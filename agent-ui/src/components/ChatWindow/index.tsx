import { useEffect, useRef, useState } from 'react'
import { Button, List, Alert, Tooltip, message } from 'antd'
import { Send, Copy, Check, Square } from 'lucide-react'
import TextArea from 'antd/es/input/TextArea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChat } from '../../api/chat'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatWindowProps {
  sessionId: string | null
  knowledgeBaseId: number | null
  initialMessages: Message[]
  onSessionCreated: (sessionId: string) => void
}

export function ChatWindow({ sessionId, knowledgeBaseId, initialMessages, onSessionCreated }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<(() => void) | null>(null)
  const listBottomRef = useRef<HTMLDivElement>(null)
  const [textareaHeight, setTextareaHeight] = useState<number | 'auto'>('auto')

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    listBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text || streaming) return

    setInput('')
    setError(null)
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
    setStreaming(true)

    // Reset textarea height
    setTextareaHeight('auto')

    abortRef.current = streamChat(
      text,
      sessionId,
      knowledgeBaseId,
      (chunk) => {
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
          }
          return updated
        })
      },
      (newSessionId) => {
        setStreaming(false)
        if (!sessionId && newSessionId) {
          onSessionCreated(newSessionId)
        }
      },
      (err) => {
        setError(err.message)
        setStreaming(false)
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize textarea (max ~10 lines = 300px)
    const newHeight = Math.min(e.target.scrollHeight, 300)
    setTextareaHeight(newHeight > 44 ? newHeight : 44)
  }

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx)
      message.success('已复制')
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }

  const handleStop = () => {
    abortRef.current?.()
    setStreaming(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4) var(--space-6)' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', paddingTop: 60 }}>
            <div style={{ marginBottom: 8 }}>选择知识库，开始提问吧~</div>
          </div>
        )}
        <List
          dataSource={messages}
          renderItem={(msg, idx) => (
            <List.Item
              key={idx}
              style={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                padding: 'var(--space-2) 0',
                border: 'none',
                animation: 'fadeInUp 0.2s ease-out',
              }}
            >
              <div className="msg-wrapper" style={{ maxWidth: '80%', display: 'inline-flex', alignItems: 'flex-end', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div
                  className={`msg-bubble ${msg.role}`}
                  style={{
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '10px 14px',
                    wordBreak: 'break-word',
                    boxShadow: msg.role === 'user' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'var(--shadow-sm)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                  }}
                >
                  {msg.role === 'user' ? (
                    <span style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{msg.content}</span>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                  {streaming && idx === messages.length - 1 && msg.role === 'assistant' && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 2,
                        height: '1em',
                        background: 'var(--color-text-muted)',
                        marginLeft: 4,
                        animation: 'blink 1s step-end infinite',
                        verticalAlign: 'text-bottom',
                      }}
                    />
                  )}
                </div>
                <Tooltip title="复制">
                  <Button
                    className="copy-btn"
                    type="text"
                    size="small"
                    icon={copiedIdx === idx ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                    onClick={() => handleCopy(msg.content, idx)}
                    style={{ flexShrink: 0, opacity: 0, transition: 'opacity var(--transition-fast)', color: 'var(--color-text-muted)' }}
                  />
                </Tooltip>
              </div>
            </List.Item>
          )}
        />
        <div ref={listBottomRef} />
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ margin: '0 var(--space-6) var(--space-3)', borderRadius: 'var(--radius-md)' }}
        />
      )}

      <div style={{
        display: 'flex',
        gap: 12,
        padding: 'var(--space-4) var(--space-6)',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        alignItems: 'flex-end',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
          <TextArea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入问题，按 Enter 发送，Shift+Enter 换行..."
            disabled={streaming}
            style={{
              flex: 1,
              borderRadius: 'var(--radius-md)',
              minHeight: 44,
              height: textareaHeight,
              maxHeight: 320,
              resize: 'none',
              lineHeight: 1.5,
              padding: '10px 12px',
            }}
          />
        </div>
        {streaming ? (
          <Button
            size="large"
            onClick={handleStop}
            icon={<Square size={16} />}
            danger
            style={{
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 44,
            }}
          />
        ) : (
          <Button
            type="primary"
            size="large"
            icon={<Send size={16} />}
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 44,
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .msg-wrapper:hover .copy-btn {
          opacity: 1 !important;
        }
        .msg-bubble p { margin: 0 0 8px; }
        .msg-bubble p:last-child { margin-bottom: 0; }
        .msg-bubble h1, .msg-bubble h2, .msg-bubble h3,
        .msg-bubble h4, .msg-bubble h5, .msg-bubble h6 {
          margin: 12px 0 6px;
          font-weight: 600;
          line-height: 1.4;
        }
        .msg-bubble h1:first-child, .msg-bubble h2:first-child,
        .msg-bubble h3:first-child { margin-top: 0; }
        .msg-bubble ul, .msg-bubble ol {
          margin: 6px 0;
          padding-left: 20px;
        }
        .msg-bubble li { margin: 2px 0; }
        .msg-bubble code {
          background: rgba(0,0,0,0.08);
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 0.88em;
          font-family: 'SFMono-Regular', Consolas, monospace;
        }
        .msg-bubble pre {
          background: rgba(0,0,0,0.06);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          overflow-x: auto;
          margin: 8px 0;
        }
        .msg-bubble pre code {
          background: transparent;
          padding: 0;
          font-size: 0.85em;
        }
        .msg-bubble blockquote {
          border-left: 3px solid var(--color-border);
          margin: 8px 0;
          padding: 4px 12px;
          color: var(--color-text-muted);
        }
        .msg-bubble table {
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 0.9em;
        }
        .msg-bubble th, .msg-bubble td {
          border: 1px solid var(--color-border);
          padding: 4px 10px;
        }
        .msg-bubble th { background: var(--color-bg); }
        .msg-bubble a { color: var(--color-primary); text-decoration: none; }
        .msg-bubble a:hover { text-decoration: underline; }
        .msg-bubble hr { border: none; border-top: 1px solid var(--color-border); margin: 10px 0; }
      `}</style>
    </div>
  )
}
