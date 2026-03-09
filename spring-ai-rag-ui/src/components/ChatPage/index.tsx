import { useEffect, useState } from 'react'
import { Button, Popconfirm, Select, Typography, message } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { ChatWindow } from '../ChatWindow'
import type { Message } from '../ChatWindow'
import { sessionApi } from '../../api/session'
import type { Session, ChatMessage } from '../../api/session'
import { knowledgeBaseApi } from '../../api/knowledgeBase'
import type { KnowledgeBase } from '../../api/knowledgeBase'

const { Text } = Typography

export function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [kbList, setKbList] = useState<KnowledgeBase[]>([])
  const [selectedKbId, setSelectedKbId] = useState<number | null>(null)

  useEffect(() => {
    loadSessions()
    loadKbList()
  }, [])

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

  const handleNewChat = () => {
    setCurrentSessionId(null)
    setInitialMessages([])
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
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Left: session list */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '8px 12px' }}>
          <Button icon={<PlusOutlined />} block onClick={handleNewChat}>
            新对话
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.length === 0 && (
            <div style={{ padding: 16, color: '#999', textAlign: 'center', fontSize: 13 }}>暂无历史对话</div>
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                ellipsis
                style={{ flex: 1, fontSize: 13 }}
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
                  />
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: chat area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '12px 16px' }}>
        {/* KB selector */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ flexShrink: 0 }}>知识库：</Text>
          <Select
            style={{ width: 240 }}
            placeholder="不使用知识库（纯 LLM 回答）"
            allowClear
            value={selectedKbId ?? undefined}
            onChange={v => setSelectedKbId(v ?? null)}
            options={kbList.map(kb => ({ value: kb.id, label: kb.name }))}
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
