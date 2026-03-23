import { useState } from 'react'
import { Button, Form, Input, Tabs, Typography, message, Card } from 'antd'
import { Lock, Mail, User, Bot, LogIn, UserPlus } from 'lucide-react'
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
      background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
      padding: 'var(--space-4)',
    }}>
      <Card
        style={{
          width: 420,
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          border: 'none',
          background: 'var(--color-surface)',
        }}
        styles={{ body: { padding: '40px 48px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
          }}>
            <Bot size={32} color="#fff" />
          </div>
          <Title level={3} style={{ margin: 0, color: 'var(--color-text)', marginBottom: 4 }}>Zeus Agent</Title>
          <Text style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>智能 RAG 对话系统</Text>
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
                    icon={<LogIn size={18} />}
                    onClick={onLogin}
                    style={{
                      height: 48,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-primary)',
                      border: 'none',
                      fontSize: 15,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
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
                    <Input
                      prefix={<User size={16} style={{ color: 'var(--color-text-muted)' }} />}
                      placeholder="用户名"
                      autoComplete="username"
                      style={{ height: 44, borderRadius: 'var(--radius-md)' }}
                    />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
                    <Input
                      prefix={<Mail size={16} style={{ color: 'var(--color-text-muted)' }} />}
                      placeholder="邮箱"
                      autoComplete="email"
                      style={{ height: 44, borderRadius: 'var(--radius-md)' }}
                    />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6个字符' }]}>
                    <Input.Password
                      prefix={<Lock size={16} style={{ color: 'var(--color-text-muted)' }} />}
                      placeholder="密码（至少6位）"
                      autoComplete="new-password"
                      style={{ height: 44, borderRadius: 'var(--radius-md)' }}
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      icon={<UserPlus size={18} />}
                      style={{
                        height: 48,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-accent)',
                        border: 'none',
                        fontSize: 15,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
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
