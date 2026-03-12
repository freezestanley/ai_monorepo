import React from "react"
import { Modal, Form, Input, Select, Button, Row, Col } from "antd"
import { PlusOutlined, MinusOutlined, CloseOutlined, InfoCircleFilled } from "@ant-design/icons"
import { TechnologyPositionEnum, TechnologyTypeEnum } from "../../config"
import styles from "./index.module.scss"

interface DeclareModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (values: any, cb: () => void) => void
}

const { TextArea } = Input
const { Option } = Select
const { confirm } = Modal

const DeclareModal: React.FC<DeclareModalProps> = ({ open, onCancel, onSubmit }) => {
  const [form] = Form.useForm()

  const showConfirm = (values: any) => {
    confirm({
      title: "提交申报提醒",
      icon: <InfoCircleFilled style={{ color: "#7c5cfc" }} />,
      content:
        "请确保技术申报信息填写无误，提交后将进入审批流程，审批通过后，该技术将共享于技术雷达中。",
      okText: "确定",
      cancelText: "取消",
      okButtonProps: {
        style: { backgroundColor: "#7c5cfc", borderColor: "#7c5cfc" }
      },
      onOk() {
        return new Promise((resolve) => {
          onSubmit(values, () => {
            form.resetFields()
            resolve(true)
          })
        }).catch(() => {})
      },
      centered: true,
      className: "declare-confirm-modal"
    })
  }

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        // Filter out empty resources
        if (values.resourcesList) {
          values.resourcesList = values.resourcesList.filter(
            (item: any) => item.name || item.resourcesUrl
          )
        }
        showConfirm(values)
      })
      .catch((info) => {
        console.log("Validate Failed:", info)
      })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={<span className="text-lg font-bold">技术申报</span>}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      maskClosable={false}
      className={styles.declareModal}
      closeIcon={<CloseOutlined style={{ fontSize: "16px", color: "#999" }} />}
    >
      <Form
        form={form}
        layout="vertical"
        name="declareForm"
        initialValues={{ resourcesList: [{ name: "", resourcesUrl: "" }] }}
        className="pt-2"
      >
        {/* 基础信息 */}
        <h1 className="mb-3 text-base font-bold text-gray-800">基础信息</h1>
        <Form.Item
          name="name"
          label="技术名称"
          rules={[{ required: true, message: "请输入技术名称" }]}
        >
          <Input placeholder="请输入" />
        </Form.Item>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="quadrantKey"
              label="技术类型"
              rules={[{ required: true, message: "请选择技术类型" }]}
            >
              <Select placeholder="请选择">
                {TechnologyTypeEnum.map((item) => (
                  <Option key={item.value} value={item.value}>
                    {item.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ringKey"
              label="技术定位"
              rules={[{ required: true, message: "请选择技术定位" }]}
            >
              <Select placeholder="请选择">
                {TechnologyPositionEnum.map((item) => (
                  <Option key={item.value} value={item.value}>
                    {item.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 技术详情 */}
        <h1 className="mb-3 mt-2 text-base font-bold text-gray-800">技术详情</h1>
        <Form.Item
          name="features"
          label="基本特点"
          rules={[{ required: true, message: "请输入基本特点" }]}
        >
          <TextArea placeholder="请输入" rows={3} />
        </Form.Item>

        <Form.Item
          name="appScenarios"
          label="主要应用场景"
          rules={[{ required: true, message: "请输入主要应用场景" }]}
        >
          <TextArea placeholder="请输入" rows={3} />
        </Form.Item>

        <Form.Item
          name="technicalScenarios"
          label="技术特性"
          rules={[{ required: true, message: "请输入技术特性" }]}
        >
          <TextArea placeholder="请输入" rows={3} />
        </Form.Item>
        <Form.Item
          name="introduction"
          label="技术简介"
          rules={[{ required: true, message: "请输入技术简介" }]}
        >
          <TextArea placeholder="请输入" rows={3} />
        </Form.Item>

        {/* 补充说明 */}
        <h1 className="mb-3 mt-2 text-base font-bold text-gray-800">补充说明</h1>
        <Form.Item name="suppleExplanation">
          <TextArea placeholder="请输入" rows={3} />
        </Form.Item>

        {/* 相关资源 */}
        <h1 className="mb-3 mt-2 text-base font-bold text-gray-800">相关资源</h1>
        <Form.List name="resourcesList">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={12} align="top" className="mb-3">
                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      style={{ marginBottom: 0 }}
                      dependencies={[["resourcesList", name, "resourcesUrl"]]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const url = getFieldValue(["resourcesList", name, "resourcesUrl"])
                            if (url && !value) {
                              return Promise.reject(new Error("请输入标题"))
                            }
                            return Promise.resolve()
                          }
                        })
                      ]}
                    >
                      <Input placeholder="请输入标题" />
                    </Form.Item>
                  </Col>
                  <Col span={15}>
                    <Form.Item
                      {...restField}
                      name={[name, "resourcesUrl"]}
                      style={{ marginBottom: 0 }}
                      dependencies={[["resourcesList", name, "name"]]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const itemName = getFieldValue(["resourcesList", name, "name"])
                            if (itemName && !value) {
                              return Promise.reject(new Error("请输入链接地址"))
                            }
                            return Promise.resolve()
                          }
                        })
                      ]}
                    >
                      <Input placeholder="请输入链接地址" />
                    </Form.Item>
                  </Col>
                  <Col span={3} className="flex items-start justify-between">
                    {fields.length > 1 && (
                      <Button icon={<MinusOutlined />} onClick={() => remove(name)} />
                    )}
                    <Button icon={<PlusOutlined />} onClick={() => add()} />
                  </Col>
                </Row>
              ))}
              {fields.length === 0 && (
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加资源
                </Button>
              )}
            </>
          )}
        </Form.List>

        {/* Footer Buttons */}
        <div className="mt-8 flex justify-end gap-3">
          <Button onClick={handleCancel}>取消</Button>
          <Button
            type="primary"
            onClick={handleOk}
            style={{ backgroundColor: "#7c5cfc", borderColor: "#7c5cfc" }}
          >
            提交
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default DeclareModal
