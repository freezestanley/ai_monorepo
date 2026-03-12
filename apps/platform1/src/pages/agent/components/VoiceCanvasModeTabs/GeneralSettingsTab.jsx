import {
  Form,
  Input,
  Select,
  InputNumber,
  TimePicker,
  Radio,
  Switch,
  Row,
  Col,
  message
} from "antd"
import copy from "copy-to-clipboard"

const { Option } = Select

const GeneralSettingsTab = ({
  form,
  botNo,
  voiceTaskId,
  agentDetail,
  onFormChange,
  loading,
  showTaskName = true,
  hideFlowType = false
}) => {
  // 表单验证规则
  const rules = {
    required: [{ required: true, message: "此项为必填项" }],
    positiveInteger: [
      {
        pattern: /^[1-9]\d*$/,
        message: "请输入正整数"
      }
    ],
    nonNegativeInteger: [
      {
        pattern: /^(0|[1-9]\d*)$/,
        message: "请输入非负整数"
      }
    ]
  }

  return (
    <div className="p-0">
      <div className="my-5">
        {!hideFlowType && (
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="flowType" label="语音类型模式" rules={rules.required}>
                <Radio.Group>
                  <Radio value={1}>画布模式</Radio>
                  <Radio value={2}>剧本模式</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={24}>
          {/* {showTaskName && (
            <Col span={12}>
              <Form.Item name="taskName" label="语音模板名称" rules={rules.required}>
                <Input placeholder="请输入语音模板名称" allowClear />
              </Form.Item>
            </Col>
          )} */}

          <Col span={24} className="mb-3">
            IVR模板ID：
            <span>{voiceTaskId}</span>
            <i
              className="iconfont icon-fuzhi hover:text-[#7F56D9] text-gray-400 cursor-pointer ml-1 mt-1"
              onClick={() => {
                copy(voiceTaskId)
                message.success("复制成功")
              }}
            ></i>
          </Col>

          <Col span={24}>
            <Form.Item label="拨打时间控制">
              <Row gutter={8} align="middle">
                <Col flex="auto">
                  <Form.Item name="allowCallTimeStart" noStyle>
                    <TimePicker
                      format="HH:mm"
                      placeholder="开始时间"
                      className="w-full"
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col flex="24px" className="text-center">
                  →
                </Col>
                <Col flex="auto">
                  <Form.Item
                    name="allowCallTimeEnd"
                    noStyle
                    dependencies={["allowCallTimeStart"]}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const startTime = getFieldValue("allowCallTimeStart")
                          if (!value || !startTime) {
                            return Promise.resolve()
                          }
                          if (startTime.isAfter(value)) {
                            return Promise.reject(new Error("结束时间必须大于开始时间"))
                          }
                          return Promise.resolve()
                        }
                      })
                    ]}
                  >
                    <TimePicker
                      format="HH:mm"
                      placeholder="结束时间"
                      className="w-full"
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="redisExpireTime"
              label="录音缓存时间"
              tooltip="注意同XC系统补呼事件间隔保持一致"
              rules={[...rules.required, ...rules.positiveInteger]}
            >
              <InputNumber placeholder="请输入" className="w-full" addonAfter="秒" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="numberWebCall"
              label="手机防疲劳"
              tooltip="防疲劳显示，每天每个任务每个手机可拨打最大数量"
              rules={rules.positiveInteger}
            >
              <InputNumber
                placeholder="请输入拨打最大数量"
                className="w-full"
                addonAfter="通"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="robotStrategy"
              label="连续说话处理方式"
              tooltip="当 AI 回复的时候用户正好说话，是否合并上一轮问题一起处理"
              rules={rules.required}
              initialValue="merge"
            >
              <Select placeholder="请选择处理方式" allowClear>
                <Option value="merge">合并用户问题</Option>
                <Option value="default">默认</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24} className="mt-3">
          <Col span={12}>
            <Form.Item
              name="crossCallScriptTag"
              label="跨通话轮询话术"
              tooltip="话术是否跨通话轮询，增加重复触达用户话术体验，节点递进话术多，重复触发大的情况再推荐开启"
              valuePropName="checked"
              initialValue={0}
              layout="horizontal"
              getValueFromEvent={(checked) => (checked ? "1" : "0")}
              getValueProps={(value) => ({ checked: value === "1" })}
            >
              <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <div className="flex items-center">
              <Form.Item
                label="开启拨打限流"
                name="taskProcessRateFlag"
                layout="horizontal"
                valuePropName="checked"
                tooltip="用于控制权录音或者全 tts 任务拨打速率"
                className="mb-0"
                required
              >
                <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
              </Form.Item>
            </div>
          </Col>
        </Row>

        <Form.Item noStyle dependencies={["taskProcessRateFlag"]}>
          {({ getFieldValue }) =>
            getFieldValue("taskProcessRateFlag") ? (
              <Row gutter={24}>
                <Col span={12} className="mt-3">
                  <Form.Item
                    label="拨打间隔时长"
                    name="taskProcessRateSleepTime"
                    rules={[...rules.required, ...rules.nonNegativeInteger]}
                    tooltip="当启用拨打速率控制时，拨打睡眠时长"
                  >
                    <InputNumber
                      placeholder="请输入间隔时长"
                      className="w-full"
                      addonAfter="毫秒"
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
            ) : null
          }
        </Form.Item>
      </div>
    </div>
  )
}

export default GeneralSettingsTab
