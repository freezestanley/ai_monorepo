import React, { useState } from "react"
import { Form, Input, Select, Button, Space, Divider, Switch } from "antd"
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import CustomDivider from "@/components/CustomDivider"
import { AddIcon, DeleteIcon, InfoIcon } from "@/components/FormIcon"

const operatorOptions = [
  {
    label: "包含",
    value: "IN"
  },
  {
    label: "不包含",
    value: "NOT_IN"
  }
]

const DynamicFormList = ({ form, varOptions }) => {
  const [_, forceUpdate] = useState({})
  const postJudgEnable = form?.getFieldValue("postJudgEnable")
  return (
    <>
      <Form.Item
        labelCol={{
          span: 6
        }}
        layout="horizontal"
        label="是否启用后置过滤"
        name="postJudgEnable"
        valuePropName="checked"
        initialValue={false}
        tooltip={{
          icon: <InfoIcon />,
          title: "启用后，通过判断条件执行后置处理"
        }}
      >
        <Switch
          checked={postJudgEnable}
          size="small"
          onChange={(value) => {
            form?.setFieldsValue({ postJudgEnable: value, postJudgRule: "" })
            forceUpdate({})
          }}
        />
      </Form.Item>
      {postJudgEnable && (
        <Form.Item
          labelCol={{ span: 6 }}
          name="postJudgRule"
          label="后置条件判断"
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

      <CustomDivider showTopLine={true}>新增变量</CustomDivider>
      <Form.List name="sessions" initialValue={undefined}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name }) => (
              <Space key={key} style={{ display: "flex" }} align="baseline">
                <span>session.</span>
                <Form.Item
                  name={[name, "variableName"]}
                  className="mb-2"
                  rules={[{ required: true, message: "请输入变量名" }]}
                >
                  <Input placeholder="请输入变量名" />
                </Form.Item>
                <Form.Item
                  name={[name, "variable"]}
                  className="mb-2"
                  rules={[{ required: true, message: "请选择变量" }]}
                >
                  <Select placeholder="请选择变量" style={{ width: 112 }}>
                    {varOptions.map((type) => (
                      <Select.Option key={type.code} value={type.code}>
                        {type.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name={[name, "globalVariable"]} className="mb-2" style={{ width: 150 }}>
                  <GlobalVariableSelect
                    isTag={false}
                    formName={[name, "globalVariable"]}
                    multiple={false}
                  />
                </Form.Item>
                <DeleteIcon onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
              <AddIcon onClick={() => add()} text="添加" />
            </Form.Item>
          </>
        )}
      </Form.List>

      <CustomDivider showTopLine={true}>删除变量</CustomDivider>
      <Form.List name="delSessionKeySetUpList" initialValue={undefined}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name }) => (
              <Space key={key} style={{ display: "flex" }} align="baseline">
                <Form.Item
                  name={[name, "operator"]}
                  rules={[{ required: true, message: "请选择操作符" }]}
                >
                  <Select placeholder="操作符" style={{ width: 120 }}>
                    {operatorOptions.map((type) => (
                      <Select.Option key={type.value} value={type.value}>
                        {type.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name={[name, "filterConditionSessionKeys"]}
                  rules={[{ required: true, message: "请输入变量名" }]}
                  style={{ width: 390 }}
                >
                  <Input placeholder="请输入变量名，多个可以 “,” 分隔" />
                </Form.Item>
                <DeleteIcon onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
              <AddIcon onClick={() => add()} text="添加" />
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  )
}

export default DynamicFormList
