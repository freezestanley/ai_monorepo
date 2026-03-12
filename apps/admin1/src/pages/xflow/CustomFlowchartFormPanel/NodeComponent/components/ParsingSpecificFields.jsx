// ParsingSpecificFields.js
import { Form, Input, Button, Space, Select } from "antd"
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import { v4 as uuidv4 } from "uuid"
import { TemplateToolTip } from "@/constants/tips"
import VariableTextArea from "./VariableTextArea"
import { AddIcon, DeleteIcon } from "@/components/FormIcon"

export default function ParsingSpecificFields({ parsingMethod, globalData, disabled, form }) {
  const { Option } = Select

  if (!parsingMethod) return null

  switch (parsingMethod) {
    case "MARKDOWN":
      return (
        <Form.Item
          labelCol={{
            span: 24
          }}
          style={{
            padding: 0
          }}
          name="template"
          label="模板"
          rules={[{ required: true, message: "请输入模板内容!" }]}
          tooltip={{
            title: TemplateToolTip,
            overlayStyle: { maxWidth: 600 }
          }}
        >
          <VariableTextArea variables={globalData} disabled={disabled} />
        </Form.Item>
      )

    case "PLAIN_TEXT":
      return (
        <GlobalVariableSelect
          layout="vertical"
          span={3}
          formName={"outputParams"}
          multiple={false}
          label={"输出"}
          disabled={disabled}
        />
      )

    case "JSON":
    case "JSON_ARRAY":
      // eslint-disable-next-line no-case-declarations
      const isJson = parsingMethod === "JSON" || parsingMethod === "JSON_ARRAY"
      return (
        <Form.List name={"outputParams"} initialValue={[{}]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={uuidv4()} style={{ display: "flex" }} align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, "variableName"]}
                    style={{ width: 150 }}
                    rules={[{ required: true, message: "请输入字段名!" }]}
                    key={uuidv4()}
                  >
                    <Input placeholder="字段名" disabled={disabled} />
                  </Form.Item>

                  <GlobalVariableSelect
                    isTag={true}
                    className={"end-global-select"}
                    span={9}
                    formName={[field.name, "inputParams"]}
                    multiple={false}
                    label={null}
                    style={{ width: 180 }}
                    disabled={disabled}
                  />
                  <Form.Item
                    {...field}
                    name={[field.name, "description"]}
                    key={uuidv4()}
                    rules={[{ required: true, message: "请输入字段描述!" }]}
                    style={{ width: 186 }}
                  >
                    <Input placeholder="字段描述" />
                  </Form.Item>
                  {isJson && !disabled && <DeleteIcon onClick={() => remove(field.name)} />}
                </Space>
              ))}
              {isJson && !disabled && (
                <AddIcon style={{ marginTop: 0 }} text="添加字段" onClick={() => add()} />
              )}
            </>
          )}
        </Form.List>
      )
    default:
      return null
  }
}
