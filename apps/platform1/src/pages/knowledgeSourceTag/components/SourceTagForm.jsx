import { PlusOutlined } from "@ant-design/icons"
import { Button, Col, Form, Input, Popconfirm, Row, Select } from "antd"

function SourceTagForm({ form, onFinish, channel, severSourceTagListLen, FooterButtons }) {
  const validateUniqueness = (rule, value, callback, fieldIndex, fieldName) => {
    const sourceTagList = form.getFieldValue("sourceTagList")
    const duplicateIndices = sourceTagList
      .map((item, index) => (item && item[fieldName] === value ? index : -1))
      .filter((index) => index !== -1)

    if (duplicateIndices.length > 1 && fieldIndex === Math.max(...duplicateIndices)) {
      callback(`${fieldName === "tagDesc" ? "标签名" : "标签code"}不能重复`)
    } else {
      callback()
    }
  }
  return (
    <div>
      <Form
        onFinish={onFinish}
        autoComplete="off"
        form={form}
        labelCol={{ style: { width: "60px" } }}
      >
        <Form.List name="sourceTagList">
          {(fields, { add, remove }) => (
            <div className="pb-5 mb-[100px]">
              {fields.map(({ key, name, ...restField }, index) => (
                <>
                  <Row gutter={[16, 16]} key={key} style={{ alignItems: "flex-end" }}>
                    <Col span={7}>
                      <Form.Item
                        name={[name, "channel"]}
                        label={index === 0 ? "默认" : `标签${index}`}
                        rules={[{ required: true }]}
                        initialValue={channel?.[0]?.channel}
                      >
                        <Select placeholder="请选择渠道" disabled={index < severSourceTagListLen}>
                          {channel?.map((opt) => (
                            <Select.Option key={opt.channel} value={opt.channel}>
                              {opt.channelDesc}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        {...restField}
                        name={[name, "code"]}
                        rules={[
                          {
                            required: true,
                            message: "请输入标签code"
                          },
                          {
                            validator: (rule, value, callback) =>
                              validateUniqueness(rule, value, callback, index, "code")
                          }
                        ]}
                      >
                        <Input
                          placeholder="请输入标签code"
                          disabled={index < severSourceTagListLen}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        {...restField}
                        name={[name, "tagDesc"]}
                        rules={[
                          {
                            required: true,
                            message: "请输入标签名称"
                          },
                          {
                            validator: (rule, value, callback) =>
                              validateUniqueness(rule, value, callback, index, "tagDesc")
                          }
                        ]}
                      >
                        <Input placeholder="请输入标签名称" disabled={index === 0} />
                      </Form.Item>
                    </Col>
                    <Col span={2} style={{ paddingTop: "6px", height: "52px", marginLeft: "-5px" }}>
                      {index === 0 || index < severSourceTagListLen ? null : (
                        <Popconfirm title="确认删除该场景标签?" onConfirm={() => remove(name)}>
                          <i className="iconfont icon-tuodong-shanchu text-[#181B25] cursor-pointer hover:text-[#7F56D9]"></i>
                        </Popconfirm>
                      )}
                    </Col>
                  </Row>
                  {index === fields.length - 1 && (
                    <Row gutter={[16, 16]} className="with-full">
                      <Col span={12}>
                        <Button
                          type="link"
                          onClick={() => add({ code: "", tagDesc: "" }, index + 1)}
                          style={{
                            marginLeft: "45px",
                            marginTop: "-15px"
                          }}
                          icon={<PlusOutlined />}
                        >
                          创建场景标签
                        </Button>
                      </Col>
                    </Row>
                  )}
                </>
              ))}
            </div>
          )}
        </Form.List>
        <FooterButtons />
      </Form>
    </div>
  )
}

export default SourceTagForm
