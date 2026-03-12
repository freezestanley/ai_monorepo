import { Form, Button } from "antd"
import { useCustomVariableType } from "../hooks"
import RecursiveInputList from "@/components/RecursiveInputList"
import { forwardRef, useEffect, useImperativeHandle } from "react"
import { useSkillFlowData } from "@/store"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"

function transformArray(data, isReverse = false) {
  return data.map((item) => {
    let newItem = {}

    if (!isReverse) {
      newItem.attributeName = item.variableName
      newItem.attributeType = item.variableValueType
      newItem.title = item.inputParams //newItem.tip = item.inputParams
      newItem.required = item.variableRequire
    } else {
      newItem.variableName = item.attributeName
      newItem.variableValueType = item.attributeType
      newItem.variableRequire = item.required
      newItem.inputParams = item.title || item.tip
    }

    const childKey = isReverse ? "children" : "children"
    if (item[childKey] && item[childKey].length) {
      newItem[childKey] = transformArray(item[childKey], isReverse)
    }

    return newItem
  })
}

const ApiForm = forwardRef(({ targetData, save, disabled }, ref) => {
  const [form] = Form.useForm()
  const { data: varOptions = [] } = useCustomVariableType()
  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (targetData) {
      const reversedData = transformArray(targetData.inputParams, true)
      console.log(reversedData)
      form.setFieldsValue({ inputParams: reversedData, ...reversedData })
    }
  }, [targetData, form])

  const onFinish = () => {
    return form.validateFields().then((values) => {
      console.log("Received values of form: ", values)
      const formControlDefinitions = transformArray(values.inputParams, false)
      console.log(formControlDefinitions)

      save(
        {
          ...skillFlowData,
          edges: skillFlowData?.flowDefinition?.graph?.edges,
          nodes: skillFlowData?.flowDefinition?.graph?.nodes,
          formControlDefinitions: { inputParams: formControlDefinitions }
        },
        () => {
          queryClient.invalidateQueries([QUERY_KEYS.GLOBAL_VARIABLE])
        }
      )
    })
  }

  useImperativeHandle(ref, () => ({
    onFinish
  }))

  return (
    <Form form={form} onFinish={onFinish} disabled={disabled}>
      {/* 这里假设你的数据结构起始有一个默认的条目，你可以根据需要进行调整 */}
      <Form.Item name="inputParams">
        <RecursiveInputList varOptions={varOptions} name={"inputParams"} />
      </Form.Item>
    </Form>
  )
})

export default ApiForm
