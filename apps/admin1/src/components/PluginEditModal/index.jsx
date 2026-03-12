import { useEffect, useState } from "react"
import { Modal, Form, Row, Col, Input, Button, message, Tabs, Switch } from "antd"
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { useLocation, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
// import { QUERY_KEYS } from "@/constants/queryKeys"
import pluginIcon from "@/assets/img/tool.png"
import "./index.scss"
import { useCreatePlugin, useUpdatePlugin, useShowAdvanceSetting } from "@/api/pluginManage"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

const HeaderTips = () => {
  return (
    <div className="header-tips">
      <div className="tips-head">请求头列表</div>
      <div className="tips-content">
        HTTP请求头列表是客户端程序和服务器在每个HTTP请求和响应中发送和接收的字符串列表。这些标头通常对最终用户不可见，仅由服务器和客户端应用程序处理或记录。
      </div>
    </div>
  )
}

const PluginEditModal = (props) => {
  const { mode = "add", visible, onClose, onSuccess, botNo, pluginInfo } = props
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [tabType, setTabType] = useState("normal") // 'normal' or 'mcp'
  const initialValues = {
    name: "",
    description: "",
    url: "",
    headerInfoList: []
  }

  const queryClient = useQueryClient()
  const { mutate: createPlugin, isLoading: createLoading } = useCreatePlugin()
  const { mutate: updatePlugin, isLoading: editLoading } = useUpdatePlugin()

  const { data: showAdvanceSettingRes } = useShowAdvanceSetting({ botNo })

  const { studioenv } = useStudioPublishData()

  const onFinish = (values) => {
    if (mode === "add") {
      handleCreate(values)
    } else {
      handleModify(values)
    }
  }
  const handleCreate = (values) => {
    createPlugin(
      {
        botNo,
        ...values,
        type: tabType === "normal" ? "NORMAL" : "MCP"
      },
      {
        onSuccess: (e) => {
          if (e.success && e.data) {
            const { pluginNo } = e.data
            message.success("工具已创建，请继续添加工具")
            navigate(`/plugin/${pluginNo}?botNo=${botNo}&studioenv=${studioenv || ""}`)
            onSuccess?.()
          } else {
            // @ts-ignore
            message.error(e.message)
          }
        },
        onError: (e) => {
          console.log(e)
        }
      }
    )
  }
  const handleModify = (values) => {
    updatePlugin(
      {
        botNo,
        pluginNo: pluginInfo.pluginNo,
        ...values,
        type: tabType === "normal" ? "NORMAL" : "MCP"
      },
      {
        onSuccess: (e) => {
          console.log(e)
          if (e.success) {
            onSuccess?.()
          } else {
            // @ts-ignore
            message.error(e.message)
          }
        }
      }
    )
  }

  const handleTabChange = (key) => {
    setTabType(key)
  }

  useEffect(() => {
    form.setFieldsValue(mode === "add" ? initialValues : pluginInfo)

    // 根据插件类型设置选项卡，无论是add还是modify模式
    if (pluginInfo && pluginInfo.type === "MCP") {
      console.log("设置插件类型为MCP:", pluginInfo)
      setTabType("mcp")
    } else {
      setTabType("normal")
    }
  }, [visible, pluginInfo])

  const tabItems = [
    {
      key: "normal",
      label: "普通"
    },
    {
      key: "mcp",
      label: "MCP"
    }
  ]

  return (
    <Modal
      title={mode === "add" ? "新增工具" : "编辑工具配置"}
      width={560}
      open={visible}
      onCancel={onClose}
      className="plugin-edit-modal"
      closable={false}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={createLoading || editLoading}
          onClick={() => form.submit()}
        >
          确定
        </Button>
      ]}
    >
      {/* <div className="header-img">
        <img src={pluginIcon} alt="" />
      </div> */}

      <Tabs
        items={tabItems}
        activeKey={tabType}
        onChange={mode === "modify" ? undefined : handleTabChange}
        className="mb-4"
      />
      {tabType === "mcp" && (
        <p className="text-red-500">
          <InfoCircleOutlined className="mr-1" />
          如遇MCP服务无法注册情况，请与管理员联系
        </p>
      )}
      <Form
        form={form}
        onFinish={onFinish}
        // initialValues={initialValues}
        layout="vertical"
        className="mt-5"
        labelCol={{
          span: 5
        }}
      >
        <Form.Item
          name="name"
          label="工具名称"
          rules={[{ required: true, message: "请输入工具名称" }]}
        >
          <Input
            placeholder="请输入工具名称，确保名称含义清晰且符合平台规范"
            maxLength={30}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="工具描述"
          rules={[{ required: true, message: "请输入工具描述" }]}
        >
          <Input.TextArea
            placeholder="请输入工具的主要功能和使用场景，确保内容符合平台规范。帮助用户/大模型更好地理解"
            maxLength={3000}
            showCount
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          name="url"
          label="工具 URL"
          rules={[{ required: true, message: "请输入工具 URL" }]}
        >
          <Input placeholder="请输入工具的访问地址或相关资源的链接" />
        </Form.Item>

        {tabType === "normal" && (
          <Form.Item
            label="Header 列表"
            tooltip={{
              title: HeaderTips,
              icon: <InfoCircleOutlined />,
              color: "#fff",
              placement: "right",
              overlayClassName: "plugin-edit-modal-header-tips",
              overlayInnerStyle: { maxWidth: "380px" }
            }}
            labelCol={{ span: 24 }}
            style={{ position: "relative" }}
          >
            <Form.List name="headerInfoList">
              {(fields, { add, remove }) => (
                <div>
                  <div className="headers-list-wrap">
                    <Row gutter={16} className="header-row">
                      <Col span={9}>Key</Col>
                      <Col span={12}>Value</Col>
                      <Col span={3}>操作</Col>
                    </Row>
                    <div className="headers-list-content">
                      {fields.map((field) => (
                        <Row key={field.key} gutter={16}>
                          <Col span={9}>
                            <Form.Item
                              name={[field.name, "key"]}
                              // label="Key"
                              rules={[{ required: false, message: "请输入Name" }]}
                            >
                              <Input placeholder="Name" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name={[field.name, "value"]}
                              // label="Value"
                              rules={[{ required: false, message: "请输入Value" }]}
                            >
                              <Input placeholder="Value" />
                            </Form.Item>
                          </Col>
                          <Col span={3}>
                            <div style={{ lineHeight: "32px" }}>
                              <DeleteOutlined onClick={() => remove(field.name)} />
                            </div>
                          </Col>
                        </Row>
                      ))}
                    </div>
                  </div>
                  <div className="mt-[10px] -ml-[5px]">
                    <Button
                      className=" !text-[#7F56D9]"
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => add()}
                    >
                      新增
                    </Button>
                  </div>
                </div>
              )}
            </Form.List>
          </Form.Item>
        )}

        {!!showAdvanceSettingRes?.data && (
          <Form.Item
            name={["extraInfo", "enableGatewayAuthHeader"]}
            label="启用网关认证Header"
            valuePropName="checked"
            layout="horizontal"
            labelCol={{ span: 7 }}
            initialValue={false}
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default PluginEditModal
