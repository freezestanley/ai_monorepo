import { useEffect } from "react"
import { Form, Select, Switch, Button, message } from "antd"
import AssertionSetFormItem from "./AssertionSetFormItem"

const RenderSetStep = ({
  type,
  botNo,
  agentNo,
  skillNo,
  formData,
  setFormData,
  setCurrentStep,
  onBack,
  currentVersion,
  setCurrentVersion,
  versionList,
  versionNo,
  disableChooseVersion,
  ...restProps
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (formData) {
      form.setFieldsValue(formData)
      return
    }
    if (versionList) {
      const firstVNo = versionList.filter((item) => item.inUse)[0]?.versionNo
      const vNo =
        versionNo && versionList.find((v) => v.versionNo === versionNo && v.inUse)
          ? versionNo
          : firstVNo
      setCurrentVersion(vNo)
      form.setFieldsValue({
        [type === "skill" ? "skillVersionNo" : "agentVersionNo"]: vNo
      })
    }
  }, [form, type, versionList, formData, versionNo])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">说明</h1>
      <p style={{ lineHeight: 2 }}>
        批量测试功能可批量导入需要测试的数据集，从而測试当前{type === "skill" ? "工作流" : "Agent"}
        的输出结果，并且可以生成两部分内容：
        <br />
        1. 基于提供的输入值，批量执行后得到测试输出结果
        <br />
        2.（可选)填写预期结果，系统判断是否与输出一致，来判定对错，最终可得出该批次的正确率
      </p>

      <h1 className="text-xl font-bold mt-10">开始设置</h1>
      <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 16 }}>
        {/* 一个select */}
        <Form.Item
          className="mt-2"
          label="被测试版本"
          name={type === "skill" ? "skillVersionNo" : "agentVersionNo"}
          rules={[{ required: true, message: "请选择被测试版本" }]}
        >
          <Select
            disabled={disableChooseVersion}
            placeholder="请选择被测试版本"
            onChange={setCurrentVersion}
            allowClear
          >
            {versionList?.map((item) => (
              <Select.Option value={item.versionNo} key={item.versionNo}>
                {item.versionName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          className="mt-2"
          labelCol={{ span: 18 }}
          labelAlign="left"
          colon={false}
          label={
            <>
              <span className="text-600 text-[#000]">分句断言</span>
              <span className="text-[#8c8c8c]">开启后，比对每一轮单句应答结果</span>
            </>
          }
          name="clauseAssertEnabled"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch className="ml-[10px]" />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.clauseAssertEnabled !== curr.clauseAssertEnabled}
        >
          {({ getFieldValue }) =>
            getFieldValue("clauseAssertEnabled") && (
              <AssertionSetFormItem
                names={["assertConfig"]}
                form={form}
                botNo={botNo}
                agentNo={agentNo}
                skillNo={skillNo}
                type={type}
                {...restProps}
              />
            )
          }
        </Form.Item>
        <Form.Item
          className="mt-2"
          labelCol={{ span: 18 }}
          labelAlign="left"
          colon={false}
          label={
            <>
              <span className="text-600 text-[#000]">总结断言</span>
              <span className="text-[#8c8c8c]">开启后，比对多轮完整会话结果</span>
            </>
          }
          name="summaryAssertEnabled"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch className="ml-[10px]" />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.summaryAssertEnabled !== curr.summaryAssertEnabled}
        >
          {({ getFieldValue }) =>
            getFieldValue("summaryAssertEnabled") && (
              <AssertionSetFormItem
                names={["summaryAssertConfig"]}
                form={form}
                botNo={botNo}
                agentNo={agentNo}
                skillNo={skillNo}
                type={type}
                {...restProps}
              />
            )
          }
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.clauseAssertEnabled !== currentValues.clauseAssertEnabled ||
            prevValues.summaryAssertType !== currentValues.summaryAssertType
          }
        >
          {({ getFieldValue }) => (
            <div className="mt-4 mt-12">
              <Button onClick={onBack}>取消</Button>
              <Button
                onClick={() => {
                  if (
                    !getFieldValue("clauseAssertEnabled") &&
                    !getFieldValue("summaryAssertEnabled")
                  ) {
                    message.warning("请开启断言")
                    return
                  }
                  setFormData(form.getFieldsValue())
                  setCurrentStep((currentStep) => currentStep + 1)
                }}
                disabled={!currentVersion}
                type="primary"
                style={{ marginLeft: 8 }}
              >
                下一步
              </Button>
            </div>
          )}
        </Form.Item>
      </Form>
    </div>
  )
}

export default RenderSetStep
