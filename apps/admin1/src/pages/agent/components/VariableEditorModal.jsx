import React, { useState, useEffect } from "react"
import { Modal, Form, Input, Button, Switch, message } from "antd"
import { ExclamationCircleOutlined } from "@ant-design/icons"

const VariableEditorModal = ({
  visible,
  onClose,
  initialVars = [],
  onConfirm,
  showAutoExtraction = false,
  editingVar = null
}) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (visible) {
      if (editingVar) {
        // 编辑模式
        form.setFieldsValue({
          varName: editingVar.varName,
          description: editingVar.description || "",
          defaultValue: editingVar.defaultValue || "",
          enabled: editingVar.enabled !== undefined ? editingVar.enabled : true,
          autoExtraction: editingVar.autoExtraction || 0
        })
      } else {
        // 新增模式
        form.resetFields()
        form.setFieldsValue({
          enabled: true,
          autoExtraction: 0
        })
      }
    }
  }, [visible, editingVar, form])

  // 生成变量编号
  const generateVarNo = () => {
    return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 确认保存
  const handleConfirm = async () => {
    try {
      setSubmitting(true)
      const values = await form.validateFields()

      // 检查变量名称是否重复（编辑时排除自己）
      const isDuplicate = initialVars.some((v) => {
        // 如果是编辑模式，排除当前编辑的变量
        if (editingVar && v.varNo === editingVar.varNo) {
          return false
        }
        return v.varName === values.varName.trim()
      })

      if (isDuplicate) {
        message.error("变量名称已存在，请使用其他名称")
        setSubmitting(false)
        return
      }

      let updatedVars = []
      if (editingVar) {
        // 编辑模式：更新现有变量
        updatedVars = initialVars.map((v) =>
          v.varNo === editingVar.varNo
            ? {
                ...v,
                ...values,
                varName: values.varName.trim()
              }
            : v
        )
      } else {
        // 新增模式：添加新变量
        const newVar = {
          varNo: generateVarNo(),
          ...values,
          varName: values.varName.trim()
        }
        updatedVars = [...initialVars, newVar]
      }

      onConfirm?.(updatedVars)
      form.resetFields()
      setSubmitting(false)
    } catch (error) {
      setSubmitting(false)
      console.error("表单验证失败:", error)
    }
  }

  // 取消操作
  const handleCancel = () => {
    form.resetFields()
    onClose?.()
  }

  return (
    <Modal
      title={editingVar ? "编辑变量" : "添加变量"}
      open={visible}
      onCancel={handleCancel}
      onOk={handleConfirm}
      confirmLoading={submitting}
      width={600}
      okText="确定"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="varName"
          label="变量名称"
          rules={[
            { required: true, message: "请输入变量名称" },
            {
              pattern: /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/,
              message: "大小写字母开头，仅支持大小写字母及中划线和下划线，不超过40个字符"
            }
          ]}
        >
          <Input placeholder="请输入变量名称" maxLength={40} />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="请输入描述" maxLength={200} showCount rows={3} allowClear />
        </Form.Item>

        <Form.Item name="defaultValue" label="默认值">
          <Input.TextArea
            placeholder="请输入默认值"
            maxLength={1000}
            showCount
            rows={3}
            allowClear
          />
        </Form.Item>

        {showAutoExtraction && (
          <Form.Item
            name="autoExtraction"
            layout="horizontal"
            label="自动提取变量"
            valuePropName="checked"
            getValueFromEvent={(checked) => (checked ? 1 : 0)}
            getValueProps={(value) => ({ checked: value === 1 })}
            className="mb-0 flex-1"
          >
            <Switch size="small" />
          </Form.Item>
        )}

        <Form.Item
          name="enabled"
          label="启用状态"
          layout="horizontal"
          valuePropName="checked"
          className="mb-0 flex-1"
        >
          <Switch size="small" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default VariableEditorModal
