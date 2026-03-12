import { Form } from "antd"
import { useSkillFlowData } from "@/store"
import { useFetchGlobalVariable, useFetchSkillInfo } from "@/api/skill"

/**
 * useFormData钩子函数用于获取formData。
 * @returns {{form: Object, formData: Object[]}} - antd的form实例和格式化的表单数据。
 */
export const useFormData = (options) => {
  const { type } = options || {}
  const [form] = Form.useForm()
  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)
  const { data: currentSkillProcessData } = useFetchSkillInfo(skillFlowData?.skillNo)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  const values = form.getFieldsValue()

  const inputData = form.getFieldsValue()["inputParams"]
  let inputParams = Array.isArray(inputData) ? inputData : [inputData].filter(Boolean)

  // webhook, script输入项
  const inputItems = form.getFieldsValue()["inputItems"] || form.getFieldsValue()["inputArgs"]

  // webhook特殊处理逻辑
  if (inputItems?.filter((item) => item.inputParams).length > 0) {
    inputParams = inputItems.map((item) => item.inputParams)
  }
  // VideoGeneratorComponent特殊处理逻辑
  if (type === "VideoGeneratorComponent") {
    const videoInputItems = form.getFieldsValue()["fileUrl"]
    if (videoInputItems) {
      inputParams = [
        ...inputParams,
        ...(Array.isArray(videoInputItems) ? videoInputItems : [videoInputItems].filter(Boolean))
      ]
    }
  }

  if (values["sourceTag"]) {
    inputParams.push(values["sourceTag"])
  }

  // 添加appointCatalogNo（当catalogSetType为1时）
  if (values["catalogSetType"] === 1 && values["appointCatalogNo"]) {
    inputParams.push(values["appointCatalogNo"])
  }

  const formData = inputParams
    ?.map((item, index) => {
      const data = globalData?.find((g) => g.displayName === item)

      // 只有表单类型的工作流才需要具体的控件类型
      if (data?.formControlFacade && currentSkillProcessData.type === "2") {
        return data?.formControlFacade
      }

      const attributeName = inputItems ? inputItems[index]?.variableName : data?.variableName
      const variableValueType = inputItems
        ? inputItems[index]?.variableValueType
        : data?.variableValueType

      if (data?.formControlFacade && currentSkillProcessData.type === "2") {
        const formControlFacadeFix = Object.assign(data?.formControlFacade, {
          attributeName
        })
        return formControlFacadeFix
      }

      if (attributeName || data?.valueExpression) {
        return {
          controlType: "textarea",
          attributeName,
          title: data?.description || data?.displayName,
          placeholder: data?.description,
          valueExpression: data?.valueExpression,
          variableValueType
        }
      }
    })
    .filter(Boolean)

  return {
    form,
    formData
  }
}
