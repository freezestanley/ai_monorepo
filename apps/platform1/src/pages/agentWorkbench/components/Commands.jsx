import { useFetchOutputType } from "@/api/common"
import NewRecursiveInputList from "@/components/NewRecursiveInputList"
import RecursiveInputList from "@/components/RecursiveInputList"
import { CommonContent } from "@/pages/xflow/CustomFlowchartFormPanel/CommonContent"
import { useCustomVariableType } from "@/pages/xflow/hooks"
import { CloseOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Col, Form, Input, Modal, Row, Select, Tag, InputNumber, Divider } from "antd"
import { useState } from "react"
const tagInputStyle = {
  height: 22,
  marginInlineEnd: 8,
  verticalAlign: "top",
  cursor: "pointer"
}
function Commands({
  title,
  form,
  commandList = [],
  onChange = (commandList, { isDelete = false } = {}) => {}
}) {
  const [modalVisible, setModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentOperation, setCurrentOperation] = useState({
    type: "add",
    index: 0
  })

  console.log("commandList commands:", commandList)
  const onAddNew = () => {
    setCurrentOperation({ type: "add", index: 0 })
    setModalVisible(true)
    form.resetFields()
  }
  const onHandleTagClick = (tag, index) => {
    setCurrentOperation({ type: "edit", index })
    form.setFieldsValue(tag)
    setModalVisible(true)
  }
  const onHandleClose = (tag) => {
    const newTagList = commandList.filter((item) => item.commandName !== tag.commandName)
    onChange(newTagList, { isDelete: true })
  }

  const onModalClose = () => {
    setModalVisible(false)
  }

  const { data: varOptions = [] } = useCustomVariableType()
  const onFinish = () => {
    return form.validateFields().then((values) => {
      const commandData = {
        ...values
      }
      const newCommandList = [...commandList]
      if (currentOperation.type === "add") {
        newCommandList.push(commandData)
      } else if (currentOperation.type === "edit") {
        newCommandList.splice(currentOperation.index, 1, commandData)
      }
      onChange(newCommandList)
      onModalClose()
      form.resetFields()
    })
  }

  return (
    <>
      {commandList.map((tag, index) => {
        return (
          <Tag
            key={tag.commandCode}
            closable={true}
            style={{
              userSelect: "none",
              cursor: "pointer"
            }}
            onClose={() => onHandleClose(tag)}
          >
            <a
              onClick={() => {
                onHandleTagClick(tag, index)
              }}
            >
              {tag.commandName}
            </a>
          </Tag>
        )
      })}

      <Tag style={tagInputStyle} icon={<PlusOutlined />} onClick={onAddNew}>
        添加新指令
      </Tag>
      <Modal
        width={800}
        open={modalVisible}
        centered
        onCancel={onModalClose}
        footer={null}
        maskClosable={false}
        closeIcon={false}
        wrapClassName="agent-command-wrapper-modal"
      >
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 15 }}
          size="middle"
        >
          <CommonContent
            title={title}
            containerClass="noPadding"
            extraRenderLeft={() => (
              <Button onClick={onModalClose} type="text" icon={<CloseOutlined />} />
            )}
            extraRender={() => (
              <Button type="primary" htmlType="submit" loading={isLoading}>
                保存
              </Button>
            )}
          >
            <Row className="mr-4">
              <Col span={24} className="mt-8">
                <Form.Item
                  labelCol={{
                    span: 4
                  }}
                  wrapperCol={{ span: 20 }}
                  name="commandName"
                  label="指令名称"
                  rules={[{ required: true, message: "请输入指令名称" }]}
                >
                  <Input placeholder="请输入指令名称" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  labelCol={{
                    span: 4
                  }}
                  wrapperCol={{ span: 20 }}
                  name="description"
                  label="指令描述"
                  rules={[{ required: true, message: "请输入指令描述" }]}
                >
                  <Input.TextArea placeholder="请输入指令描述" />
                </Form.Item>
              </Col>
            </Row>

            <Row className="mt-3">
              <Col span={12}>
                <Form.Item
                  name="callUrl"
                  label="调用地址"
                  rules={[{ required: true, message: "请输入调用地址" }]}
                >
                  <Input placeholder="请输入调用地址" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="protocol"
                  label="协议"
                  rules={[{ required: true, message: "请选择调用方式" }]}
                >
                  <Select placeholder="请选择调用方式">
                    {["http", "https"].map((method) => (
                      <Select.Option key={method} value={method}>
                        {method}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="httpMethodName"
                  label="调用方式"
                  rules={[{ required: true, message: "请选择调用方式" }]}
                >
                  <Select placeholder="请选择调用方式">
                    {["get", "post", "put", "delete"].map((method) => (
                      <Select.Option key={method} value={method}>
                        {method}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="retryCount"
                  label="重试次数"
                  initialValue={3}
                  rules={[{ required: true, message: "请输入重试次数" }]}
                >
                  <InputNumber placeholder="请输入重试次数" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="retryInterval"
                  label="重试间隔(秒)"
                  initialValue={10}
                  rules={[{ required: true, message: "请输入重试间隔" }]}
                >
                  <InputNumber placeholder="请输入重试间隔" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="readTimeout"
                  label="接口超时时间(秒)"
                  initialValue={30}
                  rules={[{ required: true, message: "请输入接口超时时间" }]}
                >
                  <InputNumber placeholder="请输入" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider>请求头配置</Divider>
            <Form.List name="headers">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Row key={field.key} gutter={16}>
                      <Col span={10}>
                        <Form.Item
                          name={[field.name, "key"]}
                          label="Key"
                          rules={[{ required: false, message: "请输入Key" }]}
                        >
                          <Input placeholder="Key" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          name={[field.name, "value"]}
                          label="Value"
                          rules={[{ required: false, message: "请输入Value" }]}
                        >
                          <Input placeholder="Value" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      </Col>
                    </Row>
                  ))}
                  <Row>
                    <Col span={20} offset={2}>
                      <Button type="dashed" onClick={() => add()} block>
                        添加请求头
                      </Button>
                    </Col>
                  </Row>
                </>
              )}
            </Form.List>

            {/* 输入项配置 */}
            <Divider>输入项配置</Divider>
            <Form.Item
              name="params"
              labelCol={{ span: 0 }}
              wrapperCol={{ span: 23 }}
              // initialValue={command.params}
            >
              <NewRecursiveInputList varOptions={varOptions} name="params" needDescInput={true} />
            </Form.Item>
            {/* 输出项配置 */}
            <Divider>输出项配置</Divider>

            <Form.Item name="response" labelCol={{ span: 0 }} wrapperCol={{ span: 23 }}>
              <NewRecursiveInputList varOptions={varOptions} name="response" needDescInput={true} />
            </Form.Item>
          </CommonContent>
        </Form>
      </Modal>
    </>
  )
}

export default Commands
