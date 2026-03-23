import { useEffect, useState } from 'react'
import { Button, Popconfirm, Select, Typography, message } from 'antd'
import { Trash2, Globe, Lock, MessageSquare } from 'lucide-react'
import { ChatWindow } from '../ChatWindow'
import type { Message } from '../ChatWindow'
import { sessionApi } from '../../api/session'
import type { Session, ChatMessage } from '../../api/session'
import { knowledgeBaseApi } from '../../api/knowledgeBase'
import type { KnowledgeBase } from '../../api/knowledgeBase'

const { Text } = Typography

interface ChatPageProps {
  newChatSignal?: number
}

export function ChatPage({ newChatSignal }: ChatPageProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [kbList, setKbList] = useState<KnowledgeBase[]>([])
  const [selectedKbId, setSelectedKbId] = useState<number | null>(null)

  useEffect(() => {
    loadSessions()
    loadKbList()
  }, [])

  // When parent triggers "new chat"
  useEffect(() => {
    if (newChatSignal && newChatSignal > 0) {
      setCurrentSessionId(null)
      setInitialMessages([])
      setSelectedKbId(null)
    }
  }, [newChatSignal])

  const loadSessions = async () => {
    try {
      const list = await sessionApi.listAll()
      setSessions(list)
    } catch {
      // ignore
    }
  }

  const loadKbList = async () => {
    try {
      const list = await knowledgeBaseApi.listAll()
      setKbList(list)
    } catch {
      // ignore
    }
  }

  const handleSelectSession = async (session: Session) => {
    setCurrentSessionId(session.id)
    setSelectedKbId(session.kbId)
    try {
      const msgs = await sessionApi.getMessages(session.id)
      setInitialMessages(msgs.map((m: ChatMessage) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })))
    } catch {
      setInitialMessages([])
    }
  }

  const handleDeleteSession = async (id: string) => {
    try {
      await sessionApi.delete(id)
      message.success('删除成功')
      if (currentSessionId === id) {
        setCurrentSessionId(null)
        setInitialMessages([])
      }
      await loadSessions()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSessionCreated = async (sessionId: string) => {
    setCurrentSessionId(sessionId)
    await loadSessions()
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Session list sidebar */}
      <div style={{
        width: 260,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}>
        <div style={{
          padding: 'var(--space-4) var(--space-4) var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}>
          <Text style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            聊天记录
          </Text>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2) 0' }}>
          {sessions.length === 0 && (
            <div style={{ padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-light)', textAlign: 'center', fontSize: 13 }}>
              <CalendarIcon />
              <div style={{ marginTop: 8 }}>暂无历史对话</div>
            </div>
          )}
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                cursor: 'pointer',
                background: currentSessionId === session.id ? 'var(--color-sidebar-active)' : 'transparent',
                borderLeft: currentSessionId === session.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                transition: 'all var(--transition-fast)',
                margin: '2px var(--space-2)',
                borderRadius: 'var(--radius-md)',
              }}
              onMouseEnter={(e) => {
                if (currentSessionId !== session.id) {
                  e.currentTarget.style.background = 'var(--color-border-light)'
                }
              }}
              onMouseLeave={(e) => {
                if (currentSessionId !== session.id) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-md)',
                  background: currentSessionId === session.id ? 'var(--color-primary)' : 'var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <MessageSquare size={14} color={currentSessionId === session.id ? '#fff' : 'var(--color-text-muted)'} />
                </div>
                <Text
                  ellipsis
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: currentSessionId === session.id ? 'var(--color-primary)' : 'var(--color-text)',
                    fontWeight: currentSessionId === session.id ? 500 : 400,
                  }}
                  title={session.title}
                >
                  {session.title}
                </Text>
              </div>
              <div onClick={e => e.stopPropagation()} style={{ opacity: currentSessionId === session.id ? 1 : 0 }}>
                <Popconfirm
                  title="删除此对话？"
                  onConfirm={() => handleDeleteSession(session.id)}
                >
                  <Button
                    type="text"
                    icon={<Trash2 size={14} />}
                    size="small"
                    style={{ color: 'var(--color-text-muted)' }}
                    className="session-delete-btn"
                  />
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* KB selector bar */}
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--color-surface)',
          flexShrink: 0,
          height: 53,
          boxSizing: 'border-box',
        }}>
          <Text style={{ flexShrink: 0, color: 'var(--color-text-muted)', fontSize: 13 }}>知识库：</Text>
          <Select
            style={{ width: 280 }}
            placeholder="不使用知识库（纯 LLM 回答）"
            allowClear
            value={selectedKbId ?? undefined}
            onChange={v => setSelectedKbId(v ?? null)}
            options={kbList.map(kb => ({
              value: kb.id,
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {kb.isPublic
                    ? <Globe size={14} style={{ color: 'var(--color-success)' }} />
                    : <Lock size={14} style={{ color: 'var(--color-text-muted)' }} />}
                  {kb.name}
                </span>
              ),
            }))}
          />
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <ChatWindow
            sessionId={currentSessionId}
            knowledgeBaseId={selectedKbId}
            initialMessages={initialMessages}
            onSessionCreated={handleSessionCreated}
          />
        </div>
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="1.5" style={{ margin: '0 auto', display: 'block' }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
