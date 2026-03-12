import { useEffect, useState } from "react"
import { Form, Input, Button } from "antd"

const CanvasService = ({ updateCanvas, targetData }) => {
  const [canvasData, setCanvasData] = useState(targetData)
  const [form] = Form.useForm()

  useEffect(() => {
    setCanvasData(targetData)
    form.setFieldsValue(targetData)
  }, [targetData, form])

  const onFinish = (values) => {
    console.log("Received values of form: ", values)
    updateCanvas({ ...targetData, ...values })
  }

  return "主画布"
  // <Form form={form} layout="vertical" onFinish={onFinish}>
  //   <Form.Item name="canvasLabel" label="Canvas Label">
  //     <Input placeholder="Enter Canvas Label" />
  //   </Form.Item>

  //   <Form.Item>
  //     <Button type="primary" htmlType="submit">
  //       Save
  //     </Button>
  //   </Form.Item>
  // </Form>
}

export default CanvasService
