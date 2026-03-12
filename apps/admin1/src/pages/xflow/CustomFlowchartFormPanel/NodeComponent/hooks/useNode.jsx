// hooks/useNode.js
import { globalVariables } from "@/constants"
import { useState, useEffect } from "react"

export const useNode = (form, targetData) => {
  const [inputs, setInputs] = useState(targetData?.inputParams || [{ id: Date.now() }])
  const [outputs, setOutputs] = useState([])
  const [parseMethod, setParseMethod] = useState()
  const [_, forceUpdate] = useState({})

  useEffect(() => {
    if (targetData.inputParams) {
      targetData.inputParams.forEach((input, index) => {
        form.setFieldsValue({
          [`inputParams[${index}].attributeType`]: input.attributeType,
          [`inputParams[${index}].controlType`]: input.controlType,
          [`inputParams[${index}].required`]: input.required,
          [`inputParams[${index}].attributeName`]: input.attributeName,
          [`inputParams[${index}].displayName`]: input.title,
          [`inputParams[${index}].description`]: input.description
        })
      })
      setInputs(targetData.inputParams.length > 0 ? targetData.inputParams : [{}])
    }
    form.setFieldsValue(targetData)
    forceUpdate({})
  }, [targetData, form])

  const addInput = (item, index) => {
    console.log(item, index)
    // Create the new input data
    const newInput = {
      id: Date.now(),
      type: undefined,
      name: undefined,
      displayName: undefined,
      description: undefined
    }
    const inputsForm = form.getFieldsValue().inputParams || []

    // Split the array into two parts: before and after the index
    const firstPart = inputsForm.slice(0, index + 1) // slice from start up to and including the index
    const secondPart = inputsForm.slice(index + 1) // slice from index + 1 to the end

    // Concatenate the first part, new input, and the second part to get the updated inputs
    const d = [...firstPart, newInput, ...secondPart]
    console.log(d)
    setInputs(d)
    form.setFieldsValue({
      inputParams: d
    })

    d.forEach((input, index) => {
      form.setFieldsValue({
        [`inputParams[${index}].attributeType`]: input.attributeType,
        [`inputParams[${index}].controlType`]: input.controlType,
        [`inputParams[${index}].required`]: input.required,
        [`inputParams[${index}].attributeName`]: input.attributeName,
        [`inputParams[${index}].displayName`]: input.title,
        [`inputParams[${index}].description`]: input.description
      })
    })
    forceUpdate({})
  }

  const deleteInput = (id, index) => {
    //根据index 进行删除
    const newInputs = [...inputs]
    newInputs.splice(index, 1)
    setInputs(newInputs)
    const allFormValues = form.getFieldsValue()
    allFormValues.inputParams.splice(index, 1)
    form.setFieldsValue(allFormValues)
    allFormValues.inputParams.forEach((input, index) => {
      form.setFieldsValue({
        [`inputParams[${index}].attributeType`]: input.attributeType,
        [`inputParams[${index}].controlType`]: input.controlType,
        [`inputParams[${index}].required`]: input.required,
        [`inputParams[${index}].attributeName`]: input.attributeName,
        [`inputParams[${index}].displayName`]: input.title,
        [`inputParams[${index}].description`]: input.description
      })
    })
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
    setOutputs([...outputs, { type: "", name: "", description: "" }])
  }

  const deleteOutput = (id) => {
    const newOutputs = outputs.filter((output) => output.id !== id)
    setOutputs(newOutputs)
    const allFormValues = form.getFieldsValue()
    allFormValues.outputParams = allFormValues.outputParams.filter((output) => output.id !== id)
    form.setFieldsValue(allFormValues)
  }

  const handleParseMethodChange = (value) => {
    setParseMethod(value)
    if (value === "json") {
      setOutputs([{ type: "", name: "", description: "" }])
    } else {
      setOutputs([{ type: "", name: "", description: "" }])
      form.setFieldsValue({
        outputParams: [{ type: "", name: "", description: "" }]
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
    handleGlobalVariableChange,
    addOutput,
    deleteOutput,
    setOutputs
  }
}
