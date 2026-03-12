import React, { useState } from "react"
import { Form, Tabs } from "antd"
import { isFunction } from "lodash"
import DynamicFormComponent from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/DynamicFormComponent"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/index.scss"
import { useCurrentSkillLockInfo } from "@/store/index"
import { useFetchGlobalVariable } from "@/api/skill"
import { useFormData } from "../../hooks/useInputFormData"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { useCustomVariableType } from "../../hooks"
import { CommonContent } from "../CommonContent"
import { formatSessionParams } from "./utils"
import PromptSettings from "./PromptSettings"
import DynamicFormList from "./DynamicFormList"
import FallbackHandler from "./FallbackHandler"

const { TabPane } = Tabs

const NodeComponent = React.memo(({ targetData, appData, commandService }) => {
  const { form } = useFormData()
  const [_, forceUpdate] = useState({})
  const [debugData, setDebugData] = useState([])
  const [forceShowDebugButton, setForceShowDebugButton] = useState(false)

  const [multiModalWarning, setMultiModalWarning] = useState("")

  const { data: varOptions = [] } = useCustomVariableType()

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)

  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  const onFinish = (callback = () => {}, noMessage = false) => {
    const callbackFunc = isFunction(callback) ? callback : () => {}
    return form.validateFields().then((values) => {
      const {
        outputParams,
        advancedSettingEnable,
        topKEnable,
        topPEnable,
        maxTokenEnable,
        seedEnable,
        responseFormatEnable,
        responseFormat,
        topK,
        topP,
        maxToken,
        seed,
        promptMode,
        quickModeInputs,
        professionalContents,
        systemMessage,
        script,
        codeInputParams,
        reasoningEffort,
        ...rest
      } = values

      // 处理 inputParams - 只有快速模式并且有输入项时才处理
      let inputParams = []
      if (promptMode === "BASIC" && quickModeInputs) {
        inputParams = quickModeInputs
          ?.map(({ variable, modalType }) => {
            if (variable && modalType) {
              return {
                variableName: variable,
                variableValueType: "string",
                variableRequire: false,
                tag: {
                  modalType: modalType.toUpperCase() // 确保大写
                }
              }
            }
          })
          .filter((item) => item)
      } else if (promptMode === "CODE" && codeInputParams) {
        // 处理代码模式的输入参数
        inputParams = codeInputParams
          ?.map((param) => {
            if (param.variableName && param.variableValueType) {
              const result = {
                variableName: param.variableName,
                variableValueType: param.variableValueType,
                variableRequire: param.variableRequire || false,
                description: param.description || "",
                inputValue: param.inputValue, // 保留输入值
                valueExpression: param.valueExpression // 保留取值表达式
              }
              return result
            } else {
              return null
            }
          })
          .filter((item) => item)
      } else if (values.inputItems) {
        // 兼容旧的 inputItems 结构
        inputParams = values.inputItems
          ?.map(({ variableName, modalType }) => {
            if (variableName && modalType) {
              return {
                variableName,
                variableValueType: "string",
                variableRequire: false,
                tag: {
                  modalType
                }
              }
            }
          })
          .filter((item) => item)
      }

      if (inputParams?.length < 1 && rest.inputItems) {
        rest.inputItems = []
      }

      // 处理专业模式的消息结构
      let professionalModeData = null
      if (promptMode === "PROFESSIONAL") {
        const messages = []

        // 添加系统消息
        if (systemMessage) {
          messages.push({
            role: "system",
            enableMultiModal: false,
            content: systemMessage
          })
        }

        // 处理动态消息
        if (professionalContents && Array.isArray(professionalContents)) {
          professionalContents.forEach((msg) => {
            // 检查是否为禁用的多模态配置
            const isMultiModalDisabled = !!multiModalWarning && msg.enableImage

            if (
              msg.enableImage &&
              msg.imageInputs &&
              Array.isArray(msg.imageInputs) &&
              !isMultiModalDisabled
            ) {
              // 启用了图片且当前模型支持多模态的消息
              messages.push({
                role: msg.type?.toLowerCase() || "user",
                enableMultiModal: true,
                modals: msg.imageInputs.map((input) => ({
                  type: input.modalType?.toUpperCase() || "IMAGE",
                  url: input.variable
                }))
              })
            } else if (msg.content) {
              // 普通文本消息（包括原本的文本消息和被禁用的多模态消息转换为文本）
              messages.push({
                role: msg.type?.toLowerCase() || "user",
                enableMultiModal: false,
                content: msg.content
              })
            } else if (isMultiModalDisabled && !msg.content) {
              // 如果是禁用的多模态消息且没有文本内容，跳过此消息
              // 这种情况下不添加任何消息到数组中
              console.log("跳过禁用的多模态消息:", msg)
            }
          })
        }

        professionalModeData = messages
      }

      // 处理代码模式的数据结构 - script与professionalContents平级
      if (promptMode === "CODE") {
        professionalModeData = [] // 代码模式时传空数组
      }

      const session = formatSessionParams(globalData, values.sessions)

      // 构建高级设置参数
      const advancedSettings = {
        advancedSettingEnable: advancedSettingEnable || false,
        topKEnable: topKEnable || false,
        topPEnable: topPEnable || false,
        maxTokenEnable: maxTokenEnable || false,
        seedEnable: seedEnable || false,
        responseFormatEnable: responseFormatEnable || false
      }

      // 如果所有子开关都关闭，则自动关闭高级设置主开关
      const hasAnySubToggleEnabled =
        advancedSettings.topKEnable ||
        advancedSettings.topPEnable ||
        advancedSettings.maxTokenEnable ||
        advancedSettings.seedEnable ||
        advancedSettings.responseFormatEnable

      if (!hasAnySubToggleEnabled) {
        advancedSettings.advancedSettingEnable = false
      }

      // 传递具体值（只有在对应开关启用时才传递）
      if (topKEnable && topK !== undefined) {
        advancedSettings.topK = Number(topK)
      }
      if (topPEnable && topP !== undefined) {
        advancedSettings.topP = Number(topP)
        // 兼容原来的字段名
        advancedSettings.top_p = Number(topP)
      }
      if (maxTokenEnable && maxToken !== undefined) {
        advancedSettings.maxToken = Number(maxToken)
      }
      if (seedEnable && seed !== undefined) {
        // seed 可能是流程变量名（字符串）或数字，保持原始类型
        advancedSettings.seed = seed
      }
      if (responseFormatEnable && responseFormat !== undefined) {
        advancedSettings.responseFormat = responseFormat
      }

      const formattedValues = {
        ...rest,
        ...advancedSettings,
        outputParams,
        session, // 提交参数使用
        promptMode,
        reasoningEffort // 添加推理程度字段
      }

      // 根据模式添加对应的数据
      if (promptMode === "PROFESSIONAL" && professionalModeData) {
        formattedValues.professionalContents = professionalModeData
      } else if (promptMode === "CODE") {
        // 代码模式：script与professionalContents平级
        formattedValues.professionalContents = [] // 空数组
        formattedValues.script = script || "" // 确保script字段总是存在
      }

      updateNodeComp(
        {
          ...targetData,
          ...formattedValues,
          inputParams,
          globalDataOptions: globalData
        },
        callbackFunc,
        noMessage
      )
      forceUpdate({})
    })
  }

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  useSaveShortcut(onFinish, isLoading)

  return (
    <div className={`prompt-node-wrapper`}>
      <div className="base-node-comp">
        <Form form={form} onFinish={onFinish} disabled={isDisabled} layout="vertical">
          <CommonContent
            title={"Prompt组件"}
            containerClass="noPadding"
            isLoading={isLoading}
            disabled={isLocked}
            onFinish={onFinish}
          >
            <Tabs defaultActiveKey="1" type="line">
              <TabPane tab="组件设置" key="1" forceRender>
                <PromptSettings
                  isDisabled={isDisabled}
                  form={form}
                  targetData={targetData}
                  skillFlowData={skillFlowData}
                  globalData={globalData}
                  multiModalWarning={multiModalWarning}
                  setMultiModalWarning={setMultiModalWarning}
                  setForceShowDebugButton={setForceShowDebugButton}
                  setDebugData={setDebugData}
                />
              </TabPane>
              <TabPane tab="后置处理" key="2" forceRender>
                <DynamicFormList form={form} varOptions={varOptions} />
              </TabPane>
              <TabPane tab="兜底处理" key="3" forceRender>
                <FallbackHandler
                  form={form}
                  varOptions={varOptions}
                  botNo={skillFlowData?.botNo}
                  skillNo={skillFlowData?.skillNo}
                  nodeType="prompt-node"
                />
              </TabPane>
            </Tabs>
          </CommonContent>
        </Form>
      </div>
      <div className={`debug-panel`}>
        <DynamicFormComponent
          onFinish={onFinish}
          nodeId={targetData.id}
          preview={false}
          formData={debugData}
          isProcess={false}
          forceShowDebugButton={forceShowDebugButton}
        />
      </div>
    </div>
  )
})

export default NodeComponent
