import { useEffect, useRef, useState } from 'react'
import { Button, Input, List, Alert, Tooltip, message } from 'antd'
import { SendOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', paddingTop: 40 }}>
            选择知识库，开始提问吧~
          </div>
        )}
        <List
          dataSource={messages}
          renderItem={(msg, idx) => (
            <List.Item
              key={idx}
              style={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                padding: '4px 0',
                border: 'none',
              }}
            >
              <div className="msg-wrapper" style={{ maxWidth: '75%', display: 'inline-flex', alignItems: 'flex-end', gap: 4, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div
                  className={`msg-bubble ${msg.role}`}
                  style={{
                    background: msg.role === 'user' ? '#1677ff' : '#f0f0f0',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    borderRadius: 8,
                    padding: '8px 12px',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.role === 'user' ? (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
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
                        background: '#333',
                        marginLeft: 2,
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
                    icon={copiedIdx === idx ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                    onClick={() => handleCopy(msg.content, idx)}
                    style={{ flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
                  />
                </Tooltip>
              </div>
            </List.Item>
          )}
        />
        <div ref={listBottomRef} />
      </div>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 8 }} />
      )}

      <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="输入问题，按 Enter 发送..."
          disabled={streaming}
          size="large"
        />
        {streaming ? (
          <Button size="large" onClick={handleStop} danger>
            停止
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            发送
          </Button>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
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
          border-radius: 6px;
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
          border-left: 3px solid rgba(0,0,0,0.2);
          margin: 8px 0;
          padding: 4px 12px;
          color: rgba(0,0,0,0.5);
        }
        .msg-bubble table {
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 0.9em;
        }
        .msg-bubble th, .msg-bubble td {
          border: 1px solid rgba(0,0,0,0.15);
          padding: 4px 10px;
        }
        .msg-bubble th { background: rgba(0,0,0,0.05); }
        .msg-bubble a { color: inherit; text-decoration: underline; }
        .msg-bubble hr { border: none; border-top: 1px solid rgba(0,0,0,0.15); margin: 10px 0; }
      `}</style>
    </div>
  )
}
