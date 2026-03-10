import { Upload, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ImageUploadProps } from './types'

const ImageUpload = ({ maxCount = 1, listType = 'picture-card', onChange, onFinish, value, disabled }: ImageUploadProps) => {
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件!')
      return false
    }
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB!')
      return false
    }
    return true
  }

  const handleChange = (info: any) => {
    onChange?.(info)
    if (info.file.status === 'done') {
      const url = info.file.response?.data?.url || info.file.response?.data?.temporarySignatureUrl
      onFinish?.(url)
    }
  }

  return (
    <Upload
      listType={listType}
      maxCount={maxCount}
      beforeUpload={beforeUpload}
      onChange={handleChange}
      disabled={disabled}
    >
      {maxCount === 1 && value ? null : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传图片</div>
        </div>
      )}
    </Upload>
  )
}

export default ImageUpload
