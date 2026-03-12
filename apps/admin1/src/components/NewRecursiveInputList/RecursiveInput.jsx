import {
  PlusOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  MinusCircleOutlined
} from "@ant-design/icons"
import { Popconfirm, Row, Col, Input, Select, Form, Checkbox, Tooltip } from "antd"
import { useState } from "react"
import GlobalVariableSelect from "@/components/RecursiveInputList/GlobalVariableSelect"

const DescriptionInput = ({ data, name, onOperation, path }) => {
  console.log("path::", path)
  return (
    <Form.Item
      name={[name, ...path, "description"]}
      rules={[{ required: true, message: "请输入描述" }]}
    >
      <Input
        placeholder="描述"
        value={data.description}
        onChange={(e) => {
          onOperation("update", path, {
            updatedItem: { ...data, description: e.target.value }
          })
        }}
      />
    </Form.Item>
  )
}

const RecursiveInputCol = ({ data, onOperation, path, name }) => {
  return (
    <Col span={8}>
      <DescriptionInput name={name} data={data} onOperation={onOperation} path={path} />
    </Col>
  )
}

const RecursiveInput = ({
  data,
  onOperation,
  varOptions,
  needDescInput,
  depth = 0,
  path,
  parentType,
  name,
  index
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const isComplexType = data.variableType === "json" || data.variableType === "array"
  const showOperationBar = parentType === "array" && depth === 1

  const isStartNode = name === "inputParams"
  const isWebhookOutput = name === "outputParams"

  const onAddSibling = () => {
    onOperation("addSibling", path)
  }

  const onAddChild = () => {
    if (data.variableType === "json") {
      // 如果当前类型是 "json" 并且正在添加子项
      const newChild = {
        variableName: "",
        description: "",
        variableRequire: false,
        variableType: "string",
        children: []
      }

      // 清空 inputParams 并添加新的子项
      onOperation("update", path, {
        updatedItem: {
          ...data,
          inputParams: isStartNode ? data.inputParams : undefined, // 清空 inputParams
          children: [...(data.children || []), newChild]
        }
      })
    } else if (data.variableType === "array") {
      // 如果当前类型是 "array"，按原来的逻辑添加子项
      const newChild = {
        variableName: "",
        description: "",
        variableRequire: false,
        variableType: "string",
        children: []
      }
      onOperation("addChild", [...path, "children"], { newChild })
    }
  }

  const PlusButton = (index) => {
    console.log("index::::", index)
    if (data.variableType === "json" && index !== 0) {
      return (
        <Popconfirm
          title="您要添加什么？"
          onConfirm={onAddSibling}
          onCancel={onAddChild}
          okText="兄弟项"
          cancelText="子项"
        >
          <PlusOutlined style={{ marginRight: 3, marginLeft: -4 }} />
        </Popconfirm>
      )
    } else if ((data.variableType === "json" || data.variableType === "array") && index === 0) {
      return <PlusOutlined style={{ marginRight: 3, marginLeft: -4 }} onClick={onAddChild} />
    } else if (index === 0) {
      return null
    } else {
      return (
        <PlusOutlined
          style={{ marginRight: 3, marginLeft: -4 }}
          onClick={() => onOperation("addSibling", path)}
        />
      )
    }
  }

  const handleTypeChange = (selectedType) => {
    if (selectedType === "array" && (!data.children || data.children.length === 0)) {
      // 如果选择了array并且没有children，添加一个子项
      const newChild = {
        variableName: "",
        variableRequire: false,
        variableType: "string",
        children: []
      }
      onOperation("addChild", path, { newChild })
    } else if (data.children && data.children.length > 0 && selectedType !== "array") {
      // 如果选择的不是array并且有children，删除所有子项
      onOperation("update", path, {
        updatedItem: {
          ...data,
          variableType: selectedType,
          children: []
        }
      })
      return // 因为已经更新了整个项，所以返回防止重复更新
    }
    // 更新当前项的类型
    onOperation("update", path, {
      updatedItem: { ...data, variableType: selectedType }
    })
  }

  return (
    <div style={{ marginBottom: "16px", flex: 1 }}>
      <Row gutter={16}>
        <Col span={9}>
          {isComplexType &&
            (isExpanded ? (
              <CaretDownOutlined
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  zIndex: 999,
                  left: 12 * depth
                }}
                className={`absolute  top-2`}
              />
            ) : (
              <CaretRightOutlined
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  zIndex: 999,
                  left: 12 * depth
                }}
                className={`absolute  top-2`}
              />
            ))}
          <Form.Item
            name={[name, ...path, "variableName"]}
            rules={[{ required: true, message: "变量名是必填的" }]}
          >
            <Input
              style={{
                width: `${240 - depth * 15}px`,
                flex: "1",
                marginLeft: depth * 15 + 8
              }}
              placeholder="变量名"
              value={data.variableName}
              onChange={(e) => {
                onOperation("update", path, {
                  updatedItem: { ...data, variableName: e.target.value }
                })
              }}
            />
          </Form.Item>
        </Col>

        {isStartNode && (
          <Col span={1}>
            <Form.Item name={[name, ...path, "variableRequire"]}>
              <Tooltip title="是否必填">
                <Checkbox
                  checked={data.variableRequire}
                  onChange={(e) => {
                    onOperation("update", path, {
                      updatedItem: {
                        ...data,
                        variableRequire: e.target.checked
                      }
                    })
                  }}
                />
              </Tooltip>
            </Form.Item>
          </Col>
        )}

        <Col span={5}>
          <Form.Item
            name={[name, ...path, "variableType"]}
            rules={[{ required: true, message: "类型是必填的" }]}
          >
            <Select value={data.variableType} onChange={handleTypeChange} placeholder="选择类型">
              {varOptions.map((type) => (
                <Select.Option key={type.code} value={type.code}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <RecursiveInputCol
          isStartNode={isStartNode}
          needDescInput={needDescInput}
          isWebhookOutput={isWebhookOutput}
          data={data}
          onOperation={onOperation}
          path={path}
          name={name}
        />
        <Col span={2}>
          {/* {depth} */}
          {(!showOperationBar || data.variableType === "json") && PlusButton(index)}
          {index !== 0 && <MinusCircleOutlined onClick={() => onOperation("remove", path)} />}
        </Col>
      </Row>
      {isExpanded && isComplexType && data.children && (
        <div>
          {data.children.map((child, index) => (
            <RecursiveInput
              index={1}
              name={name} // 修改这里，将name作为基础，加上索引
              parentType={data.variableType}
              key={index}
              data={child}
              path={[...path, "children", index]}
              onOperation={onOperation}
              varOptions={varOptions}
              needDescInput={needDescInput}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RecursiveInput
