import { useEffect, useMemo, useState } from "react"
import { Form, Input, Select, Row, Col, Button, Divider, InputNumber, Tabs, Switch } from "antd"
import { MinusCircleOutlined } from "@ant-design/icons"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useCustomVariableType } from "../../hooks"
import { useFormData } from "../../hooks/useInputFormData"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import { useFetchGlobalVariable } from "@/api/skill"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction, uniq } from "lodash"
import { CommonContent } from "../CommonContent"
import RecursiveInputList from "@/components/RecursiveInputList"
import { useFetchOutputType } from "@/api/common"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import DynamicFormList from "./DynamicFormList"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import VariableTextArea from "./components/VariableTextArea"
import { PromptTips } from "@/constants/tips"
import { useFetchMultiModalLlmModelType } from "@/api/multiModal/index"
import PreJudgment from "./components/PreJudgment"
import { formatSessionParams } from "./utils"
import AIOptimize from "@/components/AIOptimize"

const TabPane = Tabs.TabPane
const { Option } = Select
const MultimodalComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})
  const [debugData, setDebugData] = useState([])
  const [modalTypeList, setModalTypeList] = useState([])

  const contentValue = Form.useWatch("content", form)

  useEffect(() => {
    form.setFieldsValue({
      ...targetData,
      inputItems:
        targetData?.inputParams?.length > 0
          ? targetData.inputParams.map((item) => {
              return {
                ...item,
                modalType: item.tag.modalType
              }
            })
          : [{ variableName: "", modalType: "" }]
    })
    forceUpdate({})
  }, [targetData, form])

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
  const { data: outputType = [] } = useFetchOutputType("MULTI_MODAL")
  const { data: llmModelTypeList = [] } = useFetchMultiModalLlmModelType()

  useEffect(() => {
    if (llmModelTypeList.length > 0 && targetData.modelType) {
      const item = llmModelTypeList.find((item) => item.code === targetData.modelType)
      setModalTypeList(item.modalType)
    }
  }, [llmModelTypeList, targetData.modelType])

  const onLlmModelTypeChange = (value) => {
    const item = llmModelTypeList.find((item) => item.code === value)
    setModalTypeList(item?.modalType ?? [])
  }

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  const globalDataMemo = useMemo(() => {
    const data = {}
    globalData?.map((item) => {
      data[item.displayName] = item
    })
    return data
  }, [globalData])
  const onMouseBlur = () => {
    const content = form.getFieldValue("content")
    const inputItems = form.getFieldValue("inputItems") || []
    const inputItemsStr = inputItems.map((item) => item.variableName).join(",")
    const str = `${content}${inputItemsStr}`
    const fieldList = matchElements(str, globalDataMemo)
    setDebugData(fieldList)
  }

  useEffect(() => {
    onMouseBlur()
  }, [targetData.content, globalData])
  console.log("debugData:", debugData)

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      const { sessions, ...rest } = values
      console.log("Received values of form: ", values)
      const inputParams = values.inputItems?.map(({ variableName, modalType }) => {
        return {
          valueExpression: variableName,
          variableName,
          variableValueType: "string",
          variableRequire: false,
          tag: {
            modalType
          }
        }
      })
      const session = formatSessionParams(globalData, sessions)
      updateNodeComp(
        {
          ...targetData,
          ...rest,
          globalDataOptions: globalData,
          inputParams,
          inputItems: [],
          outputType: "JSON",
          label: values.componentName,
          session,
          sessions
        },
        callbackFunc,
        noMessage
      )
    })
  }

  const { data: varOptions = [] } = useCustomVariableType()
  useSaveShortcut(onFinish, isLoading)

  return (
    <div className="webhook-node-wrapper">
      <div className="base-node-comp ">
        <Form form={form} onFinish={onFinish} labelCol={{ span: 7 }} disabled={isDisabled}>
          <CommonContent
            title={"多模态组件"}
            containerClass="noPadding"
            extraRender={() => (
              <Button type="primary" htmlType="submit" loading={isLoading} disabled={isLocked}>
                保存
              </Button>
            )}
          >
            <Tabs defaultActiveKey="1" type="card">
              <TabPane tab="组件设置" key="1">
                <PreJudgment form={form} />
                <Divider>基础设置</Divider>
                <Row className="mt-3" gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      labelCol={{
                        span: 5
                      }}
                      name="componentName"
                      label="组件名"
                      tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
                      rules={[{ required: true, message: "请输入组件名" }]}
                    >
                      <Input placeholder="请输入组件名" />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      name="modelType"
                      labelCol={{
                        span: 9
                      }}
                      label="模型类型"
                      rules={[{ required: true, message: "请选择模型类型" }]}
                    >
                      <Select placeholder="请选择模型类型" onChange={onLlmModelTypeChange}>
                        {llmModelTypeList.map((llmModelTypeItem) => (
                          <Select.Option
                            key={llmModelTypeItem.code}
                            value={llmModelTypeItem.code}
                            disabled={llmModelTypeItem.status === 0}
                          >
                            {llmModelTypeItem.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Divider>输入项配置</Divider>
                <Form.List name="inputItems">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Row key={key} gutter={16}>
                          <Col span={6}>
                            <Form.Item
                              name={[name, "modalType"]}
                              labelCol={{
                                span: 9
                              }}
                              rules={[{ required: true, message: "请选择模态类型" }]}
                            >
                              <Select placeholder="请选择模态类型" onChange={onMouseBlur}>
                                {modalTypeList.map((modalTypeItem) => (
                                  <Select.Option
                                    key={modalTypeItem.code}
                                    value={modalTypeItem.code}
                                  >
                                    {modalTypeItem.name}
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={16}>
                            <GlobalVariableSelect
                              span={3}
                              formName={[name, "variableName"]}
                              multiple={false}
                              onChange={onMouseBlur}
                              disabled={isDisabled}
                            />
                          </Col>
                          <Col>
                            {fields.length > 1 && (
                              <MinusCircleOutlined
                                onClick={() => {
                                  remove(name)
                                  onMouseBlur()
                                }}
                              />
                            )}
                          </Col>
                        </Row>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block>
                          添加新模态
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
                <Divider>输出项配置</Divider>
                <Row>
                  <Col span={11} style={{ marginLeft: 6 }}>
                    <Form.Item
                      labelCol={{
                        span: 8
                      }}
                      name="parseMethod"
                      label="解析方式"
                      rules={[
                        {
                          required: true,
                          message: "请选择解析方式"
                        }
                      ]}
                      initialValue={outputType?.[0]?.code}
                    >
                      <Select placeholder="请选择解析方式">
                        {outputType.map((method, i) => (
                          <Select.Option key={i} value={method.code}>
                            {method.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Form.Item
                    labelCol={{
                      span: 8
                    }}
                    name="outputName"
                    label="输出变量名"
                    rules={[
                      {
                        required: false,
                        message: "请输入"
                      }
                    ]}
                  >
                    <Input placeholder="请输入" />
                  </Form.Item>
                </Row>
                <Form.Item
                  className="global-tips"
                  style={{
                    marginLeft: 8
                  }}
                  name="content"
                  label={
                    <div className="flex items-center">
                      <span className="mr-2">提示词</span>
                      {skillFlowData?.skillNo && (
                        <AIOptimize
                          originalPrompt={contentValue}
                          intelligentAgentType="SKILL"
                          intelligentAgentNo={skillFlowData.skillNo}
                          onSubmit={({ type, content }) => {
                            if (type === "agent") {
                              form.setFieldsValue({ content })
                            }
                          }}
                        />
                      )}
                    </div>
                  }
                  rules={[
                    {
                      required: true,
                      message: "请输入"
                    }
                  ]}
                  labelCol={{
                    span: 24,
                    offset: 0.3
                  }}
                  tooltip={{
                    title: PromptTips,
                    overlayStyle: { maxWidth: 400 }
                  }}
                >
                  <VariableTextArea
                    variables={globalData}
                    disabled={isDisabled}
                    onMouseBlur={onMouseBlur}
                    onChange={onMouseBlur}
                  />
                </Form.Item>
              </TabPane>
              <TabPane tab="后置处理" key="2" forceRender>
                <DynamicFormList form={form} varOptions={varOptions} />
              </TabPane>
            </Tabs>
          </CommonContent>
        </Form>
        <div className="absolute debug-panel">
          <DynamicFormComponent
            onFinish={onFinish}
            nodeId={targetData.id}
            preview={false}
            formData={debugData}
            isProcess={false}
          />
        </div>
      </div>
    </div>
  )
}

export default MultimodalComponent

function matchElements(content, globalObject) {
  let fieldNames = Object.keys(globalObject)
  const sortedArray = fieldNames.slice().sort((a, b) => b.length - a.length)
  const pattern = sortedArray
    .map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // 转义需要转义的字符
    .join("|")
  const regex = new RegExp(pattern, "g")
  let match = content?.match(regex)

  const matchedFields = []
  if (match && Array.isArray(match)) {
    uniq(match).map((item) => {
      let fieldObject = globalObject[item]
      if (
        fieldObject &&
        fieldObject.hasOwnProperty("formControlFacade") &&
        fieldObject.formControlFacade &&
        fieldObject.formControlFacade.controlType
      ) {
        matchedFields.push({
          ...fieldObject.formControlFacade,
          title: fieldObject.formControlFacade.title || fieldObject.displayName,
          valueExpression: fieldObject.valueExpression,
          attributeName: fieldObject.valueExpression
        })
      } else {
        matchedFields.push({
          ...fieldObject,
          controlType: "textarea",
          attributeName: fieldObject?.valueExpression,
          title: fieldObject?.description || fieldObject?.displayName,
          placeholder: "请输入……"
        })
      }
    })
  }
  return matchedFields
}
