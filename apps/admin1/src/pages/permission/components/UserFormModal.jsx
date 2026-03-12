import React, { useEffect } from "react"
import { Modal, Form, Input, Select, message, Checkbox } from "antd"
import BotRoleSelector from "./BotRoleSelector"
import { getUserInfoFromSso } from "@/api/permission/api"

const UserFormModal = ({
  form,
  visible,
  isEditing,
  currentRecord,
  onSave,
  onCancel,
  whetherAdmin,
  isLoading,
  botList //空间下拉枚举
}) => {
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        ...currentRecord,
        botRole: currentRecord.roles
          ? currentRecord.roles.map((item) => ({
              bot: item.botNo,
              role: item.roleNo
            }))
          : []
      })
    } else {
      form.resetFields()
    }
  }, [currentRecord, form, visible])

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(values)
    })
  }

  const checkUsername = (rule, value, callback) => {
    if (!value) return callback()
    getUserInfoFromSso({ username: value })
      .then((res) => {
        if (res.success && res.data?.username) {
          callback()
        } else {
          callback("域账号不存在")
        }
      })
      .catch((err) => {
        callback(err.message || "接口异常，请重试")
      })
  }

  return (
    <Modal
      open={visible}
      title={isEditing ? "编辑用户" : "新建用户"}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={isLoading}
      width={650}
    >
      <Form
        form={form}
        labelCol={{
          span: 5
        }}
        wrapperCol={{
          span: 18
        }}
      >
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名!" }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="username"
          label="域账号"
          validateTrigger="onBlur"
          rules={[
            { required: true, message: "请输入域账号!" },
            isEditing ? {} : { validator: checkUsername }
          ]}
        >
          <Input disabled={isEditing} />
        </Form.Item>

        <Form.Item
          name="mobile"
          label="手机"
          rules={[
            {
              pattern: /^1[3456789]\d{9}$/,
              message: "请输入正确的手机号码"
            }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            {
              type: "email",
              message: "请输入正确的邮箱地址"
            }
          ]}
        >
          <Input />
        </Form.Item>

        {isEditing && (
          <Form.Item label="创建时间">
            <span>{currentRecord.gmtCreated}</span>
          </Form.Item>
        )}
        <Form.Item
          name="isSuperAdmin"
          label="是否超管"
          valuePropName="checked"
          initialValue={currentRecord.isSuperAdmin || false}
        >
          <Checkbox />
        </Form.Item>

        {/* 新增的角色权限表单项 */}
        <Form.Item
          name="botRole"
          label="角色权限"
          rules={[
            {
              validator: async (_, value) => {
                console.log(value)
                // 如果value是空数组，说明没有选择任何角色权限
                if (!value || value.length === 0) {
                  return Promise.reject("请选择空间和角色权限!")
                }
                // 需要判断value中的bot和role_no是否都有值
                const hasError = value.some((item) => !item.bot || !item.role)
                if (hasError) {
                  return Promise.reject("请选择空间和角色权限!")
                }
              }
            }
          ]}
        >
          <BotRoleSelector botList={botList} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UserFormModal
