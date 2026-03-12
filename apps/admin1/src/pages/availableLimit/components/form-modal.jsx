import { Divider, Form, Input, InputNumber, Modal, Radio, Select } from "antd"
import { useEffect, useState } from "react"
function FormModal({ form, visible, record, handleSave, setVisible, defaultData }) {
  const [followRuleDisabled, setFollowRuleDisabled] = useState(false)
  const [degradeRuleDisabled, setDegradeRuleDisabled] = useState(false)
  const [degradeRule, setDegradeRule] = useState("SPEED")
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        skillName: record.skillName,
        resource: record.resource,
        botName: record.botName,
        flowRuleType: record.flowRule.type,
        flowRuleGrade: record.flowRule.grade,
        flowRuleCount: record.flowRule.count,
        degradeRuleGrade: record.degradeRule.grade,
        degradeRuleType: record.degradeRule.type,
        degradeRuleMaxResponseTime: record.degradeRule.maxResponseTime,
        degradeRuleSlowRatioThreshold: record.degradeRule.slowRatioThreshold * 100,
        degradeRuleTimeWindow: record.degradeRule.timeWindow,
        degradeRuleMinRequestAmount: record.degradeRule.minRequestAmount || "",
        degradeRuleStatIntervalMs: record.degradeRule.statIntervalMs || ""
      })
      setFollowRuleDisabled(record.flowRule.type === 0 ? true : false)
      setDegradeRuleDisabled(record.degradeRule.type === 0 ? true : false)
    } else {
      form.resetFields()
    }
  }, [record, visible, form])
  const onDegradeRuleTypeChange = (e) => {
    const isDefault = e.target.value === 0 ? true : false
    setDegradeRuleDisabled(isDefault)
    if (isDefault) {
      form.setFieldsValue({
        degradeRuleGrade: defaultData.degradeRule.grade,
        degradeRuleMaxResponseTime: defaultData.degradeRule.maxResponseTime,
        degradeRuleSlowRatioThreshold: defaultData.degradeRule.slowRatioThreshold * 100,
        degradeRuleTimeWindow: defaultData.degradeRule.timeWindow,
        degradeRuleMinRequestAmount: defaultData.degradeRule.minRequestAmount || "",
        degradeRuleStatIntervalMs: defaultData.degradeRule.statIntervalMs || ""
      })
    } else {
      form.setFieldsValue({
        degradeRuleGrade: record.degradeRule.grade,
        degradeRuleMaxResponseTime: record.degradeRule.maxResponseTime,
        degradeRuleSlowRatioThreshold: record.degradeRule.slowRatioThreshold * 100,
        degradeRuleTimeWindow: record.degradeRule.timeWindow,
        degradeRuleMinRequestAmount: record.degradeRule.minRequestAmount || "",
        degradeRuleStatIntervalMs: record.degradeRule.statIntervalMs || ""
      })
    }
  }
  const onFollowRuleChange = (e) => {
    const isDefault = e.target.value === 0 ? true : false
    setFollowRuleDisabled(isDefault)
    if (isDefault) {
      form.setFieldsValue({
        flowRuleGrade: defaultData.flowRule.grade,
        flowRuleCount: defaultData.flowRule.count
      })
    } else {
      form.setFieldsValue({
        flowRuleGrade: record.flowRule.grade,
        flowRuleCount: record.flowRule.count
      })
    }
  }
  const onDegradeRuleGradeChange = (e) => {
    setDegradeRule(e.target.value === 0 ? "SPEED" : "EXCEPTION")
  }
  console.log("defaultData:", defaultData)

  return (
    <Modal
      title={`编辑可用性策略`}
      okText="保存"
      visible={visible}
      onOk={handleSave}
      onCancel={() => setVisible(false)}
    >
      <Form
        form={form}
        labelCol={{
          span: 6
        }}
        wrapperCol={{
          span: 17
        }}
      >
        <Form.Item
          label="工作流名称"
          name="skillName"
          rules={[{ required: true, message: "请输入工作流名称!" }]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="资源名"
          name="resource"
          rules={[{ required: true, message: "请输入资源名!" }]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="空间名称"
          name="botName"
          rules={[{ required: true, message: "请输入空间名称!" }]}
        >
          <Input disabled />
        </Form.Item>
        <Divider>流控策略</Divider>
        <Form.Item
          label="流控方案"
          name="flowRuleType"
          initialValue={0}
          rules={[{ required: true, message: "请选择流控方案!" }]}
        >
          <Radio.Group onChange={onFollowRuleChange}>
            <Radio value={0}>默认</Radio>
            <Radio value={1}>自定义</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label="阈值类型"
          name="flowRuleGrade"
          initialValue={1}
          rules={[{ required: true, message: "请选择流阈值类型!" }]}
        >
          <Select
            disabled={followRuleDisabled}
            options={[
              { value: 1, label: "QPS" },
              { value: 0, label: "并发线程数" }
            ]}
          />
        </Form.Item>
        <Form.Item
          label="单机阈值"
          name="flowRuleCount"
          rules={[{ required: true, message: "请输入单机阈值!" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            max={9999999999}
            controls={false}
            disabled={followRuleDisabled}
            placeholder="单机阈值"
          />
        </Form.Item>
        <Divider>熔断策略</Divider>
        <Form.Item
          label="熔断方案"
          name="degradeRuleType"
          rules={[{ required: true, message: "请选择熔断方案!" }]}
        >
          <Radio.Group defaultValue={0} onChange={onDegradeRuleTypeChange}>
            <Radio value={0}>默认</Radio>
            <Radio value={1}>自定义</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label="熔断规则"
          name="degradeRuleGrade"
          rules={[{ required: true, message: "请选择熔断规则!" }]}
        >
          <Radio.Group
            disabled={degradeRuleDisabled}
            onChange={onDegradeRuleGradeChange}
            defaultValue={0}
          >
            <Radio value={0}>慢调用比例</Radio>
            <Radio value={1}>异常比例</Radio>
          </Radio.Group>
        </Form.Item>
        {degradeRule === "SPEED" && (
          <Form.Item
            label="最大响应时间"
            name="degradeRuleMaxResponseTime"
            rules={[
              {
                required: true,
                message: "请输入最大响应时间!"
              }
            ]}
          >
            <InputNumber
              min={1}
              max={9999999999}
              controls={false}
              style={{ width: "100%" }}
              disabled={degradeRuleDisabled}
              placeholder="最大响应时间（毫秒）"
              addonAfter="毫秒"
            />
          </Form.Item>
        )}

        <Form.Item
          label="比例阈值"
          name="degradeRuleSlowRatioThreshold"
          rules={[
            {
              required: true,
              message: "请输入慢调用比例阈值!"
            }
          ]}
        >
          <InputNumber
            min={1}
            max={100}
            controls={false}
            style={{ width: "100%" }}
            disabled={degradeRuleDisabled}
            placeholder="慢调用比例阈值"
            addonAfter="%"
          />
        </Form.Item>
        <Form.Item
          label="熔断时长"
          name="degradeRuleTimeWindow"
          rules={[
            {
              required: true,
              message: "请输入熔断时长!"
            }
          ]}
        >
          <InputNumber
            min={1}
            max={99999}
            controls={false}
            style={{ width: "100%" }}
            disabled={degradeRuleDisabled}
            placeholder="熔断时长（秒）"
            addonAfter="秒"
          />
        </Form.Item>
        <Form.Item
          label="最小请求数"
          name="degradeRuleMinRequestAmount"
          rules={[
            {
              required: true,
              message: "请输入最小请求数!"
            }
          ]}
        >
          <InputNumber
            min={1}
            max={9999}
            controls={false}
            style={{ width: "100%" }}
            disabled={degradeRuleDisabled}
            placeholder="最小请求数"
          />
        </Form.Item>
        <Form.Item
          label="统计时长"
          name="degradeRuleStatIntervalMs"
          rules={[
            {
              required: true,
              message: "请输入统计时长!"
            }
          ]}
        >
          <InputNumber
            min={1}
            max={99999}
            controls={false}
            style={{ width: "100%" }}
            disabled={degradeRuleDisabled}
            placeholder="统计时长（秒）"
            addonAfter="秒"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default FormModal
