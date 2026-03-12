import { useEffect, useState } from 'react'
import { Button, Popconfirm, Select, Typography, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
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
        width: 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #f0f0f0',
        background: '#fafafa',
      }}>
        <div style={{ padding: '12px 10px 8px', borderBottom: '1px solid #f0f0f0' }}>
          <Text style={{ fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            聊天记录
          </Text>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.length === 0 && (
            <div style={{ padding: '24px 16px', color: '#bbb', textAlign: 'center', fontSize: 12 }}>
              暂无历史对话
            </div>
          )}
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                background: currentSessionId === session.id ? '#e6f4ff' : 'transparent',
                borderBottom: '1px solid #f0f0f0',
                borderLeft: currentSessionId === session.id ? '3px solid #1677ff' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
                transition: 'all 0.15s',
              }}
            >
              <Text
                ellipsis
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: currentSessionId === session.id ? '#1677ff' : '#444',
                }}
                title={session.title}
              >
                {session.title}
              </Text>
              <div onClick={e => e.stopPropagation()}>
                <Popconfirm
                  title="删除此对话？"
                  onConfirm={() => handleDeleteSession(session.id)}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    style={{ opacity: 0.6 }}
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
          padding: '10px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#fff',
          flexShrink: 0,
        }}>
          <Text style={{ flexShrink: 0, color: '#666', fontSize: 13 }}>知识库：</Text>
          <Select
            style={{ width: 260 }}
            placeholder="不使用知识库（纯 LLM 回答）"
            allowClear
            value={selectedKbId ?? undefined}
            onChange={v => setSelectedKbId(v ?? null)}
            options={kbList.map(kb => ({
              value: kb.id,
              label: (
                <span>
                  {kb.isPublic ? '🌐 ' : '🔒 '}
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
