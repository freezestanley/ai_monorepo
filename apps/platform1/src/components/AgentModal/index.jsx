import { useEffect, useState, useMemo } from "react"
import { Modal, Form, Input, Button, message, Select } from "antd"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { skillAvatarList } from "@/assets/imgUrl"
import { useFetchAppPlatformList } from "@/api/bot"
import "./index.scss"
import { AVATAR_ICON_TYPE } from "@/constants"
import SecurityPolicySwitch from "../SecurityPolicySwitch"
import { useUpdateAgent, useCreateAgent } from "@/api/agent"
import { generateNO } from "@/utils"

const AgentModal = ({
  visible,
  onClose,
  initialValues,
  agentNo,
  currentBotNo,
  onSuccess = () => {}
}) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const isEditing = initialValues.agentNo

  const generateAgentNo = useMemo(() => {
    return generateNO("a")
  }, [])

  const { data: appPlatformList = [] } = useFetchAppPlatformList()
  const { mutate: createAgent } = useCreateAgent()
  const { mutate: updateAgent } = useUpdateAgent()

  const onFinish = (values) => {
    console.log("Form values: ", values)
    const createOrUpdate = isEditing ? updateAgent : createAgent
    createOrUpdate(
      {
        ...values,
        agentNo: isEditing ? agentNo : values.agentNo,
        botNo: currentBotNo
      },
      {
        onSuccess: (e) => {
          console.log(e)
          queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST_BY_PAGE])
          if (e.success) {
            message.success("更新成功")
            onSuccess()
          } else {
            // @ts-ignore
            message.error(e.message)
          }
        }
      }
    )
    onClose()
  }

  return (
    <Modal
      title={`${isEditing ? "Agent基础设置" : "新增Agent"}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          确定
        </Button>
      ]}
    >
      <Form
        form={form}
        onFinish={onFinish}
        initialValues={initialValues}
        className="mt-5"
        labelCol={{
          span: 5
        }}
      >
        <Form.Item
          name="agentName"
          label="Agent名称"
          rules={[{ required: true, message: "Agent名称是必填的" }]}
        >
          <Input placeholder="请输入Agent名称" />
        </Form.Item>
        {!isEditing && (
          <Form.Item
            name="agentNo"
            label="Agent编号"
            initialValue={generateAgentNo}
            rules={[{ required: true, message: "Agent编号是必填的" }]}
          >
            <Input placeholder="请输入Agent编号" />
          </Form.Item>
        )}

        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="请输入描述" />
        </Form.Item>
        <Form.Item
          label="可见应用端"
          name="supportedPlatforms"
          tooltip={"若本Agent所属空间未配置对应应用端，则本Agent不可见"}
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
        <Form.Item
          tooltip="启用后,安全网关将过滤敏感词等风险信息"
          label="安全策略"
          name="enableSecurityPolicy"
          valuePropName="checked"
          initialValue={true}
        >
          <SecurityPolicySwitch form={form} name="enableSecurityPolicy" disabled={true} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AgentModal
