import { useState } from 'react'
import { Layout, Menu, Typography } from 'antd'
import { MessageOutlined, DatabaseOutlined } from '@ant-design/icons'
import { ChatPage } from './components/ChatPage'
import { KnowledgeBasePage } from './components/KnowledgeBasePage'

const { Header, Content } = Layout
const { Title } = Typography

type PageKey = 'chat' | 'knowledge-base'

export default function App() {
  const [page, setPage] = useState<PageKey>('chat')

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>Spring AI RAG</Title>
        <Menu
          mode="horizontal"
          selectedKeys={[page]}
          onClick={({ key }) => setPage(key as PageKey)}
          style={{ flex: 1, borderBottom: 'none' }}
          items={[
            { key: 'chat', icon: <MessageOutlined />, label: '对话' },
            { key: 'knowledge-base', icon: <DatabaseOutlined />, label: '知识库管理' },
          ]}
        />
      </Header>
      <Content style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '16px 24px' }}>
        {page === 'chat' ? <ChatPage /> : <KnowledgeBasePage />}
      </Content>
    </Layout>
  )
}
