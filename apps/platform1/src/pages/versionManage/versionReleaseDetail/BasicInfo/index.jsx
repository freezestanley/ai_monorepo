import { useEffect } from "react"
import { Form, Row, Col, Input } from "antd"
import HeaderTitle from "../HeaderTitle"

const BasicInfo = ({ data }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue(data)
  }, [data, form])

  return (
    <>
      <HeaderTitle title="发布单基本信息" />
      <Form form={form} disabled layout="vertical" className="pt-[16px] pl-[20px] pr-[20px]">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="发布单名称" name="publishOrderName" rules={[{ required: true }]}>
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item label="备注" name="description">
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="发布单编号" name="publishOrderId" rules={[{ required: true }]}>
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="发布单创建时间" name="gmtCreated" rules={[{ required: true }]}>
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="发布单创建人" name="creator" rules={[{ required: true }]}>
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </>
  )
}

export default BasicInfo
