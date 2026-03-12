import { Form, Switch, Input, Button } from "antd"
import { postMessageForLX } from "@/utils"
import { MessageType } from "@/constants/postMessageType"

const DataFlywheelTab = ({ form, disabled, isEditing, onFormChange, loading, botNo, taskId }) => {
  // 监听启用数据飞轮的变化（使用 flywheelInfo 统一包裹）
  const flywheelInfo = Form.useWatch("flywheelInfo", form)
  const isEnabled = flywheelInfo?.status === 1

  // 编辑状态下，禁用场景名称和描述
  const fieldDisabled = disabled || isEditing

  return (
    <div className="mt-3">
      <Form.Item
        label="启用数据飞轮"
        name={["flywheelInfo", "status"]}
        valuePropName="checked"
        getValueFromEvent={(checked) => (checked ? 1 : 2)}
        getValueProps={(value) => ({ checked: value === 1 })}
        initialValue={2}
        layout="horizontal"
        tooltip="开启后，将启用数据飞轮场景分析当前Agent会话优化机会"
      >
        <Switch disabled={disabled} />
      </Form.Item>

      {isEnabled && (
        <>
          <Form.Item
            label="数据飞轮场景名称"
            name={["flywheelInfo", "flywheelTaskName"]}
            rules={[
              {
                required: true,
                message: "请输入数据飞轮场景名称"
              }
            ]}
          >
            <Input placeholder="请输入数据飞轮场景名称" disabled={fieldDisabled} maxLength={100} />
          </Form.Item>

          <Form.Item label="数据飞轮场景描述" name={["flywheelInfo", "businessBackground"]}>
            <Input.TextArea
              placeholder="请输入数据飞轮场景描述"
              disabled={fieldDisabled}
              rows={4}
              showCount
            />
          </Form.Item>
        </>
      )}

      <div>
        <Button
          onClick={() => {
            console.log("111")
            postMessageForLX({
              type: MessageType.NAVIGATE_TO_FLYWHEEL_OPTIMIZATION,
              payload: {
                taskId: taskId
              }
            })
          }}
        >
          查看数据飞轮详情
        </Button>
      </div>
    </div>
  )
}

export default DataFlywheelTab
