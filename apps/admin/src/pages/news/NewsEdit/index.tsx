import { Card, Form, Input, Select, Button, Row, Col, Spin, Breadcrumb } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { ImageUpload, TextEditor } from '@packages/ui'
import { useNewsEdit } from './hooks/useNewsEdit'
import './styles.scss'

const { TextArea } = Input

const NewsEdit = () => {
  const {
    loading,
    submitLoading,
    typeList,
    mode,
    form,
    handleBack,
    handleSaveDraft,
    handleImageChange,
    handleImageSuccess,
  } = useNewsEdit()

  if (loading) {
    return (
      <Card>
        <Spin size="large" tip="加载中...">
          <div style={{ minHeight: 400 }} />
        </Spin>
      </Card>
    )
  }

  return (
    <div className="news-edit-page">
      <Card>
        {/* Page Header */}
        <div className="page-header">
          <Breadcrumb
            items={[
              { title: mode === 'edit' ? '编辑消息' : '新增消息' },
              {
                title: (
                  <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack}
                    style={{ padding: 0 }}
                  >
                    返回列表
                  </Button>
                ),
              },
            ]}
          />
          <Button type="primary" loading={submitLoading} onClick={handleSaveDraft}>
            保存消息
          </Button>
        </div>

        {/* Form */}
        <div className="form-wrapper">
          <Form form={form} layout="vertical">
            <Row gutter={24}>
              {/* Left Column */}
              <Col span={16}>
                <Card title="基础信息" className="form-section">
                  <Form.Item
                    label="标题"
                    name="title"
                    rules={[
                      { required: true, message: '请输入标题' },
                      { max: 100, message: '标题不能超过100个字符' },
                    ]}
                  >
                    <Input placeholder="请输入消息标题" maxLength={100} />
                  </Form.Item>

                  <Form.Item label="分类" name="categoryNo">
                    <Select placeholder="请选择分类" allowClear>
                      {typeList.map((item) => (
                        <Select.Option key={item.categoryNo} value={item.categoryNo}>
                          {item.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="摘要"
                    name="summary"
                    rules={[{ max: 300, message: '摘要不能超过300个字符' }]}
                  >
                    <TextArea placeholder="请输入消息摘要" rows={4} maxLength={300} showCount />
                  </Form.Item>
                </Card>

                <Card title="正文内容" className="form-section">
                  <Form.Item name="content">
                    <TextEditor placeholder="请输入正文内容..." />
                  </Form.Item>
                </Card>
              </Col>

              {/* Right Column */}
              <Col span={8}>
                <Card title="封面图片" className="form-section">
                  <Form.Item name="coverImage">
                    <ImageUpload
                      maxCount={1}
                      listType="picture-card"
                      onChange={handleImageChange}
                      onFinish={handleImageSuccess}
                    />
                  </Form.Item>
                </Card>

                <Card className="form-section">
                  <Button
                    type="primary"
                    block
                    loading={submitLoading}
                    onClick={handleSaveDraft}
                  >
                    保存消息
                  </Button>
                </Card>
              </Col>
            </Row>
          </Form>
        </div>
      </Card>
    </div>
  )
}

export default NewsEdit
