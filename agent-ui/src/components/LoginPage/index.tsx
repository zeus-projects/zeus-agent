import { useState } from 'react'
import { Button, Form, Input, Tabs, Typography, message, Card } from 'antd'
import { LockOutlined, LoginOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { authApi } from '../../api/auth'

const { Title, Text } = Typography

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [registerForm] = Form.useForm()

  const handleRegister = async (values: { username: string; email: string; password: string }) => {
    setLoading(true)
    try {
      await authApi.register(values.username, values.email, values.password)
      message.success('注册成功，请点击登录按钮进行登录')
      registerForm.resetFields()
      setActiveTab('login')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '注册失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          border: 'none',
        }}
        styles={{ body: { padding: '40px 48px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            fontSize: 24,
          }}>
            🤖
          </div>
          <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>Zeus Agent</Title>
          <Text style={{ color: '#888', fontSize: 13 }}>智能 RAG 对话系统</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={k => setActiveTab(k as 'login' | 'register')}
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <div style={{ marginTop: 16 }}>
                  <Button
                    type="primary"
                    block
                    icon={<LoginOutlined />}
                    onClick={onLogin}
                    style={{
                      height: 44,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      fontSize: 15,
                    }}
                  >
                    使用 Zeus 账号登录
                  </Button>
                </div>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form form={registerForm} onFinish={handleRegister} size="large" style={{ marginTop: 16 }}>
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3个字符' }]}>
                    <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="用户名" autoComplete="username" />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
                    <Input prefix={<MailOutlined style={{ color: '#bbb' }} />} placeholder="邮箱" autoComplete="email" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6个字符' }]}>
                    <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />} placeholder="密码（至少6位）" autoComplete="new-password" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      style={{
                        height: 44,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        fontSize: 15,
                      }}
                    >
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
