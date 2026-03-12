// hooks/useNode.js
import { globalVariables } from "@/constants"
import { isEqual } from "lodash"
import { useState, useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"

export const useNode = (form, targetData, initialData) => {
  const [inputs, setInputs] = useState(
    initialData
      ? initialData
      : [
          {
            id: Date.now(),
            inputSource: undefined,
            type: undefined,
            name: undefined,
            displayName: undefined,
            description: undefined
          }
        ]
  )
  const [outputs, setOutputs] = useState([])
  const [parseMethod, setParseMethod] = useState()
  const previousTargetDataRef = useRef(targetData)

  useEffect(() => {
    if (JSON.stringify(previousTargetDataRef.current) !== JSON.stringify(targetData)) {
      if (targetData.outputParams) {
        targetData.outputParams.forEach((output, index) => {
          form.setFieldsValue({
            [`outputParams[${index}].name`]: output.name,
            [`outputParams[${index}].type`]: output.type,
            [`outputParams[${index}].description`]: output.description
          })
        })
        setOutputs(targetData.outputParams)
      }
      // 更新ref的值以存储当前的targetData
      previousTargetDataRef.current = targetData
    }
    if (targetData.outputParams) {
      targetData.outputParams.forEach((output, index) => {
        form.setFieldsValue({
          [`outputParams[${index}].name`]: output.name,
          [`outputParams[${index}].type`]: output.type,
          [`outputParams[${index}].description`]: output.description
        })
      })
      setOutputs(targetData.outputParams)
    }

    setParseMethod(targetData.parseMethod)
    form.setFieldsValue(targetData)
    // handleParseMethodChange(targetData.parseMethod)
  }, [targetData, form])

  const addInput = () => {
    setInputs([
      ...inputs,
      {
        id: Date.now(),
        inputSource: undefined,
        type: undefined,
        name: undefined,
        displayName: undefined,
        description: undefined
      }
    ])
  }

  const deleteInput = (id, index) => {
    setInputs(inputs.filter((input) => input.id !== id))
    const allFormValues = form.getFieldsValue()
    allFormValues.inputParams.splice(index, 1) // 使用 splice 方法替代 delete 操作符
    form.setFieldsValue(allFormValues)
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

  const addOutput = () => {
    setOutputs([...outputs, { type: "", name: "", description: "", id: uuidv4() }])
  }

  const deleteOutput = (index) => {
    const newOutputs = [...form.getFieldsValue().outputParams]
    newOutputs.splice(index, 1)
    setOutputs(newOutputs)
    console.log(newOutputs, form.getFieldsValue())
    form.setFieldsValue({
      outputParams: newOutputs
    })
  }

  const handleParseMethodChange = (value) => {
    setParseMethod(value)
    if (value === "JSON" || value === "JSON_ARRAY") {
      setOutputs([{ type: "", name: "", description: "", id: uuidv4() }])
    } else {
      setOutputs([{ type: "", name: "", description: "", id: uuidv4() }])
      form.setFieldsValue({
        outputParams: [{ type: "", name: "", description: "", id: uuidv4() }]
      })
    }
  }

  return {
    handleParseMethodChange,
    parseMethod,
    inputs,
    outputs,
    addInput,
    deleteInput,
    handleInputSourceChange,
    handleGlobalVariableChange,
    addOutput,
    deleteOutput,
    setOutputs
  }
}
