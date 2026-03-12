import { useEffect, useState } from 'react'
import { Button, Popconfirm, Table, Tag, Typography, message } from 'antd'
import { adminApi } from '../../api/admin'
import type { UserInfo } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

const { Title } = Typography

export function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const list = await adminApi.listUsers()
      setUsers(list)
    } catch {
      message.error('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (user: UserInfo) => {
    try {
      if (user.enabled) {
        await adminApi.disableUser(user.id)
        message.success(`已禁用用户 ${user.username}`)
      } else {
        await adminApi.enableUser(user.id)
        message.success(`已启用用户 ${user.username}`)
      }
      await loadUsers()
    } catch {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: UserInfo) => (
        <span>
          {username}
          {record.id === currentUser?.userId && (
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>我</Tag>
          )}
        </span>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 90,
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'gold' : 'blue'}>{role}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>{enabled ? '正常' : '禁用'}</Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: UserInfo) => {
        if (record.id === currentUser?.userId) return <span style={{ color: '#ccc' }}>—</span>
        return (
          <Popconfirm
            title={record.enabled ? `确认禁用用户 ${record.username}？` : `确认启用用户 ${record.username}？`}
            onConfirm={() => handleToggleEnabled(record)}
          >
            <Button
              type="link"
              danger={record.enabled}
              size="small"
            >
              {record.enabled ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
        )
      },
    },
  ]

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <Title level={4} style={{ marginTop: 0, marginBottom: 20 }}>用户管理</Title>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        style={{ background: '#fff', borderRadius: 8 }}
      />
    </div>
  )
}
