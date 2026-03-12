import React from "react"
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Breadcrumb,
  Switch,
  InputNumber,
  Spin
} from "antd"
import { SaveOutlined, SendOutlined } from "@ant-design/icons"
import ImageUpload from "../ImageUpload"
import TextEditor from "../TextEditor"
import { useInfoEdit } from "./useInfoEdit"
import "./styles.scss"

const { TextArea } = Input
const { Option } = Select

const InfoEdit = () => {
  const {
    loading,
    submitLoading,
    typeList,
    mode,
    form,
    initialData,
    handleBack,
    handleSaveDraft,
    handlePublish,
    handleImageChange,
    handleImageSuccess
  } = useInfoEdit()

  if (loading) {
    return (
      <div className="info-edit-page">
        <Card>
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
          </div>
        </Card>
      </div>
    )
  }

  const changehandler = (value) => {
    console.log(value)
  }
  return (
    <div className="info-edit-page">
      <Card>
        <div className="page-header">
          <Breadcrumb className="vhcenter">
            <Breadcrumb.Item>{mode === "edit" ? "编辑消息" : "新增消息"}</Breadcrumb.Item>
            <Breadcrumb.Item>
              <Button
                type="link"
                // icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ padding: 0 }}
              >
                返回列表
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb>

          <Space>
            {/* <Button icon={<SaveOutlined />} onClick={handleSaveDraft} loading={submitLoading}>
              保存草稿
            </Button> */}
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handlePublish}
              loading={submitLoading}
            >
              保存消息
            </Button>
          </Space>
        </div>

        <div className="form-wrapper">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              status: 1,
              sort: 0
            }}
          >
            <Row gutter={24}>
              <Col span={16}>
                {/* 基础信息 */}
                <Card title="基础信息" className="form-section">
                  <Form.Item
                    name="title"
                    label="消息标题"
                    rules={[
                      { required: true, message: "请输入消息标题" },
                      { max: 100, message: "标题不能超过100个字符" }
                    ]}
                  >
                    <Input placeholder="请输入消息标题" showCount maxLength={100} />
                  </Form.Item>

                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item
                        name="categoryNo"
                        label="消息类别"
                        rules={[{ required: true, message: "请选择消息类别" }]}
                      >
                        <Select placeholder="请选择消息类别">
                          {typeList.map((type) => (
                            <Option key={type.id} value={type.categoryNo}>
                              {type.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    {/* <Col span={12}>
                      <Form.Item
                        name="newsSort"
                        label="排序"
                        rules={[
                          { required: true, message: '请输入排序值' },
                          { 
                            type: 'number', 
                            min: 0, 
                            max: 9999, 
                            message: '排序值应在0-9999之间' 
                          }
                        ]}
                        extra="数字越小排序越靠前，范围为0-9999"
                        initialValue={9999}
                      >
                        <InputNumber
                          placeholder="请输入0-9999之间的数字"
                          min={0}
                          max={9999}
                          style={{ width: '100%' }}
                          precision={0}
                        />
                      </Form.Item>
                    </Col> */}
                  </Row>

                  <Form.Item
                    name="summary"
                    label="消息摘要"
                    rules={[{ max: 300, message: "摘要不能超过300个字符" }]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="请输入消息摘要，用于列表展示"
                      showCount
                      maxLength={300}
                    />
                  </Form.Item>
                </Card>

                {/* 正文内容 */}
                <Card title="正文内容" className="form-section">
                  <Form.Item
                    name="content"
                    rules={[{ required: true, message: "请输入正文内容" }]}
                  >
                    <TextEditor
                      placeholder="请输入正文内容..."
                      onChange={changehandler}
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col span={8}>
                {/* 发布设置 */}
                {/* <Card title="发布设置" className="form-section">
                  <Form.Item name="status" label="发布状态" valuePropName="checked">
                    <Switch checkedChildren="发布" unCheckedChildren="草稿" />
                  </Form.Item>
                </Card> */}

                {/* 封面图片 */}
                <Card title="封面图片" className="form-section">
                  <Form.Item
                    name="coverImage"
                    extra="建议尺寸：800x450，支持 JPG、PNG 格式，大小不超过 5MB"
                  >
                    <ImageUpload
                      maxCount={1}
                      listType="picture-card"
                      onChange={handleImageChange}
                      onFinish={handleImageSuccess}
                    />
                  </Form.Item>
                </Card>

                {/* 操作按钮 */}
                <Card className="form-section">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handlePublish}
                      loading={submitLoading}
                      block
                    >
                      保存消息
                    </Button>
                    {/* <Button
                      icon={<SaveOutlined />}
                      onClick={handleSaveDraft}
                      loading={submitLoading}
                      block
                    >
                      保存草稿
                    </Button> */}
                  </Space>
                </Card>
              </Col>
            </Row>
          </Form>
        </div>
      </Card>
    </div>
  )
}

export default InfoEdit
