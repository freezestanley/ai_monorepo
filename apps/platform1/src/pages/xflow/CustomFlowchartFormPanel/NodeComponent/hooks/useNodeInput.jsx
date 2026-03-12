// hooks/useNodeInput.jsx
import { globalVariables } from "@/constants"
import { useState, useEffect, useRef } from "react"

export const useNodeInput = (form, targetData, fieldName = "inputArgs") => {
  const [inputs, setInputs] = useState([
    {
      id: Date.now(),
      inputSource: undefined,
      type: undefined,
      name: undefined,
      displayName: undefined,
      description: undefined
    }
  ])
  const [parseMethod, setParseMethod] = useState()
  const previousTargetDataRef = useRef(targetData)

  useEffect(() => {
    // 优先从表单中获取最新数据
    const formValues = form.getFieldsValue()
    const formFieldData = formValues[fieldName]

    // 获取 targetData 中的数据
    let targetFieldData = null
    if (fieldName === "codeInputParams") {
      targetFieldData = targetData?.inputParams
    } else {
      targetFieldData = targetData?.[fieldName]
    }

    // 检查数据一致性：比较数据条数
    const formDataCount = formFieldData && Array.isArray(formFieldData) ? formFieldData.length : 0
    const targetDataCount =
      targetFieldData && Array.isArray(targetFieldData) ? targetFieldData.length : 0

    // 如果表单中有数据，且与targetData数据条数一致，使用表单数据
    if (
      formFieldData &&
      Array.isArray(formFieldData) &&
      formFieldData.length > 0 &&
      formDataCount === targetDataCount
    ) {
      const validFormData = formFieldData.filter(
        (item) => item && (item.variableName || item.name) // 确保有有效的名称字段
      )

      if (validFormData.length > 0) {
        setInputs(
          validFormData.map((item) => ({
            ...item,
            id: item.id || Date.now() + Math.random()
          }))
        )
        return
      }
    }

    // 如果表单数据为空，或者与targetData不一致，使用targetData初始化
    if (targetFieldData && Array.isArray(targetFieldData)) {
      // 直接设置整个字段数组
      form.setFieldsValue({
        [fieldName]: targetFieldData
      })
      setInputs(
        targetFieldData.map((item) => ({ ...item, id: item.id || Date.now() + Math.random() }))
      )
    } else if (fieldName === "codeInputParams") {
      // 如果是代码模式但没有任何数据，初始化一个空项
      const defaultInput = {
        id: Date.now(),
        variableName: undefined,
        variableValueType: "string",
        description: undefined,
        inputValue: undefined
      }
      setInputs([defaultInput])
    }

    setParseMethod(targetData?.parseMethod)
    // 更新ref的值以存储当前的targetData
    previousTargetDataRef.current = targetData
  }, [targetData, form, fieldName])

  const addInput = () => {
    const newInput = {
      id: Date.now(),
      inputSource: undefined,
      type: undefined,
      name: undefined,
      displayName: undefined,
      description: undefined
    }

    if (fieldName === "codeInputParams") {
      newInput.variableName = undefined
      newInput.variableValueType = "string"
      newInput.inputValue = undefined
    }

    setInputs([...inputs, newInput])
  }

  const deleteInput = (index) => {
    const currentValues = form.getFieldsValue()
    const currentFieldData = currentValues[fieldName] || []
    const newInputs = [...currentFieldData]
    newInputs.splice(index, 1)

    // 更新本地状态
    const newInputsState = [...inputs]
    newInputsState.splice(index, 1)
    setInputs(newInputsState)

    // 更新表单值
    form.setFieldsValue({
      [fieldName]: newInputs
    })

    // 如果还需要处理 inputParams，保持兼容
    if (fieldName === "inputArgs") {
      const newInputParams = [...(currentValues.inputParams || [])]
      newInputParams.splice(index, 1)
      form.setFieldsValue({
        inputParams: newInputParams
      })
    }
  }

  const handleInputSourceChange = (value, index) => {
    let newInputs = [...inputs]
    newInputs[index].inputSource = value
    if (value === "全局变量") {
      newInputs[index].globalVariable = ""
    }
    setInputs(newInputs)
  }

  const handleGlobalVariableChange = (value, index) => {
    let newInputs = [...inputs]
    let globalVariable = globalVariables.find((variable) => variable.name === value)
    newInputs[index].globalVariable = globalVariable
    newInputs[index].name = globalVariable.fieldName
    newInputs[index].description = globalVariable.description
    setInputs(newInputs)
  }

  return {
    parseMethod,
    inputs,
    setInputs,
    addInput,
    deleteInput,
    handleInputSourceChange,
    handleGlobalVariableChange
  }
}
