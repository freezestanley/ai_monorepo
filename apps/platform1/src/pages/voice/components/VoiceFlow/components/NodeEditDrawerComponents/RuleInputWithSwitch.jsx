import React, { useState, useEffect, memo } from "react"
import { Form, Input, Switch } from "antd"

const RuleInputWithSwitch = memo(({ field, form }) => {
  // 获取当前ruleStatus值来确定初始状态，默认为0（关闭）
  const ruleStatusValue = form.getFieldValue(["scripts", field.name, "ruleStatus"]) ?? 0
  const ruleValue = form.getFieldValue(["scripts", field.name, "rule"])
  const [showRuleInput, setShowRuleInput] = useState(ruleStatusValue === 1)
  // 保存原始值，用于恢复
  const [originalRuleValue, setOriginalRuleValue] = useState(ruleValue || "")

  // 使用Form.useWatch监听ruleStatus的变化
  const watchedRuleStatus = Form.useWatch(["scripts", field.name, "ruleStatus"], form)

  // 当组件挂载或ruleStatus变化时检查值并保存原始值
  useEffect(() => {
    // 获取最新的ruleStatus值，优先使用watchedRuleStatus
    const currentRuleStatus =
      watchedRuleStatus ?? form.getFieldValue(["scripts", field.name, "ruleStatus"]) ?? 0
    const currentRuleValue = form.getFieldValue(["scripts", field.name, "rule"])

    // 根据ruleStatus设置开关状态
    setShowRuleInput(currentRuleStatus === 1)

    // 只在初始化时保存原始值
    if (currentRuleValue) {
      setOriginalRuleValue(currentRuleValue)
    }

    // 如果ruleStatus字段不存在，初始化为0（默认关闭）
    if (currentRuleStatus === undefined || currentRuleStatus === null) {
      form.setFieldValue(["scripts", field.name, "ruleStatus"], 0)
    }
  }, [form, field.name, watchedRuleStatus])

  return (
    <>
      <div className="flex items-center justify-start my-3 mt-2">
        <span className="text-sm font-medium text-gray-700 mr-2">话术规则</span>
        <Switch
          size="small"
          checked={showRuleInput}
          onChange={(checked) => {
            setShowRuleInput(checked)
            // 设置ruleStatus字段：1表示打开，0表示关闭
            const ruleStatus = checked ? 1 : 0
            form.setFieldValue(["scripts", field.name, "ruleStatus"], ruleStatus)

            if (!checked) {
              // 关闭时临时清空rule值，但保留原始值
              form.setFieldValue(["scripts", field.name, "rule"], "")
            } else {
              // 打开时恢复原始值
              form.setFieldValue(["scripts", field.name, "rule"], originalRuleValue)
            }
          }}
        />
        <a
          className="ml-2 text-[12px]"
          href="https://za-ark-cs.oss-cn-hzfinance.aliyuncs.com/ai_call_agent/doc/%E8%AF%9D%E6%9C%AF%E6%92%AD%E6%94%BE%E8%A7%84%E5%88%99%E4%B9%A6%E5%86%99%E8%A7%84%E8%8C%83.docx?OSSAccessKeyId=LTAI5tJeHBo1sJeo5RUdkh4P&Expires=2071554575&Signature=mnZ2Lp9gyOe2FS2VvgJKy8IxbWw%3D"
          target="_blank"
          rel="noopener noreferrer"
        >
          规则说明
        </a>
      </div>
      {/* 隐藏的ruleStatus字段，用于保存状态到后端 */}
      <Form.Item {...field} name={[field.name, "ruleStatus"]} className="hidden">
        <Input type="hidden" />
      </Form.Item>
      {showRuleInput ? (
        <Form.Item
          {...field}
          name={[field.name, "rule"]}
          className="mb-0"
          rules={[{ required: true, message: "请输入话术规则" }]}
        >
          <Input.TextArea
            placeholder="请输入话术规则"
            allowClear
            onChange={(e) => {
              // 当用户手动修改时，更新原始值
              setOriginalRuleValue(e.target.value)
            }}
          />
        </Form.Item>
      ) : (
        <div className="-mt-3"></div>
      )}
    </>
  )
})

export default RuleInputWithSwitch
