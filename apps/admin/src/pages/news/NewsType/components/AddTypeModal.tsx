import { useState, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd'
import { NewsTypeAPI } from '@/api/news'
import type { AddTypeModalProps } from '../types'

const { TextArea } = Input

// The axios interceptor returns response.data directly, so the actual
// resolved value has this shape rather than AxiosResponse.
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

const AddTypeModal: React.FC<AddTypeModalProps> = ({ visible, editingRecord, onOk, onCancel }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      if (editingRecord) {
        form.setFieldsValue({
          name: editingRecord.name,
          description: editingRecord.description,
          categorySort: editingRecord.categorySort,
          enabledStatus: editingRecord.enabledStatus === 'Y',
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ categorySort: 0, enabledStatus: false })
      }
    }
  }, [visible, editingRecord, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const data = {
        name: values.name,
        description: values.description,
        categorySort: values.categorySort,
        enabledStatus: values.enabledStatus ? 'Y' : 'N',
      }

      let response: ApiResponse
      if (editingRecord) {
        response = (await NewsTypeAPI.update(
          editingRecord.categoryNo,
          data
        )) as unknown as ApiResponse
      } else {
        response = (await NewsTypeAPI.create(data)) as unknown as ApiResponse
      }

      if (response.success) {
        message.success(editingRecord ? '更新成功' : '创建成功')
        form.resetFields()
        onOk()
      } else {
        message.error(response.message)
      }
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      message.error(editingRecord ? '更新失败' : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={editingRecord ? '编辑消息类别' : '新增消息类别'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ sort: 0, status: true }}>
        <Form.Item
          name="name"
          label="类别名称"
          rules={[
            { required: true, message: '请输入类别名称' },
            { max: 50, message: '类别名称不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入类别名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="类别描述"
          rules={[{ max: 200, message: '类别描述不能超过200个字符' }]}
        >
          <TextArea rows={4} placeholder="请输入类别描述" showCount maxLength={200} />
        </Form.Item>

        <Form.Item
          name="categorySort"
          label="排序"
          rules={[
            { required: true, message: '请输入排序值' },
            { type: 'number', min: 0, max: 9999, message: '排序值应在0-9999之间' },
          ]}
          extra="数值越小排序越靠前"
        >
          <InputNumber min={0} max={9999} style={{ width: '100%' }} placeholder="请输入排序值" />
        </Form.Item>

        <Form.Item name="enabledStatus" label="状态" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddTypeModal
