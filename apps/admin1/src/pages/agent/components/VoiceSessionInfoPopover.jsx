import React, { useState, useEffect } from "react"
import { Popover, Form, Input, Button, Space, message, Tooltip } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import { getVoiceAgentDetails } from "@/api/voiceAgent/api"

const { TextArea } = Input

const VoiceSessionInfoPopover = ({ onSessionInfoSubmit, variableConfigs = [], agentNo, botNo }) => {
  const [form] = Form.useForm()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentWebcallConfig, setCurrentWebcallConfig] = useState([])

  // 获取最新的通话详情配置
  const fetchLatestWebcallConfig = async () => {
    if (!agentNo || !botNo) return

    try {
      const res = await getVoiceAgentDetails({ agentNo, botNo })
      if (res && res.status === 200 && res.data && res.data.variableConfigs) {
        // 这里用 fieldName
        const validFields = res.data.variableConfigs.filter(
          (item) => item && item.name && item.fieldName
        )
        setCurrentWebcallConfig(validFields)
        console.log("获取到最新的通话详情配置:", validFields)
      } else {
        setCurrentWebcallConfig([])
      }
    } catch (error) {
      console.error("获取最新通话详情配置失败:", error)
      // 如果获取失败，使用传入的 variableConfigs
      setCurrentWebcallConfig(
        Array.isArray(variableConfigs)
          ? variableConfigs.filter((item) => item && item.name && item.fieldName)
          : []
      )
    }
  }

  // 在组件打开时获取最新配置
  const handleVisibleChange = (newVisible) => {
    setVisible(newVisible)
    if (newVisible) {
      // 弹窗打开时获取最新配置
      fetchLatestWebcallConfig()
    }
  }

  // 初始化时使用传入的配置
  useEffect(() => {
    setCurrentWebcallConfig(
      Array.isArray(variableConfigs)
        ? variableConfigs.filter((item) => item && item.name && item.fieldName)
        : []
    )
  }, [variableConfigs])

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      console.log("用户输入的会话信息:", values)

      // 将用户输入的值转换为 agentVars 格式
      const agentVars = Object.entries(values).map(([key, value]) => {
        // 根据 key 找到对应的字段名称
        const field = currentWebcallConfig.find((f) => f.fieldName === key)
        return {
          varName: key,
          value: value
        }
      })

      console.log("转换后的 agentVars:", agentVars)

      // 调用父组件传入的回调函数，传递原始值和转换后的格式
      if (onSessionInfoSubmit) {
        await onSessionInfoSubmit({
          originalValues: values,
          agentVars: agentVars
        })
      }

      message.success("会话信息已设置")
      setVisible(false)
      // 不重置表单，保持用户输入的值
      // form.resetFields()
    } catch (error) {
      console.error("设置会话信息失败:", error)
      if (error.errorFields) {
        // 表单验证错误
        message.error("请检查输入信息")
      } else {
        message.error("设置会话信息失败")
      }
    } finally {
      setLoading(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    setVisible(false)
    form.resetFields()
  }

  // 处理清空
  const handleClear = () => {
    form.resetFields()
    message.success("已清空会话信息")
  }

  // 气泡框内容
  const content = (
    <div style={{ width: 320 }}>
      <Form form={form} layout="vertical">
        {currentWebcallConfig && currentWebcallConfig.length > 0 ? (
          // 根据 currentWebcallConfig 动态生成表单项
          <>
            {currentWebcallConfig.map((field, index) => (
              <Form.Item
                key={field.fieldName || index}
                label={field.name}
                name={field.fieldName}
                rules={[{ required: true, message: `请输入${field.name}` }]}
              >
                <Input placeholder={`请输入${field.name}`} />
              </Form.Item>
            ))}

            <Form.Item className="mb-0">
              <Space className="w-full justify-between">
                <Button size="small" onClick={handleClear}>
                  清空
                </Button>
                <Space>
                  <Button size="small" onClick={handleCancel}>
                    取消
                  </Button>
                  <Button type="primary" size="small" loading={loading} onClick={handleSubmit}>
                    确定
                  </Button>
                </Space>
              </Space>
            </Form.Item>
          </>
        ) : (
          // 如果没有配置通话详情字段，显示提示
          <div className="text-center py-4">
            <div className="text-[14px] text-[#475467] mb-2">暂无业务自定义字段</div>
            <div className="text-[12px] text-[#98A2B3]">请先在设置中配置业务自定义字段</div>
          </div>
        )}
      </Form>
    </div>
  )

  return (
    <Popover
      content={content}
      title="设置会话信息"
      trigger="click"
      open={visible}
      onOpenChange={handleVisibleChange}
      placement="top"
      overlayClassName="voice-session-info-popover"
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      destroyTooltipOnHide={true}
    >
      <Tooltip title="设置会话信息">
        <i className="iconfont icon-huihuarenqunshezhi font-[400] text-[21px] text-[#98A2B3]  hover:text-[#7F56D9] cursor-pointer"></i>
      </Tooltip>
    </Popover>
  )
}

export default VoiceSessionInfoPopover
