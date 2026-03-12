import { useState, useEffect, useCallback, useRef } from "react"
import { Form, Select, Input, InputNumber, Button, Row, Col, Switch } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"

const { Option } = Select

const ChannelConfigTab = ({ form, botNo, agentDetail, onFormChange, loading }) => {
  // 分流比例错误提示
  const [rateError, setRateError] = useState("")
  const [ccConfigError, setCcConfigError] = useState(false)
  const channelConfigRef = useRef(null)

  // 表单验证规则
  const rules = {
    required: [{ required: true, message: "此项为必填项" }]
  }

  // 检查并设置ccConfigs默认值
  useEffect(() => {
    const checkAndSetCcConfigs = () => {
      const formValues = form.getFieldsValue()
      const ccConfigs = formValues.ccConfigs

      // 如果ccConfigs为null、undefined或空数组，设置默认值
      if (!ccConfigs || ccConfigs.length === 0) {
        form.setFieldValue("ccConfigs", [
          {
            ccPlatform: undefined,
            bizField: undefined,
            bizTypes: undefined,
            rate: 100,
            extraInfo: undefined,
            isSkipWebcall: 0
          }
        ])
      }
    }

    // 延迟执行，确保表单已经初始化完成
    const timer = setTimeout(checkAndSetCcConfigs, 100)
    return () => clearTimeout(timer)
  }, [form])

  // 分流比例自动分配和校验逻辑
  // 自动分配分流比例
  const autoDistributeRates = useCallback(() => {
    const ccConfigs = form.getFieldValue("ccConfigs") || []
    const count = ccConfigs.length
    if (count === 0) return
    const base = Math.floor(100 / count)
    const rates = Array(count).fill(base)
    rates[count - 1] = 100 - base * (count - 1)
    const newConfigs = ccConfigs.map((item, idx) => ({ ...item, rate: rates[idx] }))
    form.setFieldsValue({ ccConfigs: newConfigs })
  }, [form])

  // 监听通道数量变化，自动分配分流比例
  useEffect(() => {
    const unsubscribe = form.subscribe?.(() => {
      const ccConfigs = form.getFieldValue("ccConfigs") || []
      if (ccConfigs.length > 1) {
        // 新增/删除时自动分配
        autoDistributeRates()
      }
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [form, autoDistributeRates])

  // 分流比例变动时校验总和
  const handleRateChange = (value, fieldIdx) => {
    const ccConfigs = form.getFieldValue("ccConfigs") || []
    ccConfigs[fieldIdx].rate = value
    const total = ccConfigs.reduce((sum, item) => sum + (Number(item.rate) || 0), 0)
    if (total > 100) {
      setRateError("通道分流比例之和不能超过100%")
    } else {
      setRateError("")
    }
    form.setFieldsValue({ ccConfigs })
  }

  // 删除通道时自动分配分流比例
  const handleRemoveChannel = (fieldName) => {
    const ccConfigs = form.getFieldValue("ccConfigs") || []
    // 先移除指定通道
    const newConfigs = ccConfigs.filter((_, idx) => idx !== fieldName)
    // 重新分配分流比例
    const count = newConfigs.length
    if (count > 0) {
      const base = Math.floor(100 / count)
      const rates = Array(count).fill(base)
      rates[count - 1] = 100 - base * (count - 1)
      for (let i = 0; i < count; i++) {
        newConfigs[i].rate = rates[i]
      }
    }
    form.setFieldsValue({ ccConfigs: newConfigs })
  }

  // 通道设置区域鼠标离开时自动保存
  const handleChannelMouseLeave = async () => {
    try {
      // 校验表单，ccConfigs必填
      await form.validateFields(["ccConfigs"])
      // 如果有 onSave 或 onSubmit 回调，调用保存
      if (typeof onFormChange === "function") {
        const values = form.getFieldsValue()
        onFormChange(values)
      }
    } catch (err) {
      // 校验不通过时表单会自动红字提示
      return
    }
  }

  return (
    <div className="p-0">
      <div className="my-5">
        <div className="text-[14px] text-[#475467] font-[400] flex items-center">
          {ccConfigError && (
            <div className="mb-4" style={{ color: "#ff4d4f", fontSize: 14, marginLeft: 8 }}>
              请至少添加一个通道配置
            </div>
          )}
        </div>

        <div ref={channelConfigRef} onMouseLeave={handleChannelMouseLeave}>
          <Form.Item
            shouldUpdate
            name="ccConfigs"
            rules={[
              {
                validator: (_, value) => {
                  if (!value || value.length === 0) {
                    setCcConfigError(true)
                    return Promise.reject("")
                  }
                  setCcConfigError(false)
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Form.List name="ccConfigs">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <div
                      key={field.key}
                      className="mb-4 p-4 pb-8 border border-solid border-gray-200 rounded-md relative"
                    >
                      <h4 className="text-sm font-medium mb-3">通道配置{index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="link"
                          onClick={() => handleRemoveChannel(field.name)}
                          className="absolute right-2 top-2 text-xs"
                          icon={<PlusOutlined className="text-gray-500" rotate={45} />}
                        />
                      )}

                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item
                            {...field}
                            name={[field.name, "ccPlatform"]}
                            label="呼叫线路平台"
                            rules={rules.required}
                            className="mb-3"
                          >
                            <Select placeholder="请选择呼叫线路平台">
                              <Option value="cti">天润</Option>
                              <Option value="dt">灯塔</Option>
                              <Option value="zc">智齿</Option>
                              <Option value="xc">XC</Option>
                              <Option value="pbx">PBX</Option>
                              <Option value="xcPbx">XC-PBX</Option>
                              <Option value="lb">灵伴</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            {...field}
                            name={[field.name, "bizField"]}
                            label="通道 ID"
                            className="mb-3"
                          >
                            <Input placeholder="请输入通道 ID" maxLength={100} allowClear />
                          </Form.Item>
                        </Col>

                        <Col span={8}>
                          <Form.Item
                            {...field}
                            name={[field.name, "rate"]}
                            label="分流比例"
                            tooltip="多通道各自占比"
                            rules={[
                              ...rules.required,
                              {
                                validator: (_, value) => {
                                  const ccConfigs = form.getFieldValue("ccConfigs") || []
                                  const total = ccConfigs.reduce(
                                    (sum, item) => sum + (Number(item.rate) || 0),
                                    0
                                  )
                                  if (total > 100) {
                                    return Promise.reject("通道分流比例之和不能超过100%")
                                  }
                                  return Promise.resolve()
                                }
                              }
                            ]}
                            className="mb-3"
                            initialValue={100}
                          >
                            <div className="flex items-center gap-3">
                              <Form.Item {...field} name={[field.name, "rate"]} noStyle>
                                <InputNumber
                                  min={0}
                                  max={100}
                                  precision={0}
                                  className="w-[198px]"
                                  formatter={(value) => `${value}%`}
                                  parser={(value) => value?.replace("%", "")}
                                  onChange={(value) => handleRateChange(value, field.name)}
                                />
                              </Form.Item>
                            </div>
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <Form.Item
                            {...field}
                            name={[field.name, "bizTypes"]}
                            label="BizTypes"
                            className="mb-3"
                            rules={[
                              {
                                validator: (_, value) => {
                                  if (!value || value.length === 0) {
                                    return Promise.resolve()
                                  }
                                  // 计算所有选项的总长度
                                  const totalLength = value.reduce(
                                    (sum, item) => sum + (item?.length || 0),
                                    0
                                  )
                                  if (totalLength > 1000) {
                                    return Promise.reject("所有BizTypes选项的总长度不能超过1000字")
                                  }
                                  return Promise.resolve()
                                }
                              }
                            ]}
                          >
                            <Select
                              mode="tags"
                              placeholder="请输入BizTypes"
                              allowClear
                              maxLength={1000}
                              tokenSeparators={[","]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={24}>
                        <Col span={18}>
                          <Form.Item
                            {...field}
                            name={[field.name, "extraInfo"]}
                            label="拓展参数"
                            tooltip="JSON 格式，用来扩展额外配置"
                            className="mb-3"
                          >
                            <Input.TextArea
                              placeholder="请输入拓展参数配置参数"
                              rows={3}
                              allowClear
                            />
                          </Form.Item>
                        </Col>

                        <Col span={6}>
                          <Form.Item
                            {...field}
                            name={[field.name, "isSkipWebcall"]}
                            label="外部发起外呼"
                            valuePropName="checked"
                            className="mb-3"
                            getValueFromEvent={(checked) => (checked ? 1 : 0)}
                            getValueProps={(value) => ({ checked: value === 1 })}
                            initialValue={0}
                            layout="horizontal"
                          >
                            <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <CustomEmpty description="暂无通道配置，请点击下方按钮添加" />
                  )}
                  {/* 分流比例总和错误提示 */}
                  {rateError && <div className="text-red-500 text-xs mb-2 mt-1">{rateError}</div>}
                  <Form.Item className="mt-4">
                    <Button
                      type="link"
                      onClick={() => {
                        const ccConfigs = form.getFieldValue("ccConfigs") || []
                        const count = ccConfigs.length + 1
                        const base = Math.floor(100 / count)
                        const rates = Array(count).fill(base)
                        rates[count - 1] = 100 - base * (count - 1)
                        // 新增时自动分配所有通道分流比例
                        const newConfigs = ccConfigs.map((item, idx) => ({
                          ...item,
                          rate: rates[idx]
                        }))
                        newConfigs.push({
                          ccPlatform: undefined,
                          bizField: "",
                          bizTypes: [],
                          rate: rates[count - 1],
                          extraInfo: "",
                          isSkipWebcall: 0
                        })
                        form.setFieldsValue({ ccConfigs: newConfigs })
                        setTimeout(() => {
                          if (channelConfigRef.current) {
                            // 滚动到通道设置区域的底部
                            const lastChannelConfig = channelConfigRef.current.lastElementChild
                            if (lastChannelConfig) {
                              lastChannelConfig.scrollIntoView({
                                behavior: "smooth",
                                block: "nearest"
                              })
                            }
                          }
                        }, 100)
                      }}
                      icon={<PlusOutlined />}
                      className="!text-purple-600 !p-0"
                    >
                      创建通道配置
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </div>
      </div>
    </div>
  )
}

export default ChannelConfigTab
