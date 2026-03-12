import { useEffect, useState } from "react"
import { Form, Select, Button, Col, Input } from "antd"
import { useFetchLlmModelType, useFetchOutputType } from "@/api/common"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import ParsingSpecificFields from "./components/ParsingSpecificFields"
import StreamOutput from "./components/StreamOutput"
import { CommonContent } from "../CommonContent"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"

// import { useHandleSave } from "./useSave"

const outputList = [
  {
    name: "普通输出",
    code: false
  },
  {
    name: "流式输出",
    code: true
  }
]

export default function EndNode({ targetData, appData, commandService }) {
  const { form } = useFormData()
  const [parsingMethod, setParsingMethod] = useState(null)
  const [, forceUpdate] = useState({})
  const [isDisabled] = useFormDisabled()

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)

  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)

  const { Option } = Select

  const onFinish = () => {
    return form.validateFields().then((values) => {
      console.log(values, "form values")
      const isText = values.outputType === "PLAIN_TEXT"
      let { outputParams, ...rest } = values

      const inputParams = values.inputItems
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
      if (inputParams?.length < 1 && rest.inputItems) {
        rest.inputItems = []
      }

      if (isText) {
        outputParams = [
          {
            inputParams: Array.isArray(values.outputParams)
              ? values.outputParams[0]
              : values.outputParams
          }
        ]
      }
      const params = {
        ...rest,
        inputParams,
        label: rest.componentName,
        outputParams: outputParams?.map((item) => {
          const currentGlobalData = globalData.find((g) => g.displayName === item.inputParams)
          console.log(currentGlobalData)
          return {
            variableName: isText ? currentGlobalData?.variableName : undefined,
            ...item,
            globalVariableNo: currentGlobalData?.globalVariableNo,
            variableSource: currentGlobalData?.variableSource,
            valueExpression: currentGlobalData?.valueExpression,
            variableValueType: currentGlobalData?.variableValueType
          }
        })
      }
      console.log(params)

      updateNodeComp({
        ...targetData,
        ...params,
        globalDataOptions: globalData,
        outputType: form.getFieldValue("stream") ? "PLAIN_TEXT" : form.getFieldValue("outputType")
      })
    })
  }

  useEffect(() => {
    setParsingMethod(targetData?.outputType)
    const isText = targetData?.outputType === "PLAIN_TEXT"

    if (isText) {
      targetData.outputParams = Array.isArray(targetData?.outputParams)
        ? targetData.outputParams.map((item) => item.inputParams)
        : undefined
    }
    form.setFieldsValue({
      ...targetData,
      componentName: targetData.label
    })
  }, [targetData, form])

  const { data: outputType = [] } = useFetchOutputType("END")
  useSaveShortcut(onFinish, isLoading)

  return (
    <div className="rounded h-full">
      <Form
        onFinish={onFinish}
        form={form}
        disabled={isDisabled}
        className="h-full"
        layout="vertical"
      >
        <CommonContent
          title={"输出"}
          isLoading={isLoading}
          disabled={isLocked}
          onFinish={onFinish}
          showDebuggerButton={false}
          showHeaderLine={true}
        >
          <>
            <Form.Item
              name="componentName"
              label="组件名"
              tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
              rules={[{ required: true, message: "请输入组件名" }]}
            >
              <Input placeholder="请输入组件名" />
            </Form.Item>
            <Form.Item
              label="输出方式"
              name="stream"
              rules={[{ required: true, message: "请选择输出方式!" }]}
              initialValue={false}
            >
              <Select
                defaultValue={false}
                placeholder="选择输出方式"
                onChange={(value) => {
                  forceUpdate({})
                }}
              >
                {outputList?.map((type, index) => (
                  <Option key={index} value={type.code}>
                    {type.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {!form.getFieldValue("stream") ? (
              <>
                <Form.Item
                  label="解析方式"
                  name="outputType"
                  rules={[{ required: true, message: "请选择解析方式!" }]}
                >
                  <Select
                    placeholder="选择解析方式"
                    onChange={(value) => {
                      setParsingMethod(value)
                      // 清除outputParams
                      form.setFieldsValue({ outputParams: undefined })
                    }}
                  >
                    {outputType?.map((type) => (
                      <Option key={type.code} value={type.code}>
                        {type.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <ParsingSpecificFields
                  parsingMethod={parsingMethod}
                  globalData={globalData}
                  form={form}
                  disabled={isDisabled}
                />
              </>
            ) : (
              <StreamOutput globalData={globalData} disabled={isDisabled} form={form} />
            )}
          </>
        </CommonContent>
      </Form>
    </div>
  )
}
