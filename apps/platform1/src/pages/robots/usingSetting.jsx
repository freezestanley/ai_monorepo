import { Modal, Button, Form, Radio } from "antd"

function UsingSetting({ visible, onClose, onFinish, initialValues }) {
  const [form] = Form.useForm()
  const handleConfirm = () => {
    form.validateFields().then((values) => {
      onFinish(values)
    })
  }

  return (
    <Modal
      title="空间使用设置"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleConfirm}>
          确定
        </Button>
      ]}
    >
      <Form
        form={form}
        initialValues={initialValues}
        className="mt-5"
        labelCol={{
          span: 9
        }}
      >
        <Form.Item name="showInChatWnd" label="在快速问答中展示快捷入口">
          <Radio.Group>
            <Radio value="1">展示</Radio>
            <Radio value="2">不展示</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UsingSetting
