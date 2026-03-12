import { PlusOutlined } from "@ant-design/icons"
import { Button, Col, Form, Input, Popconfirm, Row } from "antd"

function SceneTagForm({ form, onFinish, FooterButtons, severSceneTagListLen }) {
  const validateUniqueness = (rule, value, callback, fieldIndex) => {
    const sceneTagList = form.getFieldValue("sceneTagList")
    const duplicateIndices = sceneTagList
      .map((item, index) => (item && item.tagDesc === value ? index : -1))
      .filter((index) => index !== -1)

    if (duplicateIndices.length > 1 && fieldIndex === Math.max(...duplicateIndices)) {
      callback("场景标签名称不能重复")
    } else {
      callback()
    }
  }

  return (
    <Form
      onFinish={onFinish}
      autoComplete="off"
      form={form}
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 18 }}
    >
      <Form.List name="sceneTagList">
        {(fields, { add, remove }) => (
          <div className="pb-5 mb-[100px]">
            {fields.map(({ key, name, ...restField }, index) => (
              <>
                <Row gutter={[16, 16]} key={key} className="with-full">
                  <Col>
                    <Form.Item
                      {...restField}
                      name={[name, "tagDesc"]}
                      label={<div style={{ width: 220 }}>场景标签{index + 1}</div>}
                      rules={[
                        {
                          required: true,
                          message: "请输入场景标签名称"
                        },
                        {
                          validator: (rule, value, callback) =>
                            validateUniqueness(rule, value, callback, index)
                        }
                      ]}
                    >
                      <Input
                        disabled={
                          index < severSceneTagListLen &&
                          form.getFieldValue("sceneTagList")[index].tagDesc !== ""
                        }
                        className="width-full"
                        placeholder="请输入场景标签名称"
                      />
                    </Form.Item>
                  </Col>
                  <Col style={{ paddingTop: "6px", marginLeft: "-20px" }}>
                    {index > severSceneTagListLen - 1 && fields.length > 1 && (
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
                        onClick={() => add({ tagDesc: "", code: "" })}
                        style={{
                          marginLeft: "80px",
                          paddingLeft: 5,
                          marginTop: "-15px"
                        }}
                        icon={<PlusOutlined />}
                      >
                        创建分组
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
  )
}

export default SceneTagForm
