import React from "react"
import { Modal, Form, Input } from "antd"
import AvatarSelect from "@/pages/addBot/components/AvatarSelect"
import { avatarMode } from "@/constants"

const SkillTemplateEditModal = ({
  visible,
  handleOk,
  handleCancel,
  form,
  selectedAvatar,
  handleAvatarSelect
}) => {
  return (
    <Modal
      title={"编辑工作流模板"}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
    >
      <div style={{ color: "grey", marginBottom: 15 }}>自定义工作流模板仅当前空间可见</div>
      <Form
        form={form}
        labelCol={{
          span: 6
        }}
        wrapperCol={{
          span: 16
        }}
      >
        <Form.Item
          name="name"
          label="工作流名称"
          rules={[{ required: true, message: "请输入工作流名称!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="工作流描述"
          rules={[{ required: true, message: "请输入工作流描述!" }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="description" label="类型">
          {form.getFieldValue("skillTypeName")}
        </Form.Item>
        {/* <Form.Item
          label="工作流头像"
          name="iconUrl"
          rules={[{ required: true, message: "请选择头像" }]}
          initialValue={selectedAvatar}
        >
          <AvatarSelect
            disabled={false}
            mode={avatarMode.skill}
            selectedAvatar={selectedAvatar}
            handleAvatarSelect={handleAvatarSelect}
          />
        </Form.Item> */}
      </Form>
    </Modal>
  )
}

export default SkillTemplateEditModal
