import { useState } from 'react'
import { Avatar, Button, Layout, Menu, Popconfirm, Spin, Tooltip, Typography } from 'antd'
import {
  DatabaseOutlined,
  HistoryOutlined,
  LogoutOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons'
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      icon: <PlusOutlined />,
      label: '新聊天',
      onClick: handleNewChat,
      style: { marginBottom: 4 },
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '聊天记录',
    },
    {
      key: 'knowledge-base',
      icon: <DatabaseOutlined />,
      label: '知识库',
    },
    ...(isAdmin ? [{
      key: 'users',
      icon: <TeamOutlined />,
      label: '用户管理',
    }] : []),
  ]

  const selectedKeys = page === 'chat' ? ['history'] : [page]

  return (
    <Layout style={{ height: '100vh', background: '#f5f5f7' }}>
      {/* Left sidebar */}
      <Sider
        width={220}
        style={{
          background: '#1a1a2e',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <div style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
              }}>
                🤖
              </div>
              <Text style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: 0.3 }}>
                Zeus Agent
              </Text>
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
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Avatar
              size={32}
              style={{
                background: isAdmin
                  ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 600,
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
              <div style={{ color: isAdmin ? '#ffd666' : 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                {isAdmin ? 'Admin' : 'User'}
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
                  icon={<LogoutOutlined />}
                  size="small"
                  style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}
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
        background: '#fff',
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
