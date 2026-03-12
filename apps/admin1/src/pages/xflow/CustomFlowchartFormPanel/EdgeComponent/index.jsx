/*
 * @Author: dyton
 * @Date: 2023-10-16 14:52:58
 * @Descripttion: 文件描述
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-17 16:45:54
 * @FilePath: /za-aigc-platform-admin-static/src/pages/xflow/CustomFlowchartFormPanel/EdgeComponent/index.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import { useEffect, useState } from "react"
import { Form, Input, Button, Select } from "antd"
import "./index.scss"
import { CommonContent } from "../CommonContent"

const { Option } = Select

const EdgeComponent = ({ updateEdge, targetData }) => {
  const [edgeData, setEdgeData] = useState(targetData)
  const [form] = Form.useForm()

  useEffect(() => {
    setEdgeData(targetData)
    form.setFieldsValue(targetData) // assuming targetData fields match with form fields
  }, [targetData, form])

  const onFinish = (values) => {
    console.log("Received values of form: ", values)
    console.log(targetData)
    form.validateFields().then((values) => {
      updateEdge({
        ...targetData,
        ...values,
        attrs: {
          line: {
            ...targetData.attrs.line,
            strokeWidth: 2,
            strokeDasharray: [0, 0]
          }
        }
      })
    })
  }

  return (
    <div className="edge-node h-full">
      <Form form={form} onFinish={onFinish} layout="vertical" className="h-full">
        <CommonContent title={"连接设置"} showDebuggerButton={false} onFinish={onFinish}>
          <Form.Item name="label" label="描述" rules={[{ required: true, message: "请输入描述" }]}>
            <Input placeholder="请输入描述" />
          </Form.Item>
        </CommonContent>
      </Form>
    </div>
  )
}

export default EdgeComponent
