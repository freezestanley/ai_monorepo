import { useEffect, useState } from "react"
import { Button, Card, Col, Empty, Form, Input, Row, Table, Tag, message } from "antd"
import { PlayCircleOutlined } from "@ant-design/icons"
import { EditableRow, EditableCell } from "../InputParams"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import { useDebugTool } from "@/api/pluginTool"
import ExpandableTextArea from "../ExpandableTextArea"

// 根据 record.variableValueType 和 record.list 递归构建默认值
const buildNodeValue = (node) => {
  const type = node?.variableValueType
  const list = node?.list || node.children

  if (["json", "array"].includes(type)) {
    if (Array.isArray(list) && list.length) {
      if (type === "json") {
        const obj = {}
        list.forEach((child) => {
          if (!child?.variableName) return
          obj[child.variableName] = buildNodeValue(child)
        })
        return obj
      } else {
        const item = {}
        list.forEach((child) => {
          if (!child?.variableName || !["json"].includes(child?.variableValueType)) return
          item[child.variableName] = buildNodeValue(child)
        })
        return Object.keys(item).length ? [item] : []
      }
    } else {
      // 没有子节点时，尝试解析默认值，否则给出空结构
      const fallback = type === "array" ? "[]" : "{}"
      const raw =
        typeof node?.defaultValue === "string" && node.defaultValue.trim()
          ? node.defaultValue
          : fallback
      try {
        return JSON.parse(raw)
      } catch (e) {
        return type === "array" ? [] : {}
      }
    }
  }
  // 基础类型按原样返回默认值（字符串形式）
  return node?.defaultValue
}

const buildInitialValue = (text, record) => {
  if (text || record?.defaultValue) return text || record?.defaultValue
  const type = record?.variableValueType
  const list = record?.list || record?.children

  if (["json", "array"].includes(type) && Array.isArray(list) && list.length) {
    try {
      const value = buildNodeValue(record)
      return JSON.stringify(value, null, 2)
    } catch (e) {
      if (type === "json") return record?.defaultValue || "{}"
      if (type === "array") return record?.defaultValue || "[]"
    }
  }
  return record?.defaultValue
}

const ValidateAndDebug = ({ form, inputVariables, pluginNo, toolNo, debugStatus }) => {
  const [dataSource, setDataSource] = useState([])
  const [debugInput, setDebugInput] = useState()
  const [debugOutput, setDebugOutput] = useState()

  const { mutate: debugTool } = useDebugTool()

  useEffect(() => {
    setDataSource(inputVariables)
  }, [inputVariables])
  const inputJsonString = debugInput ? `${jsonToMarkdown(debugInput)}` : ""
  const outputJsonString =
    debugOutput && typeof debugOutput === "string"
      ? debugOutput
      : typeof debugOutput === "object"
        ? `${jsonToMarkdown(debugOutput)}`
        : ""

  const extractKeys = (obj) => {
    let result = {}
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const innerObj = obj[key]
        // 获取当前行的参数类型
        const variableType = dataSource.find((item) => item.rowId === key)?.variableValueType

        for (let innerKey in innerObj) {
          if (innerObj.hasOwnProperty(innerKey)) {
            const value = innerObj[innerKey]
            // 如果是 string 类型且值不为空时才添加添加
            if (variableType === "string" && value) {
              result[innerKey] = value
            }
            // 非 string 类型，且值不为空时才添加
            else if (value !== undefined && value !== "") {
              try {
                // 尝试解析 JSON 格式的值
                if (typeof value === "string" && value.trim()) {
                  const parsedValue = JSON.parse(value)
                  result[innerKey] = parsedValue
                } else if (value !== null) {
                  result[innerKey] = value
                }
              } catch (e) {
                // 解析失败时使用原始值
                result[innerKey] = value
              }
            }
          }
        }
      }
    }
    return result
  }

  const components = {
    body: {
      row: (props) => <EditableRow {...props} form={form} />,
      cell: (props) => <EditableCell {...props} />
    }
  }

  const defaultColumns = [
    {
      title: "参数名称",
      dataIndex: "variableName",
      width: "120px"
    },
    {
      title: "参数类型",
      dataIndex: "variableValueType",
      width: "80px"
    },
    {
      title: "参数值",
      dataIndex: "variableValue",
      width: "200px",
      placeholder: "请输入参数值",
      render: (text, record) => {
        return (
          <Form.Item
            style={{
              margin: 0
            }}
            initialValue={buildInitialValue(text, record)}
            name={[record.rowId, record.variableName]}
            rules={[
              {
                required: record.variableRequire,
                message: "请输入参数值"
              }
            ]}
          >
            {["json", "array"].includes(record.variableValueType) ? (
              <ExpandableTextArea
                title="参数值"
                type={record.variableValueType}
                placeholder={`请输入参数值,${record.variableValueType}格式`}
                disabled={!record.isOpen}
                onChange={(val) => form.setFieldValue([record.rowId, record.variableName], val)}
              />
            ) : (
              <Input placeholder="请输入参数值" disabled={!record.isOpen} />
            )}
          </Form.Item>
        )
      }
    }
  ]

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        rowId: record.rowId,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        message: col.message,
        placeholder: col.placeholder,
        required: col.required
      })
    }
  })

  const handleRun = () => {
    form.validateFields().then(async (values) => {
      const submitData = extractKeys(values)
      console.log("submitData", values, submitData)
      setDebugInput(submitData)
      debugTool(
        {
          pluginNo,
          toolNo,
          params: submitData
        },
        {
          onSuccess: (e) => {
            if (e.success === true) {
              setDebugOutput(e.data.outPut)
              message.info(e.message)
            } else {
              setDebugOutput(e.message)
            }
          },
          onError: (e) => {
            message.error(e.message)
          }
        }
      )
    })
  }
  const { color: debugStatusColor, text: debugStatusText } = formatDebugStatus(debugStatus)
  return (
    <Row spellCheck={true} gutter={16} className="mb-2">
      <Col
        span={12}
        style={{
          justifyContent: "space-between",
          flexDirection: "column",
          display: "flex"
        }}
      >
        <Col span={24}>
          <h4 className="text-xl font-bold mb-3">4.1配置输入参数</h4>
          <Table
            components={components}
            rowClassName={() => "editable-row"}
            bordered
            pagination={false}
            dataSource={dataSource?.map((item) => ({
              ...item,
              list: item.children,
              children: undefined
            }))}
            columns={columns}
            rowKey="rowId"
          />
        </Col>
        <div className=" text-right">
          <Button icon={<PlayCircleOutlined />} className=" mb-8 mt-2" onClick={handleRun}>
            运行
          </Button>
        </div>
      </Col>
      <Col span={12} className="flex flex-col">
        <h4 className="text-xl font-bold mb-3">
          4.2调试结果{" "}
          <Tag bordered={false} color={debugStatusColor}>
            {debugStatusText}
          </Tag>
        </h4>
        <Card className=" overflow-auto" style={{ maxHeight: "calc(100vh - 340px)", flex: 1 }}>
          {inputJsonString || outputJsonString ? (
            <>
              <span>输入参数：</span>
              <MarkdownRenderer content={inputJsonString ?? ""} isLoading={false} />
              <br />
              <span>输出结果：</span>
              <MarkdownRenderer content={outputJsonString ?? ""} isLoading={false} />
            </>
          ) : (
            <Empty
              style={{ flex: 1 }}
              image={null}
              description={
                <span className=" text-gray-500">
                  调试结果将展示在此处，调试通过后，即可进入下一步
                </span>
              }
            />
          )}
        </Card>
      </Col>
    </Row>
  )
}

export default ValidateAndDebug

function jsonToMarkdown(json) {
  const markdown = JSON.stringify(json, null, 4)
  return "```json \n" + markdown
}

/**
 *
 * @param {*} debugStatus
 * noDebug、pass、failed
 */
function formatDebugStatus(debugStatus) {
  switch (debugStatus) {
    case "noDebug":
      return {
        text: "未调试",
        color: "processing"
      }
    case "pass":
      return {
        text: "调试通过",
        color: "success"
      }
    case "failed":
      return {
        text: "调试失败",
        color: "error"
      }
    default:
      return {
        text: "未调试",
        color: "processing"
      }
  }
}
