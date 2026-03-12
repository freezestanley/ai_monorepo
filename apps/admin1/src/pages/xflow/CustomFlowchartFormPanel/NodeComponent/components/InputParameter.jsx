import React from "react"
import { Select, Form, Collapse, Space, Col, Divider, Checkbox, Button, Input } from "antd"
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons"
import { ChoiceParams, commonParams } from "./FormItems"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import Iconfont from "@/components/Icon"
import { AddIcon } from "@/components/FormIcon"

const { Panel } = Collapse

const InputParameter = ({
  add,
  input,
  addInput,
  index,
  deleteInput,
  form,
  formControlOptions,
  length
}) => {
  const [_, forceUpdate] = React.useState({})
  const [isDisabled] = useFormDisabled()

  const formItemsByType = {
    input: commonParams,
    textarea: commonParams,
    number: commonParams,
    switch: commonParams,
    radio: ChoiceParams,
    boxes: ChoiceParams,
    multiSelect: ChoiceParams,
    select: ChoiceParams,
    upload: commonParams
  }

  const currentFormItem = formItemsByType[form.getFieldValue(`inputParams[${index}].controlType`)]

  return (
    <Space
      key={input.id}
      style={{
        marginBottom: 16
      }}
      align="start"
      wrap
    >
      {/* 添加的Icon */}
      {/* {add && !isDisabled && <PlusCircleOutlined onClick={() => addInput(input.id, index)} />} */}

      <Col span={24}>
        <>
          <Collapse
            className="w-full"
            defaultActiveKey={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
            collapsible="header"
            expandIcon={(panelProps) => {
              const isActive = panelProps.isActive
              return isActive ? <Iconfont type="icon-zhankai" /> : <Iconfont type="icon-shouqi" />
            }}
          >
            <Panel
              header={
                <span
                  style={{ fontWeight: 500, lineHeight: "20px", color: "#181B25" }}
                >{`输入参数${index + 1}`}</span>
              }
              key={`${index + 1}`}
              style={{ width: "539px" }}
              extra={
                !isDisabled && (
                  <Button
                    type="link"
                    style={{ color: "#000000" }}
                    onClick={() => deleteInput(input.id, index)}
                  >
                    删除
                  </Button>
                )
              }
            >
              <Space direction="horizontal" align="start">
                <Form.Item
                  name={[`inputParams`, index, "required"]}
                  valuePropName="checked"
                  style={{ width: "65px" }}
                >
                  <Checkbox
                    onChange={(e) => {
                      console.log(e)
                      form.setFieldsValue({
                        [`inputParams[${index}].required`]: e.target.checked
                      })
                      forceUpdate({})
                    }}
                  >
                    必填
                  </Checkbox>
                </Form.Item>
                <Form.Item
                  style={{ width: "147px" }}
                  name={[`inputParams`, index, "controlType"]}
                  rules={[
                    {
                      required: true,
                      message: "请选择输入类型"
                    }
                  ]}
                >
                  <Select
                    placeholder="选择输入类型"
                    onChange={(e) => {
                      form.setFieldsValue({ [`inputParams[${index}].controlType`]: e })
                      forceUpdate({})
                    }}
                  >
                    {formControlOptions.map((type) => (
                      <Select.Option key={type.code} value={type.code}>
                        {type.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name={[`inputParams`, index, "attributeName"]}
                  rules={[{ required: true, message: "请输入字段" }]}
                >
                  <Input placeholder="字段名" style={{ width: 139 }} />
                </Form.Item>
                <Form.Item
                  name={[`inputParams`, index, "title"]}
                  rules={[{ required: true, message: "请输入展示名称" }]}
                >
                  <Input placeholder="展示名称" style={{ width: 142 }} />
                </Form.Item>
              </Space>
              {currentFormItem && currentFormItem(form, `inputParams`, index, forceUpdate)}
            </Panel>
          </Collapse>
          {add && !isDisabled && index === length - 1 && (
            <AddIcon
              text="添加参数"
              style={{ marginTop: 16 }}
              onClick={() => addInput(input.id, index)}
            />
          )}
        </>
      </Col>
    </Space>
  )
}

export default InputParameter
