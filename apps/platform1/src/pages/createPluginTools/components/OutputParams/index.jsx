import React, { useState, useEffect, useImperativeHandle } from "react"
import { Button, Checkbox, Col, Form, Input, Popconfirm, Select, Table } from "antd"
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import { outputFieldTypeOptions } from "./../../constants"
import { Title } from "../InputParams"
import { getRandomString } from "@/utils"
import { TableObjectPro } from "@/components/TableObjectPro"

const OutputParams = ({ form, outputVariables, toolType, disabled }, ref) => {
  const [dataSource, setDataSource] = useState([])
  const [inputTableData, setInputTableData] = useState({})
  const [submitKey, setSubmitKey] = useState("")
  useEffect(() => {
    const defaultData = [
      {
        variableName: "",
        variableDesc: "",
        variableRequire: true,
        variableValueType: "String",
        key: "0-0-0",
        parentKey: "0-0"
      }
    ]
    setDataSource(outputVariables.length ? assignKey(outputVariables) : defaultData)
  }, [outputVariables])

  useImperativeHandle(ref, () => ({
    getValues: () => {
      setSubmitKey(Math.random() + "")
      return inputTableData
    }
  }))

  return (
    <div>
      <h4
        onClick={() => {
          console.log(dataSource)
        }}
        className="text-xl font-bold mb-3"
      >
        配置输出参数
      </h4>
      <TableObjectPro
        form={form}
        onChangeData={(treeData) => {
          setInputTableData(treeData)
        }}
        onSubmit={(treeData, formData) => {
          console.log(treeData)
        }}
        editabled={!disabled}
        submitKey={submitKey}
        dataSource={dataSource}
        toolType={toolType}
      />
    </div>
  )
}

export default React.forwardRef(OutputParams)

function isComplexType(type) {
  return ["json", "array"].includes(type)
}

function assignKey(jsonData) {
  jsonData.forEach((item) => {
    item.key = item.key ?? getRandomString()

    if (item.children && item.children.length > 0) {
      assignKey(item.children)
    }
  })
  return jsonData
}
