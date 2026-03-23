import { useEffect, useRef, useState } from 'react'
import {
  Button, Card, Form, Input, Modal, Popconfirm, Switch,
  Table, Typography, message, Space, Tag, Tooltip,
} from 'antd'
import {
  Trash2, Edit2, Globe, Lock,
  Plus, Search, Upload, Database,
} from 'lucide-react'
import { knowledgeBaseApi } from '../../api/knowledgeBase'
import type { KnowledgeBase, KnowledgeDocument, RetrievalResult } from '../../api/knowledgeBase'
import { useAuth } from '../../context/AuthContext'

const { Text } = Typography
const { TextArea } = Input

export function KnowledgeBasePage() {
  const { user } = useAuth()
  const [kbList, setKbList] = useState<KnowledgeBase[]>([])
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null)
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [retrievalResults, setRetrievalResults] = useState<RetrievalResult[]>([])
  const [retrievalQuery, setRetrievalQuery] = useState('')
  const [retrievalLoading, setRetrievalLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()
  const uploadRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadKbList() }, [])
  useEffect(() => { if (selectedKb) loadDocuments(selectedKb.id) }, [selectedKb])

  const loadKbList = async () => {
    try {
      const list = await knowledgeBaseApi.listAll()
      setKbList(list)
    } catch {
      message.error('加载知识库失败')
    }
  }

  const loadDocuments = async (kbId: number) => {
    try {
      const docs = await knowledgeBaseApi.listDocuments(kbId)
      setDocuments(docs)
    } catch {
      message.error('加载文档失败')
    }
  }

  const openCreateModal = () => {
    setEditingKb(null)
    form.resetFields()
    form.setFieldsValue({ isPublic: false })
    setModalOpen(true)
  }

  const openEditModal = (kb: KnowledgeBase) => {
    setEditingKb(kb)
    form.setFieldsValue({ name: kb.name, description: kb.description, isPublic: kb.isPublic })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    const values = await form.validateFields()
    try {
      if (editingKb) {
        await knowledgeBaseApi.update(editingKb.id, values.name, values.description, values.isPublic ?? false)
        message.success('更新成功')
      } else {
        await knowledgeBaseApi.create(values.name, values.description, values.isPublic ?? false)
        message.success('创建成功')
      }
      setModalOpen(false)
      await loadKbList()
    } catch {
      message.error('操作失败')
    }
  }

  const handleDeleteKb = async (kb: KnowledgeBase) => {
    try {
      await knowledgeBaseApi.delete(kb.id)
      message.success('删除成功')
      if (selectedKb?.id === kb.id) {
        setSelectedKb(null)
        setDocuments([])
      }
      await loadKbList()
    } catch {
      message.error('删除失败')
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedKb) return
    setUploading(true)
    try {
      await knowledgeBaseApi.uploadDocument(selectedKb.id, file)
      message.success('上传成功')
      await loadDocuments(selectedKb.id)
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  const handleDeleteDoc = async (doc: KnowledgeDocument) => {
    try {
      await knowledgeBaseApi.deleteDocument(doc.kbId, doc.id)
      message.success('删除成功')
      await loadDocuments(doc.kbId)
    } catch {
      message.error('删除失败')
    }
  }

  const handleRetrieval = async () => {
    if (!retrievalQuery.trim() || !selectedKb) return
    setRetrievalLoading(true)
    try {
      const results = await knowledgeBaseApi.retrieval(selectedKb.id, retrievalQuery)
      setRetrievalResults(results)
    } catch {
      message.error('召回测试失败')
    } finally {
      setRetrievalLoading(false)
    }
  }

  const isOwner = (kb: KnowledgeBase) => kb.userId === user?.userId

  const docColumns = [
    { title: '文件名', dataIndex: 'filename', key: 'filename', ellipsis: true },
    { title: '分块数', dataIndex: 'chunkCount', key: 'chunkCount', width: 80 },
    {
      title: '上传时间', dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, doc: KnowledgeDocument) => (
        selectedKb && isOwner(selectedKb) ? (
          <Popconfirm title="确认删除？" onConfirm={() => handleDeleteDoc(doc)}>
            <Button type="link" danger icon={<Trash2 size={14} />} size="small">删除</Button>
          </Popconfirm>
        ) : <span style={{ color: 'var(--color-text-light)' }}>—</span>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Left: KB list */}
      <div style={{
        width: 280,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <div style={{ padding: 'var(--space-4) var(--space-3) var(--space-3)' }}>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            block
            onClick={openCreateModal}
            style={{ borderRadius: 'var(--radius-md)', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            新建知识库
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {kbList.length === 0 && (
            <div style={{ padding: 20, color: 'var(--color-text-light)', textAlign: 'center', fontSize: 13 }}>暂无知识库</div>
          )}
          {kbList.map(kb => (
            <div
              key={kb.id}
              onClick={() => setSelectedKb(kb)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                cursor: 'pointer',
                background: selectedKb?.id === kb.id ? 'var(--color-sidebar-active)' : 'transparent',
                borderBottom: '1px solid var(--color-border-light)',
                borderLeft: selectedKb?.id === kb.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 500,
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: selectedKb?.id === kb.id ? 'var(--color-primary)' : 'var(--color-text)',
                  }}>
                    {kb.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Tooltip title={kb.isPublic ? '公开' : '私有'}>
                      {kb.isPublic
                        ? <Globe size={12} style={{ color: 'var(--color-success)' }} />
                        : <Lock size={12} style={{ color: 'var(--color-text-muted)' }} />}
                    </Tooltip>
                    {!isOwner(kb) && (
                      <Tag style={{ fontSize: 10, lineHeight: '14px', padding: '0 4px', margin: 0 }}>他人</Tag>
                    )}
                    {kb.description && (
                      <Text style={{ fontSize: 11, color: 'var(--color-text-muted)' }} ellipsis title={kb.description}>
                        {kb.description}
                      </Text>
                    )}
                  </div>
                </div>
                {isOwner(kb) && (
                  <Space size={2} onClick={e => e.stopPropagation()}>
                    <Button type="text" icon={<Edit2 size={14} />} size="small" onClick={() => openEditModal(kb)} style={{ color: 'var(--color-text-muted)' }} />
                    <Popconfirm title="确认删除此知识库？" onConfirm={() => handleDeleteKb(kb)}>
                      <Button type="text" icon={<Trash2 size={14} />} size="small" style={{ color: 'var(--color-text-muted)' }} />
                    </Popconfirm>
                  </Space>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: documents + retrieval */}
      {selectedKb ? (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', padding: 'var(--space-6)' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>文档管理</span>
                <Tag>{selectedKb.name}</Tag>
                {selectedKb.isPublic
                  ? <Tag color="success" icon={<Globe size={12} />}>公开</Tag>
                  : <Tag icon={<Lock size={12} />}>私有</Tag>}
              </div>
            }
            styles={{ header: { borderBottom: '1px solid var(--color-border-light)' } }}
            extra={
              isOwner(selectedKb) ? (
                <>
                  <input
                    ref={uploadRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleUpload}
                    accept=".pdf,.doc,.docx,.txt,.md"
                  />
                  <Button
                    type="primary"
                    icon={<Upload size={16} />}
                    loading={uploading}
                    onClick={() => uploadRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    上传文档
                  </Button>
                </>
              ) : null
            }
          >
            <Table
              dataSource={documents}
              columns={docColumns}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: isOwner(selectedKb) ? '暂无文档，请上传' : '该知识库暂无文档' }}
            />
          </Card>

          <Card
            title="召回测试"
            styles={{ header: { borderBottom: '1px solid var(--color-border-light)' } }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Input
                value={retrievalQuery}
                onChange={e => setRetrievalQuery(e.target.value)}
                onPressEnter={handleRetrieval}
                placeholder="输入测试查询..."
                style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
              />
              <Button
                type="primary"
                icon={<Search size={16} />}
                loading={retrievalLoading}
                onClick={handleRetrieval}
                disabled={!retrievalQuery.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                测试
              </Button>
            </div>
            {retrievalResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {retrievalResults.map((r, i) => (
                  <Card key={i} size="small" style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                    <Text style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{r.content}</Text>
                  </Card>
                ))}
              </div>
            )}
            {!retrievalLoading && retrievalResults.length === 0 && retrievalQuery && (
              <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 16 }}>暂无结果</div>
            )}
          </Card>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)', gap: 12 }}>
          <Database size={48} strokeWidth={1.5} style={{ color: 'var(--color-border)' }} />
          <span style={{ fontSize: 14 }}>请从左侧选择一个知识库</span>
        </div>
      )}

      <Modal
        title={editingKb ? '编辑知识库' : '新建知识库'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="确认"
        cancelText="取消"
        width={460}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入知识库名称' }]}>
            <Input placeholder="知识库名称" style={{ borderRadius: 'var(--radius-md)' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="知识库描述（可选）" style={{ borderRadius: 'var(--radius-md)' }} />
          </Form.Item>
          <Form.Item name="isPublic" label="访问权限" valuePropName="checked">
            <Switch
              checkedChildren={<><Globe size={14} /> 公开</>}
              unCheckedChildren={<><Lock size={14} /> 私有</>}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
