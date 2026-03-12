import { useMemo } from "react"
import { Modal, Form, Input, Button, Select, message } from "antd"
import { useUpdateSubscribeSkill } from "@/api/skill"
import { useFetchAppPlatformList } from "@/api/bot"

const SubscribeAgentModal = ({
  visible,
  onClose,
  botNo,
  initialValues: initValues,
  onSuccess = () => {}
}) => {
  const [form] = Form.useForm()
  const { mutate: updateSubscribeSkill } = useUpdateSubscribeSkill()
  const { data: appPlatformList = [] } = useFetchAppPlatformList()

  const initialValues = useMemo(() => {
    const { subscribeSettings = {} } = initValues || {}
    // 如果是订阅工作流，则取 subscribeSettings 覆盖原默认值
    return { ...initValues, ...subscribeSettings }
  }, [initValues])

  const handleUpdateSubscribeSkill = (values) => {
    updateSubscribeSkill(
      {
        botNo,
        ...values,
        type: initialValues.type
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success("更新成功")
            onSuccess()
          } else {
            message.error(e.message)
          }
        }
      }
    )
    onClose()
  }

  const handleConfirm = () => {
    form.validateFields().then((values) => {
      handleUpdateSubscribeSkill(values)
    })
  }

  return (
    <Modal
      title={"订阅Agent设置"}
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
          span: 5
        }}
      >
        <Form.Item
          name="name"
          label="显示名称"
          rules={[{ required: true, message: "请输入显示名称" }]}
        >
          <Input placeholder="请输入显示名称" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="请输入描述" />
        </Form.Item>
        {initialValues.type !== "3" && (
          <Form.Item
            label="可见应用端"
            name="applicationPlatformTypes"
            tooltip={"若本工作流所属空间未配置对应应用端，则本工作流不可见"}
            initialValue={[...appPlatformList.map((item) => item.code)]}
            rules={[{ required: false, message: "请选择应用端" }]}
          >
            <Select
              allowClear
              style={{ width: 370 }}
              placeholder="请选择"
              mode="multiple"
              options={appPlatformList}
              fieldNames={{ label: "name", value: "code" }}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default SubscribeAgentModal
