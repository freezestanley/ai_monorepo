import { useState } from "react"
import { Divider, Form, Input, Switch } from "antd"
import CustomDivider from "@/components/CustomDivider"
import { InfoIcon } from "@/components/FormIcon"
// 前置判断
export default function PreJudgment(props) {
  const { form } = props
  const [_, forceUpdate] = useState({})
  return (
    <>
      <CustomDivider>前置判断</CustomDivider>
      <Form.Item
        layout="horizontal"
        label="是否启用过滤"
        tooltip={{
          icon: <InfoIcon />,
          title: "启用后，通过判断条件将执行本节点"
        }}
        labelCol={{
          span: 5
        }}
      >
        <Form.Item noStyle name="enable" valuePropName="checked" initialValue={false}>
          <Switch
            size="small"
            onChange={() => {
              form.setFieldsValue({ rule: "" })
              forceUpdate({})
            }}
          />
        </Form.Item>
        {/* <span className="judge-tip">启用后，通过判断条件将执行本节点</span> */}
      </Form.Item>

      {form?.getFieldValue("enable") && (
        <Form.Item
          labelCol={{ span: 4 }}
          name="rule"
          label="条件判断"
          rules={[
            {
              required: true,
              message: "请输入groovy表达式"
            }
          ]}
        >
          <Input placeholder="请输入groovy表达式" />
        </Form.Item>
      )}
    </>
  )
}
