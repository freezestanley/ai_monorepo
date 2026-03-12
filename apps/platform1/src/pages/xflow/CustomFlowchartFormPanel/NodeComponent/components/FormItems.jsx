import { Input, Form, Checkbox, Space, Col, Row } from "antd"
import { v4 as uuidv4 } from "uuid"
import { AddIcon, DeleteIcon } from "@/components/FormIcon"

export const commonParams = (form, name, index, forceUpdate) => (
  <Row>
    <Col span={24} className="flex items-center">
      <Space className="flex">
        <Form.Item name={[name, index, "fieldTip"]} valuePropName="checked" style={{ width: 105 }}>
          <Checkbox onChange={() => forceUpdate({})}>字段提示</Checkbox>
        </Form.Item>
        {form.getFieldValue([name, index, "fieldTip"]) && (
          <Form.Item name={[name, index, "tip"]} className="flex-1">
            <Input placeholder="请输入字段提示内容" style={{ width: 399 }} />
          </Form.Item>
        )}
      </Space>
    </Col>
    <Col span={24} className="flex items-center" style={{ marginTop: "-10px" }}>
      <Space>
        <Form.Item
          name={[name, index, "placeholderTip"]}
          valuePropName="checked"
          style={{ width: 105 }}
        >
          <Checkbox onChange={() => forceUpdate({})}>输入框提示</Checkbox>
        </Form.Item>
        {form.getFieldValue([name, index, "placeholderTip"]) && (
          <Form.Item name={[name, index, "placeholder"]}>
            <Input placeholder="请输入输入提示内容" style={{ width: 399 }} />
          </Form.Item>
        )}
      </Space>
    </Col>
  </Row>
)

export const ChoiceParams = (form, name, index, forceUpdate) => (
  <>
    {commonParams(form, name, index, forceUpdate)}
    <Form.List name={[name, index, "options"]} initialValue={[{ label: "", value: "" }]}>
      {(fields, { add, remove }) => (
        <>
          {fields.map((field, innerIndex) => (
            <Space
              key={field.key}
              style={{
                display: "flex",
                width: "100%"
              }}
              align="baseline"
            >
              <Form.Item
                {...field}
                name={[field.name, "label"]}
                rules={[{ required: true, message: "请输入选项标签" }]}
                key={`${field.key}-label`}
                style={{ minWidth: 240 }}
              >
                <Input placeholder="选项标签" />
              </Form.Item>
              <Form.Item
                {...field}
                name={[field.name, "value"]}
                rules={[{ required: true, message: "请输入选项值" }]}
                key={`${field.key}-value`}
                style={{ minWidth: 240, flex: 1 }}
              >
                <Input placeholder="选项值" />
              </Form.Item>
              {innerIndex !== 0 && <DeleteIcon onClick={() => remove(field.name)} />}
            </Space>
          ))}
          <AddIcon text="添加选项" onClick={() => add()} />
        </>
      )}
    </Form.List>
  </>
)
