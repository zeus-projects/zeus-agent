import { useState } from 'react'
import { Upload, message, Alert } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { uploadDocument } from '../../api/document'

const { Dragger } = Upload

export function FileUpload() {
  const [result, setResult] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.txt,.docx,.doc,.md',
    showUploadList: false,
    disabled: uploading,
    beforeUpload: async (file) => {
      setUploading(true)
      setResult(null)
      try {
        const msg = await uploadDocument(file)
        setResult(msg)
        message.success('上传成功')
      } catch {
        message.error('上传失败，请检查后端服务')
      } finally {
        setUploading(false)
      }
      return false
    },
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <Dragger {...props} style={{ background: '#fafafa' }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {uploading ? '正在向量化，请稍候...' : '点击或拖拽文件到此处上传'}
        </p>
        <p className="ant-upload-hint">支持 PDF、TXT、DOCX、MD 等格式</p>
      </Dragger>
      {result && (
        <Alert
          message={result}
          type="success"
          showIcon
          style={{ marginTop: 12 }}
          closable
          onClose={() => setResult(null)}
        />
      )}
    </div>
  )
}
