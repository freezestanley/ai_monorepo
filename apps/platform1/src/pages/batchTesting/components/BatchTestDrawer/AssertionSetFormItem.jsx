import { useState } from "react"
import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Slider,
  Typography,
  Radio,
  Result,
  Spin,
  message
} from "antd"
import { CheckCircleTwoTone, CloseCircleOutlined, CoffeeOutlined } from "@ant-design/icons"
import { useDebugTestSet, useDebugAgentTestSet } from "@/api/batchTest"
import { useFetchLlmModelType } from "@/api/common"
import { marks } from "@/constants"
import AIOptimize from "@/components/AIOptimize"
import VariableTextArea from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/VariableTextArea"
import { TestAssertPromptPlaceholder, TestAssertPromptTips } from "@/constants/tips"

const { Title } = Typography

const AssertionSetFormItem = ({
  form,
  botNo,
  skillNo,
  agentNo,
  type,
  setAttributeName,
  names,
  outputData
}) => {
  const [debugResult, setDebugResult] = useState(null)

  const promptValue = Form.useWatch([...names, "prompt"], form)

  const { mutate: debugTestSet, isLoading: isDebugLoading } = useDebugTestSet()
  const { mutate: debugAgentTestSet, isLoading: isDebugAgentLoading } = useDebugAgentTestSet()
  const { data: modelOptions } = useFetchLlmModelType()

  const debugAssert = () => {
    form.validateFields(names).then((values) => {
      ;(type === "skill" ? debugTestSet : debugAgentTestSet)(
        {
          ...values,
          ...(values[names?.[0]] || {}),
          botNo,
          ...(type === "skill" ? { skillNo } : { agentNo })
        },
        {
          onSuccess: (res) => {
            setDebugResult(res.data)
          },
          onError: (err) => {
            console.log("err:", err)
            setDebugResult(JSON.stringify(err))
            message.error("断言失败")
          }
        }
      )
    })
  }
  return (
    <>
      {names?.[0] === "assertConfig" && type === "skill" && (
        <Form.Item className="mt-2" label="选择对比字段" name="attributeName">
          <Select placeholder="请选择对比字段" onChange={setAttributeName} mode="multiple">
            {outputData?.outputList?.map((item) => (
              <Select.Option value={item.attributeName} key={item.attributeName}>
                {item.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}
      <Form.Item
        className="mt-2"
        label="断言类型"
        name={names?.[0] === "assertConfig" ? "assertType" : "summaryAssertType"}
        initialValue={names?.[0] === "assertConfig" ? "0" : "1"}
      >
        <Radio.Group defaultValue={names?.[0] === "assertConfig" ? "0" : "1"}>
          {names?.[0] === "assertConfig" && <Radio value={"0"}>文本对比</Radio>}
          <Radio value={"1"}>大模型断言</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.assertType !== currentValues.assertType ||
          prevValues.summaryAssertType !== currentValues.summaryAssertType
        }
      >
        {({ getFieldValue }) =>
          (names?.[0] === "assertConfig"
            ? getFieldValue("assertType") === "1"
            : getFieldValue("summaryAssertType") === "1") && (
            <>
              <Form.Item
                name={[...names, "modelType"]}
                label="模型类型"
                rules={[{ required: true }]}
                initialValue={
                  (modelOptions.filter((item) => {
                    return item.status === 1 && item.name === "通义千问"
                  }) || [])?.[0]?.code || ""
                }
              >
                <Select
                  placeholder="请选择模型类型"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {modelOptions?.map((opt) => (
                    <Select.Option key={opt.code} value={opt.code} disabled={opt.status === 0}>
                      {opt.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item initialValue={0.7} name={[...names, "temperature"]} label="回答风格">
                <Slider max={2} step={0.1} marks={marks} />
              </Form.Item>
              <Form.Item
                className="global-tips"
                style={{
                  marginLeft: 8
                }}
                name={[...names, "prompt"]}
                label={
                  <div className="flex items-center">
                    <span className="mr-2">提示词</span>
                    {!!(type === "skill" ? skillNo : agentNo) && (
                      <AIOptimize
                        originalPrompt={promptValue}
                        intelligentAgentType={type === "skill" ? "SKILL" : "AGENT"}
                        intelligentAgentNo={type === "skill" ? skillNo : agentNo}
                        onSubmit={({ type, content }) => {
                          if (type === "agent") {
                            form.setFieldValue([...names, "prompt"], content)
                          }
                        }}
                      />
                    )}
                  </div>
                }
                labelCol={{
                  span: 24,
                  push: 1
                }}
                wrapperCol={{
                  span: 19,
                  offset: 1
                }}
                tooltip={{
                  title: TestAssertPromptTips,
                  overlayStyle: { maxWidth: 400 }
                }}
                initialValue={TestAssertPromptPlaceholder}
              >
                <VariableTextArea
                  variables={[]}
                  miniInputProps={{
                    placeholder: TestAssertPromptPlaceholder
                  }}
                  largeInputProps={{
                    placeholder: TestAssertPromptPlaceholder
                  }}
                />
              </Form.Item>

              <Row justify="space-around" className="mb-4">
                <Col span={10}>
                  <Title level={5}>断言调试</Title>
                </Col>
                <Col span={10} pull={3} className="text-right">
                  <Button type="primary" onClick={debugAssert}>
                    调试
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col span={20}>
                  <Form.Item
                    name={[...names, "expectResult"]}
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    label="期望结果"
                    rules={[
                      {
                        required: true,
                        message: "请输入期望结果"
                      }
                    ]}
                  >
                    <Input placeholder="请输入期望结果" />
                  </Form.Item>
                </Col>
                <Col span={20}>
                  <Form.Item
                    name={[...names, "actualResult"]}
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    label="实际结果"
                    rules={[
                      {
                        required: true,
                        message: "请输入实际结果"
                      }
                    ]}
                  >
                    <Input placeholder="请输入实际结果" />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={20} push={1}>
                  <div
                    className="debug-content-wrapper"
                    style={{
                      maxHeight: 600
                    }}
                  >
                    <Result
                      icon={
                        (type === "skill" ? isDebugLoading : isDebugAgentLoading) ? (
                          <Spin spinning={true} />
                        ) : debugResult === true ? (
                          <CheckCircleTwoTone twoToneColor="#52c41a" />
                        ) : debugResult === false ? (
                          <CloseCircleOutlined />
                        ) : (
                          <CoffeeOutlined />
                        )
                      }
                      title={
                        (type === "skill" ? isDebugLoading : isDebugAgentLoading)
                          ? "正在调试中，请稍后……"
                          : debugResult === true
                            ? "调试通过！"
                            : debugResult === false
                              ? "调试失败"
                              : "待调试~"
                      }
                      subTitle={
                        (type === "skill" ? isDebugLoading : isDebugAgentLoading)
                          ? "我把服务器资源都给你了，请相信我的速度……"
                          : debugResult === true
                            ? "不错不错，这么快就调试通过了，你可以进行下一步咯！"
                            : debugResult === false
                              ? `断言未成功哦[${debugResult}]`
                              : "快快来调试我吧~"
                      }
                    />
                  </div>
                </Col>
              </Row>
            </>
          )
        }
      </Form.Item>
    </>
  )
}

export default AssertionSetFormItem
