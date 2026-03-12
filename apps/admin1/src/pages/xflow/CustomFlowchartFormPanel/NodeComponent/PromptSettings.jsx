import { useState, useEffect, useMemo, useRef } from "react"
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Divider,
  Slider,
  Radio,
  InputNumber,
  Switch
} from "antd"
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { uniq } from "lodash"
import { OutputParameter } from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/OutputParameter"
import AdvanceSetting from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/AdvanceSetting"
import { useNode } from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/hooks/useNodeOutput"
import "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/index.scss"
import { parseTypes, marks } from "@/constants"
import {
  useFetchLlmFilterModelType,
  useFetchOutputType,
  useFetchCodeModePermission,
  useFetchLlmReasoningEffort
} from "@/api/common"
import { moveItem } from "@/api/tools"
import CustomDivider from "@/components/CustomDivider"
import { InfoIcon } from "@/components/FormIcon"
import PreJudgment from "./components/PreJudgment"
import QuickMode from "./components/QuickMode"
import ProfessionalMode from "./components/ProfessionalMode"
import CodeMode from "./components/CodeMode"
import ModelTypeFormComponent from "./ModelTypeFormComponent"

/**
 * 析出prompt里边的字段
 */
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

const PromptSettings = ({
  isDisabled,
  form,
  targetData,
  skillFlowData,
  globalData,
  multiModalWarning,
  setMultiModalWarning,
  setForceShowDebugButton,
  setDebugData
}) => {
  const [promptMode, setPromptMode] = useState("BASIC")

  // Use Form.useWatch to monitor content field
  const contentValue = Form.useWatch("content", form)
  const scriptValue = Form.useWatch("script", form)
  const modelTypeValue = Form.useWatch("modelType", form)
  const enableMultiModelValue = Form.useWatch("enableMultiModel", form)
  const modelListValue = Form.useWatch("modelList", form)
  const modelElseValue = Form.useWatch("modelElse", form)

  const { parseMethod, outputs, handleParseMethodChange, addOutput, deleteOutput } = useNode(
    form,
    targetData
  )
  const { data: reasoningEffortOptions = [] } = useFetchLlmReasoningEffort()
  const { data: outputType = [] } = useFetchOutputType("PROMPT_TEMPLATE")
  const { data: modelOptions = [] } = useFetchLlmFilterModelType(skillFlowData?.botNo)
  const { data: codeModePermission = false } = useFetchCodeModePermission()
  const oldMultiModalTypeListRef = useRef([])

  const multiModalTypeList = useMemo(() => {
    if (!enableMultiModelValue) {
      const item = modelOptions.find((item) => item.code === modelTypeValue)
      const newMultiModalTypeList = item?.modalType?.filter((m) => {
        return m.code !== "TEXT"
      })
      return newMultiModalTypeList ?? []
    }
    const list = []
    ;[
      ...(modelListValue || []).filter((v) => !!v?.expression),
      { modelType: modelElseValue?.modelType }
    ].forEach((item) => {
      const newItem = modelOptions.find((v) => v.code === item?.modelType)
      const newMultiModalTypeList = newItem?.modalType?.filter((m) => {
        return m.code !== "TEXT"
      })
      // 将过滤后的模态类型添加到list中，并确保code不重复
      newMultiModalTypeList?.forEach((modalType) => {
        // 检查list中是否已存在相同code的项目
        const existingItem = list.find((item) => item.code === modalType?.code)
        !existingItem && list.push(modalType)
      })
    })
    return list
  }, [modelOptions, enableMultiModelValue, modelTypeValue, modelListValue, modelElseValue])

  const globalDataMemo = useMemo(() => {
    const data = {}
    if (Array.isArray(globalData)) {
      globalData.forEach((item) => {
        data[item.displayName] = item
      })
    }
    return data
  }, [globalData])

  const onMouseBlur = () => {
    const content =
      promptMode === "PROFESSIONAL"
        ? form.getFieldValue("systemMessage") || ""
        : promptMode === "CODE"
          ? ""
          : form.getFieldValue("content") || ""
    if (content?.trim()) {
      setForceShowDebugButton(true)
      // TODO: 是否需要改变状态
    } else {
      setForceShowDebugButton(false)
    }
    const inputItems =
      promptMode === "PROFESSIONAL"
        ? form.getFieldValue("professionalContents") || []
        : promptMode === "CODE"
          ? form.getFieldValue("codeInputParams") || []
          : form.getFieldValue("quickModeInputs")?.length
            ? form.getFieldValue("quickModeInputs") || []
            : form.getFieldValue("inputParams") || [] //form.getFieldValue("inputParams") || []

    // console.log("inputItems =>", promptMode, form.getFieldValue(), inputItems)

    const inputItemsStr = inputItems
      .map((item) => {
        // 如果是专业模式且没有图片输入，或者没有图片输入
        if (promptMode === "PROFESSIONAL" && (!item?.imageInputs || !item?.imageInputs?.length)) {
          return item.content
        }

        // 如果是专业模式且有图片输入
        if (promptMode === "PROFESSIONAL" && item?.imageInputs && item?.imageInputs?.length) {
          return item?.imageInputs?.map((image) => image.variable)
        }

        // 如果是代码模式
        if (promptMode === "CODE") {
          return item.valueExpression
        }

        // 默认情况
        return item.variable || item.variableName //item.variableName
      })
      .join(",")

    const str = `${content}${inputItemsStr}`

    // console.log("inputItems32222 =>", str, inputItemsStr)

    const fieldList = matchElements(str, globalDataMemo)
    setDebugData(fieldList)
  }

  useEffect(() => {
    onMouseBlur()
  }, [targetData.content, globalData, promptMode])

  // 清除多模态警告当切换到快速模式或代码模式时
  useEffect(() => {
    const newHasMultiModal = multiModalTypeList?.length > 0
    if (promptMode === "BASIC" || promptMode === "CODE") {
      setMultiModalWarning("")
    } else {
      const wasMultiModal = oldMultiModalTypeListRef.current?.length > 0
      // 检测从多模态切换到非多模态
      if (wasMultiModal && !newHasMultiModal && promptMode === "PROFESSIONAL") {
        // 获取当前专业模式的数据
        const currentProfessionalContents = form.getFieldValue("professionalContents") || []

        // 检查是否有启用的图片开关，但不清除配置
        const hasEnabledImages = currentProfessionalContents.some((content) => content.enableImage)

        if (hasEnabledImages) {
          // 设置警告信息，但保持配置不变
          setMultiModalWarning("模型已切换成纯文本模式，多模态不可以使用")
        } else {
          setMultiModalWarning("")
        }
      } else if (!wasMultiModal && newHasMultiModal && promptMode === "PROFESSIONAL") {
        // 从非多模态切换回多模态，清除警告
        setMultiModalWarning("")
      } else if (newHasMultiModal) {
        // 清除警告信息
        setMultiModalWarning("")
      }
    }
    if (newHasMultiModal) {
      const inputItems = form.getFieldValue("inputItems")
      if (!inputItems?.length) {
        form.setFieldsValue({
          inputItems: [
            {
              modalType: null,
              variableName: null
            }
          ]
        })
      }
    }
    oldMultiModalTypeListRef.current = multiModalTypeList
  }, [promptMode, multiModalTypeList])

  // 检查代码模式权限，如果当前是代码模式但没有权限，则切换到快速模式
  useEffect(() => {
    if (promptMode === "CODE" && !codeModePermission) {
      setPromptMode("BASIC")
      form.setFieldsValue({ promptMode: "BASIC" })
    }
  }, [codeModePermission, promptMode, form])

  // 初始化高级设置表单数据
  useEffect(() => {
    if (targetData) {
      // 基础数据初始化
      const baseFields = {
        promptMode: targetData.promptMode || "BASIC"
      }

      // 只有当后端明确返回 advancedSettingEnable 为 true 时，才打开高级设置
      const shouldEnableAdvanced = targetData.advancedSettingEnable === true

      const advancedSettingsFields = {
        advancedSettingEnable: shouldEnableAdvanced,
        topKEnable: targetData.topKEnable || false,
        topPEnable: targetData.topPEnable || false,
        maxTokenEnable: targetData.maxTokenEnable || false,
        seedEnable: targetData.seedEnable || false,
        responseFormatEnable: targetData.responseFormatEnable || false
      }

      // 设置具体的数值（只有在对应开关启用时才恢复具体数值）
      if (targetData.topKEnable && targetData.topK !== undefined) {
        advancedSettingsFields.topK = targetData.topK
      }
      // 优先使用新字段名，兼容旧字段名
      if (targetData.topPEnable) {
        if (targetData.topP !== undefined) {
          advancedSettingsFields.topP = targetData.topP
        } else if (targetData.top_p !== undefined) {
          advancedSettingsFields.topP = targetData.top_p
        }
      }
      if (targetData.maxTokenEnable && targetData.maxToken !== undefined) {
        advancedSettingsFields.maxToken = targetData.maxToken
      }
      if (targetData.seedEnable && targetData.seed !== undefined) {
        advancedSettingsFields.seed = targetData.seed
      }
      if (targetData.responseFormatEnable && targetData.responseFormat !== undefined) {
        advancedSettingsFields.responseFormat = targetData.responseFormat
      }

      // 处理推理程度字段的兼容性转换
      let reasoningEffortFields = {}
      if (targetData.reasoningEffort) {
        // 如果有新字段，直接使用
        reasoningEffortFields.reasoningEffort = targetData.reasoningEffort
      } else if (targetData.appendReasoning === true) {
        // 如果原来的开关是打开状态，默认选择高
        reasoningEffortFields.reasoningEffort = "high"
      } else {
        // 否则默认选择低
        reasoningEffortFields.reasoningEffort = "low"
      }

      // 初始化快速模式和专业模式的数据
      let quickModeFields = {}
      let professionalModeFields = {}
      let codeModeFields = {}

      if (promptMode === "BASIC") {
        //  targetData.promptMode === "BASIC"
        // 快速模式：从 inputParams 恢复 quickModeInputs
        if (targetData.inputParams && Array.isArray(targetData.inputParams)) {
          quickModeFields.quickModeInputs = targetData.inputParams.map((param) => ({
            modalType: param.tag?.modalType || param.modalType,
            variable: param.variableName
          }))
        }
      } else if (promptMode === "PROFESSIONAL") {
        //targetData.promptMode === "PROFESSIONAL"
        // 专业模式：从 professionalContents 恢复数据
        if (targetData.professionalContents && Array.isArray(targetData.professionalContents)) {
          // 分离系统消息和其他消息
          const systemMessage = targetData.professionalContents.find((msg) => msg.role === "system")
          const otherMessages = targetData.professionalContents.filter(
            (msg) => msg.role !== "system"
          )

          if (systemMessage) {
            professionalModeFields.systemMessage = systemMessage.content
          }

          // 处理其他消息
          const transformedMessages = otherMessages.map((msg) => {
            if (msg.enableMultiModal && msg.modals) {
              return {
                type: msg.role?.toUpperCase() || "USER",
                enableImage: true,
                imageInputs: msg.modals.map((modal) => ({
                  modalType: modal.type,
                  variable: modal.url
                }))
              }
            } else {
              return {
                type: msg.role?.toUpperCase() || "USER",
                enableImage: false,
                content: msg.content
              }
            }
          })

          if (transformedMessages.length > 0) {
            professionalModeFields.professionalContents = transformedMessages
          }
        }
      } else if (promptMode === "CODE") {
        // targetData.promptMode === "CODE"
        // 代码模式：从 script 字段恢复脚本数据（新的数据结构）
        if (targetData.script) {
          codeModeFields.script = targetData.script
        } else if (
          targetData.professionalContents &&
          Array.isArray(targetData.professionalContents)
        ) {
          // 兼容旧的数据结构：从 professionalContents 恢复脚本数据
          const scriptMessage = targetData.professionalContents.find(
            (msg) => msg.script !== undefined
          )
          if (scriptMessage) {
            codeModeFields.script = scriptMessage.script
          }
        }

        // 从 inputParams 恢复代码模式的输入参数
        if (targetData.inputParams && Array.isArray(targetData.inputParams)) {
          codeModeFields.codeInputParams = targetData.inputParams.map((param) => ({
            variableName: param.variableName,
            variableValueType: param.variableValueType,
            variableRequire: param.variableRequire || false,
            description: param.description || "",
            inputValue: param.inputValue
          }))
        }
      }

      // 合并所有字段
      const allFields = {
        ...baseFields,
        ...advancedSettingsFields,
        ...reasoningEffortFields,
        ...quickModeFields,
        ...professionalModeFields,
        ...codeModeFields
      }

      form.setFieldsValue(allFields)

      // 同步 promptMode 状态
      setPromptMode(targetData.promptMode || "BASIC")
    }
  }, [targetData, form])

  const moveOutput = (index, direction) => {
    form.setFieldsValue({
      outputParams: moveItem(form.getFieldValue("outputParams"), index, direction)
    })
  }

  return (
    <>
      <PreJudgment form={form} />
      <CustomDivider showTopLine={true}>基础设置</CustomDivider>
      <Row>
        <Col span={24}>
          <Form.Item
            name="label"
            label="组件名"
            tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
            rules={[{ required: true }]}
          >
            <Input placeholder="请输入组件名" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            layout="horizontal"
            label="按条件模型分流"
            tooltip={{
              icon: <InfoIcon />,
              title: "启用后，可按指定条件调用不同模型"
            }}
            name="enableMultiModel"
            valuePropName="checked"
          >
            <Switch size="small" />
          </Form.Item>
        </Col>
        <Col
          span={24}
          className={`relative${enableMultiModelValue ? " flex flex-col pb-[40px]" : ""}`}
        >
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.enableMultiModel !== currentValues.enableMultiModel
            }
          >
            {({ getFieldValue }) => {
              const isMultiModel = getFieldValue("enableMultiModel")
              return (
                <>
                  {isMultiModel && (
                    <Form.List name="modelList" initialValue={[{}]}>
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }, index) => (
                            <div key={key} className="w-[100%] flex items-start">
                              <div className="promptLineTag mr-[6px]">
                                <div className="promptElfTag">{index === 0 ? "IF" : "ELIF"}</div>
                              </div>
                              <div className="w-[calc(100%-64px)]">
                                <Form.Item
                                  {...restField}
                                  name={[name, "expression"]}
                                  rules={[{ required: true, message: "请输入groovy条件表达式" }]}
                                >
                                  <Input placeholder="请输入groovy条件表达式" />
                                </Form.Item>
                                <ModelTypeFormComponent
                                  noLabel
                                  nameKey="modelList"
                                  formKeys={[name]}
                                  modelOptions={modelOptions}
                                  reasoningEffortOptions={reasoningEffortOptions}
                                  targetData={targetData}
                                />
                              </div>
                              {fields.length > 1 && (
                                <MinusCircleOutlined
                                  className="mt-[10px] ml-2"
                                  onClick={() => remove(name)}
                                />
                              )}
                            </div>
                          ))}
                          <Form.Item className="absolute bottom-[-10px]">
                            <Button type="link" onClick={() => add()} icon={<PlusOutlined />}>
                              添加条件
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  )}
                  {isMultiModel ? (
                    <div className="w-[100%] flex items-start">
                      <div className="promptElfTag mt-[10px] mr-[6px]">ELSE</div>
                      <div className="w-[calc(100%-64px)]">
                        <ModelTypeFormComponent
                          noLabel
                          formKeys={["modelElse"]}
                          modelOptions={modelOptions}
                          reasoningEffortOptions={reasoningEffortOptions}
                          targetData={targetData}
                        />
                      </div>
                    </div>
                  ) : (
                    <ModelTypeFormComponent
                      modelOptions={modelOptions}
                      reasoningEffortOptions={reasoningEffortOptions}
                      targetData={targetData}
                    />
                  )}
                </>
              )
            }}
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            layout="horizontal"
            labelCol={{
              span: 2
            }}
            name="temperature"
            label="温度"
          >
            <Row gutter={[0, 0]}>
              <Col span={18}>
                <Form.Item noStyle name="temperature" initialValue={0.7}>
                  <Slider max={2} step={0.01} marks={marks} defaultValue={0.7} />
                </Form.Item>
              </Col>

              <Col span={5}>
                <Form.Item className="mr-0 pr-0" name="temperature" initialValue={0.7}>
                  <InputNumber
                    style={{ marginLeft: "20px", width: "100%" }}
                    min={0}
                    max={2}
                    step={0.01}
                    precision={2}
                    defaultValue={0.7}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
        </Col>

        <AdvanceSetting />
        <Divider className="!my-2 !mb-4" />
        {/* 快速和专业模式切换 */}
        <div>
          <Form.Item name="promptMode" label="" initialValue="BASIC">
            <Radio.Group
              value={promptMode}
              onChange={(e) => {
                const newMode = e.target.value
                setPromptMode(newMode)
                form.setFieldsValue({ promptMode: newMode })
              }}
            >
              <Radio value="BASIC">快速模式</Radio>
              <Radio value="PROFESSIONAL">专业模式</Radio>
              {codeModePermission && <Radio value="CODE">代码模式</Radio>}
            </Radio.Group>
          </Form.Item>
        </div>
      </Row>

      <div className="mb-6">
        {/* 根据模式显示不同的组件 */}
        {promptMode === "BASIC" ? (
          <QuickMode
            form={form}
            globalData={globalData}
            skillFlowData={skillFlowData}
            contentValue={contentValue}
            onMouseBlur={onMouseBlur}
            isDisabled={isDisabled}
            multiModalTypeList={multiModalTypeList}
            targetData={targetData}
          />
        ) : promptMode === "PROFESSIONAL" ? (
          <ProfessionalMode
            form={form}
            globalData={globalData}
            skillFlowData={skillFlowData}
            onMouseBlur={onMouseBlur}
            isDisabled={isDisabled}
            multiModalTypeList={multiModalTypeList}
            multiModalWarning={multiModalWarning}
          />
        ) : (
          <CodeMode
            form={form}
            globalData={globalData}
            skillFlowData={skillFlowData}
            contentValue={scriptValue}
            onMouseBlur={onMouseBlur}
            isDisabled={isDisabled}
            targetData={targetData}
          />
        )}
      </div>

      <Divider />

      {/* 输出参数部分 */}
      <CustomDivider showTopLine={false}>输出参数</CustomDivider>
      <Row gutter={[24, 8]}>
        <Col span={12}>
          <Form.Item
            layout="vertical"
            name="parseMethod"
            label="解析方式"
            className="mb-2"
            rules={[
              {
                required: true,
                message: "请选择解析方式"
              }
            ]}
          >
            <Select placeholder="请选择解析方式" onChange={handleParseMethodChange}>
              {outputType.map((method, i) => (
                <Select.Option key={i} value={method.code}>
                  {method.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            layout="vertical"
            name="outputName"
            label="输出变量名"
            className="mb-2"
            rules={[
              {
                required: true,
                message: "请输入"
              }
            ]}
          >
            <Input placeholder="请输入" />
          </Form.Item>
        </Col>
      </Row>
      <DndProvider backend={HTML5Backend}>
        {(parseMethod === "JSON" || parseMethod === "JSON_ARRAY") && (
          <>
            {outputs.map((output, index) => (
              <OutputParameter
                allowDelete={outputs.length > 1}
                key={index}
                index={index}
                id={output.id}
                parseMethod={parseMethod}
                deleteOutput={deleteOutput}
                addOutput={addOutput}
                parseTypes={parseTypes}
                moveOutput={moveOutput}
                isFirst={index === 0}
                isLast={index === outputs.length - 1}
                form={form}
              />
            ))}
            <Row>
              <Col span={24}>
                {!isDisabled && (
                  <Button
                    type="link"
                    onClick={addOutput}
                    style={{
                      paddingLeft: 24,
                      marginTop: 8
                    }}
                    icon={<PlusOutlined />}
                  >
                    添加
                  </Button>
                )}
              </Col>
            </Row>
          </>
        )}
      </DndProvider>
    </>
  )
}

export default PromptSettings
