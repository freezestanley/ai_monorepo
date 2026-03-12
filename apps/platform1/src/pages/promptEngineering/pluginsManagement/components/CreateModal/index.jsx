import { useState } from "react"
import { ArrowRightOutlined } from "@ant-design/icons"
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
  Tabs,
  Radio,
  Space,
  message,
  Switch,
  Pagination
} from "antd"
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from "@ant-design/icons"
import Iconfont from "@/components/Icon"
import { marketOptions, marketCode } from "@/constants/market"
import { usePlginsManage } from "../.."
import styles from "./index.module.scss"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import queryString from "query-string"
import { useLocation, useNavigate } from "react-router-dom"
import { usePluginCreate } from "@/api/pluginManage"

const formItemLayout = {
  labelCol: {
    xs: {
      span: 24
    },
    sm: {
      span: 4
    }
  },
  wrapperCol: {
    xs: {
      span: 24
    },
    sm: {
      span: 20
    }
  }
}

export const CreateModal = (props) => {
  const { initialValues } = props || {}
  const [createForm] = Form.useForm()
  const navigate = useNavigate()
  // 更新列表
  const queryClient = useQueryClient()
  const updateHome = (res) => {
    queryClient.invalidateQueries([QUERY_KEYS.PLUGIN_LIST])
    setVisibleCreate(false)
    handleGoTool(res.data)
  }

  // 修改
  const { mutate: mutateCreat } = usePluginCreate(updateHome)

  const { botNo, visible, visibleCreate, setVisibleCreate, setIsEditing } = usePlginsManage()
  const handleOk = () => {
    createForm
      .validateFields()
      .then((values) => {
        console.log("Received values of form:", values)
        const params = {
          ...values,
          botNo
        }
        mutateCreat(params)
      })
      .catch((info) => {
        console.log("Failed:", info)
      })
    // setVisibleCreate(false);
  }
  const handleCancel = () => {
    setVisibleCreate(false)
  }
  // 跳转至工具
  const handleGoTool = (record) => {
    const { botNo, id, pluginNo, toolNo } = record || {}
    const urls = queryString.stringifyUrl({
      url: "/plugin/tools",
      query: {
        pluginNo,
        step: 1,
        toolNo
      }
    })
    navigate(urls)
  }

  return (
    <div>
      <Modal
        title={"新增工具"}
        open={visibleCreate}
        width={800}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Row className={styles["creat-icon-box"]}>
          <Iconfont type={"icon-yingyong"} className={styles["creat-icon"]} />
        </Row>
        <Form
          // {...formItemLayout}
          layout={"vertical"}
          form={createForm}
          initialValues={initialValues}
          // onValuesChange={onFormLayoutChange}
        >
          <Form.Item name="name" label="工具名称" rules={[{ required: true, message: "请输入" }]}>
            <Input maxLength={30} placeholder="请输入工具名称，确保名称含义清晰且符合平台规范" />
          </Form.Item>
          <Form.Item
            name="description"
            label="工具描述"
            rules={[{ required: true, message: "请输入" }]}
          >
            <Input.TextArea
              maxLength={600}
              placeholder="请输入工具的主要功能和使用场景，确保内容符合平台规范，帮助用户/大模型更好地理解"
            />
          </Form.Item>
          <Form.Item
            name="url"
            label="工具URL"
            rules={[{ required: true, message: "请输入正确URL格式", type: "url" }]}
          >
            <Input placeholder="请输入工具的访问地址或相关资源的链接" />
          </Form.Item>
          <Form.Item
            label="Header列表"
            tooltip={{ title: "Header参数", icon: <InfoCircleOutlined /> }}
            rules={[{ required: true, message: "请输入", type: "url" }]}
            className={styles["header-list-box"]}
          >
            <Form.List name="headerInfoList">
              {(fields, { add, remove }) => (
                <div className={styles["header-list-table"]}>
                  <PlusOutlined className={styles["header-list-add"]} onClick={() => add()} />
                  <div>
                    <Row className={styles["header-list-title"]} gutter={16}>
                      <Col span={10} className={styles["header-list-title-item"]}>
                        Key
                      </Col>
                      <Col span={10} className={styles["header-list-title-item"]}>
                        Value
                      </Col>
                      <Col span={4}>操作</Col>
                    </Row>
                    <Row className={styles["header-list-content"]}>
                      {fields.map(({ key, name, ...restField }) => (
                        <Row style={{ width: "100%" }} gutter={16}>
                          <Col span={10}>
                            <Form.Item
                              {...restField}
                              name={[name, "key"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Missing first name"
                                }
                              ]}
                            >
                              <Input placeholder="请输入" />
                            </Form.Item>
                          </Col>
                          <Col span={10}>
                            <Form.Item
                              {...restField}
                              name={[name, "value"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Missing last name"
                                }
                              ]}
                            >
                              <Input placeholder="请输入" />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <DeleteOutlined onClick={() => remove(name)} />
                          </Col>
                        </Row>
                      ))}
                    </Row>
                  </div>
                </div>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
