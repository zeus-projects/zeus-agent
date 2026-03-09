import { useEffect, useRef, useState } from 'react'
import {
  Button, Card, Form, Input, Modal, Popconfirm,
  Table, Typography, message, Space, Tag,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { knowledgeBaseApi } from '../../api/knowledgeBase'
import type { KnowledgeBase, KnowledgeDocument, RetrievalResult } from '../../api/knowledgeBase'

const { Text } = Typography
const { TextArea } = Input

export function KnowledgeBasePage() {
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

  useEffect(() => {
    loadKbList()
  }, [])

  useEffect(() => {
    if (selectedKb) loadDocuments(selectedKb.id)
  }, [selectedKb])

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
    setModalOpen(true)
  }

  const openEditModal = (kb: KnowledgeBase) => {
    setEditingKb(kb)
    form.setFieldsValue({ name: kb.name, description: kb.description })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    const values = await form.validateFields()
    try {
      if (editingKb) {
        await knowledgeBaseApi.update(editingKb.id, values.name, values.description)
        message.success('更新成功')
      } else {
        await knowledgeBaseApi.create(values.name, values.description)
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
        <Popconfirm title="确认删除？" onConfirm={() => handleDeleteDoc(doc)}>
          <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', gap: 16 }}>
      {/* Left: KB list */}
      <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button type="primary" icon={<PlusOutlined />} block onClick={openCreateModal}>
          新建知识库
        </Button>
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
          {kbList.length === 0 && (
            <div style={{ padding: 16, color: '#999', textAlign: 'center', fontSize: 13 }}>暂无知识库</div>
          )}
          {kbList.map(kb => (
            <div
              key={kb.id}
              onClick={() => setSelectedKb(kb)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                background: selectedKb?.id === kb.id ? '#e6f4ff' : 'transparent',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kb.name}</div>
                {kb.description && (
                  <div style={{ fontSize: 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {kb.description}
                  </div>
                )}
              </div>
              <Space size={4} onClick={e => e.stopPropagation()}>
                <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEditModal(kb)} />
                <Popconfirm title="确认删除此知识库？" onConfirm={() => handleDeleteKb(kb)}>
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </Space>
            </div>
          ))}
        </div>
      </div>

      {/* Right: documents + retrieval */}
      {selectedKb ? (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          <Card
            title={<>文档管理 <Tag>{selectedKb.name}</Tag></>}
            extra={
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
                  icon={<UploadOutlined />}
                  loading={uploading}
                  onClick={() => uploadRef.current?.click()}
                >
                  上传文档
                </Button>
              </>
            }
          >
            <Table
              dataSource={documents}
              columns={docColumns}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: '暂无文档，请上传' }}
            />
          </Card>

          <Card title="召回测试">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Input
                value={retrievalQuery}
                onChange={e => setRetrievalQuery(e.target.value)}
                onPressEnter={handleRetrieval}
                placeholder="输入测试查询..."
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={retrievalLoading}
                onClick={handleRetrieval}
                disabled={!retrievalQuery.trim()}
              >
                测试
              </Button>
            </div>
            {retrievalResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {retrievalResults.map((r, i) => (
                  <Card key={i} size="small" style={{ background: '#fafafa' }}>
                    <Text style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{r.content}</Text>
                  </Card>
                ))}
              </div>
            )}
            {!retrievalLoading && retrievalResults.length === 0 && retrievalQuery && (
              <div style={{ color: '#999', textAlign: 'center', padding: 16 }}>暂无结果</div>
            )}
          </Card>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          请从左侧选择一个知识库
        </div>
      )}

      <Modal
        title={editingKb ? '编辑知识库' : '新建知识库'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入知识库名称' }]}>
            <Input placeholder="知识库名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="知识库描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
