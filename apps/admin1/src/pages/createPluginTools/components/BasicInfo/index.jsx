import { Col, Form, Input, Select } from "antd"
import { httpMethodOptions } from "../../constants"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { useEffect, useState } from "react"

const TextArea = Input.TextArea

function BasicInfo({ form, pluginInfo, disabled }) {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { type = "NORMAL", mcpToolNo, toolNo } = queryParams
  const [formValues, setFormValues] = useState({})

  const isMcpTool = type === "MCP"
  const isEditMode = !!toolNo

  console.log("BasicInfo组件参数:", {
    type,
    mcpToolNo,
    toolNo,
    isEditMode,
    form: form.getFieldsValue()
  })

  useEffect(() => {
    if (isMcpTool) {
      // MCP类型的工具，工具名称不可编辑
      form.setFieldsValue({
        type: "MCP"
      })
      console.log("设置MCP类型:", form.getFieldsValue())
    } else {
      form.setFieldsValue({
        type: "NORMAL"
      })
    }
  }, [form, isMcpTool])

  // 监听表单值变化
  const handleValuesChange = (changedValues, allValues) => {
    // console.log("BasicInfo表单值变化:", allValues)
    setFormValues(allValues)
  }

  return (
    <div className="p-3">
      <Form
        form={form}
        layout="vertical"
        labelCol={{
          xs: { span: 24 },
          sm: { span: 4 }
        }}
        onValuesChange={handleValuesChange}
        disabled={disabled}
      >
        <Form.Item name="type" hidden>
          <Input />
        </Form.Item>

        <Col span={24} className="mb-6">
          <Form.Item
            label="工具名称"
            name={`toolName`}
            rules={[{ required: true, message: "请输入工具名称" }]}
          >
            <Input
              placeholder="请输入工具名称，确保名称含义清晰且符合平台规范"
              disabled={isMcpTool || disabled}
            />
          </Form.Item>
        </Col>

        <Col span={24} className="mb-6">
          <Form.Item
            label="工具描述"
            name={`toolDesc`}
            rules={[{ required: true, message: "请输入工具描述" }]}
          >
            <TextArea
              rows={4}
              placeholder="请描述工具的主要功能和使用场景，确保内容含义清晰且符合平台规范。帮助用户/大模型更好地理解"
            />
          </Form.Item>
        </Col>

        {!isMcpTool && (
          <>
            <Col span={24} className="mb-6">
              <Form.Item
                label="工具路径"
                name={`path`}
                rules={[{ required: true, message: "请输入标准问题" }]}
              >
                <Input
                  placeholder="输入工具具体路径，以 / 开头，如 /search"
                  addonBefore={pluginInfo.url}
                />
              </Form.Item>
            </Col>
            <Col span={24} className="mb-6">
              <Form.Item
                label="请求方法"
                name={`httpMethodName`}
                initialValue="GET"
                rules={[{ required: true, message: "请输入请求方法" }]}
              >
                <Select placeholder="请输入请求方法" options={httpMethodOptions} />
              </Form.Item>
            </Col>
          </>
        )}
      </Form>
    </div>
  )
}

export default BasicInfo
