// @ts-ignore
import { useMemo, useState } from "react"
import { Popover, Button, Form, Radio, Space } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
// @ts-ignore
import { FrownFilled } from "@ant-design/icons"

const CustomPopconfirm = ({
  children,
  title,
  buttons,
  icon = <InfoCircleOutlined style={{ color: "rgba(246, 181, 30, 1)", marginRight: "8px" }} />,
  checkFn = () => Promise.resolve([]),
  width = 300
}) => {
  const [form] = Form.useForm()
  const [visible, setVisible] = useState(false)
  const [orders, setOrders] = useState([])

  const handleVisibleChange = async (newVisible) => {
    if (checkFn) {
      const checkResult = await checkFn()
      setVisible(newVisible && checkResult?.length > 0)
      setOrders(checkResult || [])
    } else {
      setVisible(newVisible)
    }
  }

  const popoverContent = (
    <div style={{ padding: "4px" }} className="max-h-[300px] overflow-y-auto !pb-[50px]">
      {title && (
        <p style={{ marginBottom: "16px" }}>
          {icon}
          <span
            style={{
              color: "rgba(24, 27, 37, 1)",
              fontSize: 14,
              lineHeight: "20px",
              fontWeight: 400
            }}
          >
            {title}
          </span>
        </p>
      )}
      <Form form={form}>
        <Form.Item name="orderNo" initialValue={orders[0]}>
          <Radio.Group>
            <Space direction="vertical">
              {orders.map((orderNo) => (
                <Radio key={orderNo} value={orderNo}>
                  {orderNo}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Form.Item>
      </Form>
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "flex-end"
        }}
        className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50"
      >
        {buttons.map((button, index) => (
          <Button
            key={index}
            size="small"
            type={button.type || "default"}
            onClick={() => {
              button.onClick(form.getFieldValue("orderNo"))
              setVisible(false)
            }}
            style={{ marginRight: index < buttons.length - 1 ? "8px" : "0" }}
          >
            {button.text}
          </Button>
        ))}
      </div>
    </div>
  )

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={visible}
      onOpenChange={handleVisibleChange}
      overlayStyle={{ maxWidth: `${width}px` }}
    >
      {children}
    </Popover>
  )
}

export default CustomPopconfirm
