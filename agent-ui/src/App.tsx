import { useState } from 'react'
import { Avatar, Button, Layout, Menu, Popconfirm, Spin, Tooltip, Typography } from 'antd'
import {
  Bot,
  CalendarDays,
  Database,
  LogOut,
  Plus,
  Users,
} from 'lucide-react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './components/LoginPage'
import { OidcCallback } from './components/OidcCallback'
import { ChatPage } from './components/ChatPage'
import { KnowledgeBasePage } from './components/KnowledgeBasePage'
import { UserManagementPage } from './components/UserManagementPage'

const { Sider, Content } = Layout
const { Text } = Typography

type PageKey = 'chat' | 'history' | 'knowledge-base' | 'users'

function AppShell() {
  const { user, isAdmin, logout, login, loading } = useAuth()
  const [page, setPage] = useState<PageKey>('chat')
  const [newChatSignal, setNewChatSignal] = useState(0)

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) return <LoginPage onLogin={login} />

  const handleNewChat = () => {
    setPage('chat')
    setNewChatSignal(s => s + 1)
  }

  const menuItems = [
    {
      key: 'new-chat',
      icon: <Plus size={18} />,
      label: '新聊天',
      onClick: handleNewChat,
      style: { marginBottom: 4 },
    },
    {
      key: 'history',
      icon: <CalendarDays size={18} />,
      label: '聊天记录',
    },
    {
      key: 'knowledge-base',
      icon: <Database size={18} />,
      label: '知识库',
    },
    ...(isAdmin ? [{
      key: 'users',
      icon: <Users size={18} />,
      label: '用户管理',
    }] : []),
  ]

  const selectedKeys = page === 'chat' ? ['history'] : [page]

  return (
    <Layout style={{ height: '100vh', background: 'var(--color-bg)' }}>
      {/* Left sidebar */}
      <Sider
        width={240}
        style={{
          background: 'var(--color-sidebar-bg)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <div style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--color-sidebar-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Bot size={20} color="#fff" />
              </div>
              <div>
                <Text style={{ color: '#fff', fontWeight: 600, fontSize: 16, display: 'block', lineHeight: 1.2 }}>
                  Zeus Agent
                </Text>
                <Text style={{ color: 'var(--color-sidebar-text-muted)', fontSize: 11 }}>
                  智能 RAG 对话系统
                </Text>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
            <Menu
              mode="inline"
              selectedKeys={selectedKeys}
              onClick={({ key }) => {
                if (key === 'new-chat') return
                setPage(key as PageKey)
              }}
              items={menuItems}
              style={{
                background: 'transparent',
                border: 'none',
              }}
              theme="dark"
            />
          </div>

          {/* User info at bottom */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid var(--color-sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Avatar
              size={36}
              style={{
                background: isAdmin
                  ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  : 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                flexShrink: 0,
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user.username}
              </div>
              <div style={{ color: isAdmin ? '#ffd666' : 'var(--color-sidebar-text-muted)', fontSize: 11 }}>
                {isAdmin ? '管理员' : '用户'}
              </div>
            </div>
            <Popconfirm
              title="确认退出登录？"
              onConfirm={logout}
              placement="topRight"
            >
              <Tooltip title="退出登录" placement="right">
                <Button
                  type="text"
                  icon={<LogOut size={16} />}
                  size="small"
                  style={{ color: 'var(--color-sidebar-text-muted)', flexShrink: 0 }}
                />
              </Tooltip>
            </Popconfirm>
          </div>
        </div>
      </Sider>

      {/* Main content */}
      <Content style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}>
        {(page === 'chat' || page === 'history') && (
          <ChatPage newChatSignal={newChatSignal} />
        )}
        {page === 'knowledge-base' && <KnowledgeBasePage />}
        {page === 'users' && isAdmin && <UserManagementPage />}
      </Content>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/callback" element={<OidcCallback />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
