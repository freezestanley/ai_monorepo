import { PlusOutlined, CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons"
import { Popconfirm, Row, Col, Input, Select, Form, Checkbox } from "antd"
import { useState } from "react"
import GlobalVariableSelect from "@/components/RecursiveInputList/GlobalVariableSelect"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { DeleteIcon } from "../FormIcon"
import "./index.scss"

const RecursiveInputCol = ({
  isStartNode,
  isDisabled,
  needDescInput,
  isWebhookOutput,
  data,
  onOperation,
  path,
  name,
  onChangeSelect
}) => {
  if (isWebhookOutput && needDescInput !== true) return null
  const disableGlobalVariableSelect =
    (data.variableValueType === "json" || data.variableValueType === "array") &&
    data.children &&
    data.children.length > 0

  return (
    <Col span={isStartNode ? 6 : needDescInput ? 8 : 6}>
      {(isStartNode || needDescInput) && (
        <Form.Item
          name={[name, ...path, "inputParams"]}
          rules={[{ required: true, message: "请输入描述" }]}
        >
          <Input
            placeholder="描述"
            value={data.inputParams}
            onChange={(e) => {
              onOperation("update", path, {
                updatedItem: { ...data, inputParams: e.target.value }
              })
            }}
          />
        </Form.Item>
      )}
      {!isStartNode && needDescInput !== true && (
        <GlobalVariableSelect
          isTag={true}
          disabled={disableGlobalVariableSelect || isDisabled}
          required={false}
          formName={[name, ...path, "inputParams"]}
          multiple={false}
          onChange={onChangeSelect}
        />
      )}
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
  index,
  len,
  form
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const isComplexType = data.variableValueType === "json" || data.variableValueType === "array"
  const showOperationBar = parentType === "array" && depth === 1
  const [isDisabled] = useFormDisabled()

  const isStartNode = name === "inputParams"
  const isWebhookOutput = name === "outputParams"

  const onAddSibling = () => {
    onOperation("addSibling", path)
  }

  const onAddChild = () => {
    if (data.variableValueType === "json") {
      // 如果当前类型是 "json" 并且正在添加子项
      const newChild = {
        variableName: "",
        variableRequire: false,
        variableValueType: "string",
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
    } else if (data.variableValueType === "array") {
      // 如果当前类型是 "array"，按原来的逻辑添加子项
      const newChild = {
        variableName: "",
        variableRequire: false,
        variableValueType: "string",
        children: []
      }
      onOperation("addChild", [...path, "children"], { newChild })
    }
  }

  const PlusButton = () => {
    if (data.variableValueType === "json") {
      return (
        <Popconfirm
          title="您要添加什么？"
          onConfirm={onAddSibling}
          onCancel={onAddChild}
          okText="兄弟项"
          cancelText="子项"
        >
          <PlusOutlined style={{ marginRight: 8 }} />
        </Popconfirm>
      )
    } else {
      return (
        <PlusOutlined style={{ marginRight: 8 }} onClick={() => onOperation("addSibling", path)} />
      )
    }
  }

  const handleTypeChange = (selectedType) => {
    if (selectedType === "array" && (!data.children || data.children.length === 0)) {
      // 如果选择了array并且没有children，添加一个子项
      const newChild = {
        variableName: "",
        variableRequire: false,
        variableValueType: "string",
        children: []
      }
      onOperation("addChild", path, { newChild })
    } else if (data.children && data.children.length > 0 && selectedType !== "array") {
      // 如果选择的不是array并且有children，删除所有子项
      onOperation("update", path, {
        updatedItem: {
          ...data,
          variableValueType: selectedType,
          children: []
        }
      })
      return // 因为已经更新了整个项，所以返回防止重复更新
    }
    // 更新当前项的类型
    onOperation("update", path, {
      updatedItem: { ...data, variableValueType: selectedType }
    })
  }

  // 修改缩进计算
  const baseIndent = 24
  const indentWith = depth * baseIndent

  return (
    <div style={{ marginBottom: "0px", flex: 1 }}>
      <Row gutter={8} align="top">
        <Col
          style={{
            display: "flex",
            paddingLeft: indentWith,
            width: depth * 24,
            justifyContent: "flex-end"
          }}
        >
          {isComplexType && (
            <div
              style={{
                width: 24,
                display: "flex",
                alignItems: "center",
                marginTop: 8
              }}
            >
              {isExpanded ? (
                <CaretDownOutlined
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <CaretRightOutlined
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{ cursor: "pointer" }}
                />
              )}
            </div>
          )}
        </Col>
        <Col style={{ flex: 1 }}>
          {/* 主要内容区域 */}
          <div style={{ display: "flex", flex: 1, alignItems: "flex-start" }}>
            {isStartNode && (
              <Form.Item
                name={[name, ...path, "variableRequire"]}
                style={{
                  width: "65px",
                  marginBottom: 0,
                  marginRight: 8
                }}
              >
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
                >
                  必填
                </Checkbox>
              </Form.Item>
            )}
            <Form.Item
              name={[name, ...path, "variableName"]}
              rules={[{ required: true, message: "变量名是必填的" }]}
              style={{
                marginBottom: 8,
                flex: 1
              }}
            >
              <Input
                style={{
                  width: "100%"
                }}
                placeholder="变量名"
                value={data.variableName}
                onChange={(e) => {
                  onOperation("update", path, {
                    updatedItem: { ...data, variableName: e.target.value }
                  })
                }}
                addonAfter={
                  <Form.Item
                    name={[name, ...path, "variableValueType"]}
                    rules={[{ required: true, message: "类型是必填的" }]}
                    noStyle
                  >
                    <Select
                      className={"variableTypeSelect"}
                      value={data.variableValueType}
                      onChange={handleTypeChange}
                      placeholder="选择类型"
                      style={{ width: 84 }}
                    >
                      {varOptions.map((type) => (
                        <Select.Option key={type.code} value={type.code}>
                          {type.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                }
              />
            </Form.Item>
          </div>
        </Col>

        <RecursiveInputCol
          isStartNode={isStartNode}
          isDisabled={isDisabled}
          needDescInput={needDescInput}
          isWebhookOutput={isWebhookOutput}
          data={data}
          onOperation={onOperation}
          path={path}
          name={name}
          onChangeSelect={(value, options) => {
            if (!form) return
            const { variableValueType } = form.getFieldValue([name, ...path]) || {}
            const curData = options?.find((v) => v.displayName === value)
            curData?.variableValueType &&
              curData?.variableValueType !== variableValueType &&
              form.setFieldValue([name, ...path, "variableValueType"], curData.variableValueType)
          }}
        />
        <Col
          style={{ width: "45px", paddingRight: 0, paddingTop: 4, marginLeft: 8, paddingLeft: 0 }}
        >
          {(!showOperationBar || data.variableValueType === "json") && !isDisabled && PlusButton()}
          {!(depth === 0 && index === 0 && len === 1) && !isDisabled && (
            <DeleteIcon onClick={() => onOperation("remove", path)} />
          )}
        </Col>
      </Row>
      {isExpanded && isComplexType && data.children && (
        <div>
          {data.children.map((child, index) => (
            <RecursiveInput
              key={index}
              index={index}
              form={form}
              name={name}
              parentType={data.variableValueType}
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
