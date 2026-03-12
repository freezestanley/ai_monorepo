import { useEffect, useState } from "react"
import { Form, Input, InputNumber, Select, Row, Col, Button, Divider, Space, Tabs } from "antd"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useComponentAndDebugPanel, useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons"
import { useFetchStructureDatasetListByBotNo } from "@/api/structureKnowledge"
import { useCustomVariableType } from "../../hooks"
import { formatSessionParams } from "./utils"
import PreJudgment from "./components/PreJudgment"
import DynamicFormList from "./DynamicFormList"
import CustomDivider from "@/components/CustomDivider"
import { AddIcon, DeleteIcon } from "@/components/FormIcon"

const TabPane = Tabs.TabPane

const QueryDatasetComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})
  const [selectedVariables, setSelectedVariables] = useState([])

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  /**
   * 拉取数据集列表
   */
  const { data: dataSetList = [] } = useFetchStructureDatasetListByBotNo({
    botNo: skillFlowData?.botNo
  })
  /**
   * 适配一下数据集选项
   */
  const dateSetListOptions = dataSetList?.map((field) => ({
    label: field.name,
    key: field.structureNo,
    value: field.structureNo
  }))

  const [variableFiled, setVariableFiled] = useState([])
  /**
   * 适配一下变量选项
   */
  const variableFiledOptions = variableFiled.map((field) => ({
    ...field,
    label: field.name,
    value: field.key
  }))

  const handleVariableChange = (value, fieldIndex) => {
    const updatedSelectedVariables = [...selectedVariables]
    const variable = variableFiledOptions.find((variableFiled) => variableFiled.value === value)

    updatedSelectedVariables[fieldIndex] = {
      ...variable,
      operationTypes: variable?.operationTypes ?? []
    }

    setSelectedVariables(updatedSelectedVariables)
    form.setFieldsValue({ items: { [fieldIndex]: { operation: undefined } } })
  }

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  const generateDebugData = () => {
    const inputItems = form.getFieldValue("items") || []
    form.setFieldsValue({
      inputParams: inputItems.map((item) => {
        return item.valueExpression
      })
    })
    forceUpdate({})
  }
  /**
   * 监听数据集选择的改变
   * @param {*} value
   */
  const onDataSetChange = (value) => {
    const dataSet = dataSetList?.filter((item) => item.structureNo === value)
    setVariableFiled((prev) => {
      if (prev.length > 0) {
        form.setFieldsValue({ items: [{}] })
      }
      return dataSet?.[0]?.strategies ?? []
    })
  }

  const getSelectedVariablesFromTargetData = (items) => {
    const newItems = items?.map((item) => {
      const variable = variableFiledOptions?.find((variableFiled) => variableFiled.key === item.key)
      return {
        ...variable,
        operationTypes: variable?.operationTypes ?? []
      }
    })
    return newItems
  }

  useEffect(() => {
    const initialSelectedVariables = getSelectedVariablesFromTargetData(targetData.items)
    setSelectedVariables(initialSelectedVariables || [])
  }, [targetData, variableFiled])

  useEffect(() => {
    form.setFieldsValue({
      ...targetData
    })
    onDataSetChange(targetData.inputData)
    forceUpdate({})
  }, [targetData, form, dataSetList])

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      const session = formatSessionParams(globalData, values.sessions)
      const params = {
        ...values,
        session
      }
      updateNodeComp(
        {
          ...targetData,
          ...params,
          label: values.componentName,
          globalDataOptions: globalData
        },
        callbackFunc,
        noMessage
      )
      forceUpdate({})
    })
  }

  useSaveShortcut(onFinish, isLoading)
  const { data: varOptions = [] } = useCustomVariableType()

  // 检查是否已存在向量搜索或等于搜索，并返回具体类型
  const checkExistingSearchType = (currentIndex, items = []) => {
    let existingType = null
    items.some((item, index) => {
      if (index === currentIndex) return false
      const operation = item?.operation
      if (operation === "vector_search") {
        existingType = "vector_search"
        return true
      }
      if (operation === "analyzer_search") {
        existingType = "analyzer_search"
        return true
      }
      return false
    })
    return existingType
  }

  // 根据已存在的搜索类型禁用对应选项
  const filterOperationTypes = (operationTypes = [], index) => {
    const items = form.getFieldValue("items") || []
    const existingSearchType = checkExistingSearchType(index, items)

    if (!existingSearchType) return operationTypes

    // 根据已存在的搜索类型禁用对应选项
    return operationTypes.map((op) => ({
      ...op
      // disabled:
      //   (existingSearchType === "vector_search" && op.value === "analyzer_search") ||
      //   (existingSearchType === "analyzer_search" && op.value === "vector_search")
    }))
  }

  // 添加操作符变化的处理函数
  const handleOperationChange = () => {
    forceUpdate({}) // 强制更新以刷新选项
  }

  return (
    <div className="common-node-wrapper">
      <div className="base-node-comp ">
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 24 }}
          disabled={isDisabled}
          layout="vertical"
        >
          <CommonContent
            title={"查询数据集组件"}
            containerClass="noPadding"
            onFinish={onFinish}
            isLoading={isLoading}
            disabled={isLocked}
          >
            <Tabs defaultActiveKey="1" type="line">
              <TabPane tab="组件设置" key="1" forceRender>
                <PreJudgment form={form} />
                <CustomDivider showTopLine={true}>基础设置</CustomDivider>
                <Row className="mt-3">
                  <Col span={24}>
                    <Form.Item
                      name="componentName"
                      label="组件名"
                      tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
                      rules={[{ required: true, message: "请输入组件名" }]}
                    >
                      <Input placeholder="请输入组件名" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={8}>
                  <Col span={24} style={{ paddingLeft: 0 }}>
                    <CustomDivider showTopLine={true}>查询参数</CustomDivider>
                    <Form.Item
                      name="inputData"
                      label="数据集"
                      rules={[{ required: false, message: "请选择数据集" }]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="children"
                        placeholder="请选择数据集"
                        filterOption={filterOption}
                        onChange={onDataSetChange}
                        options={dateSetListOptions}
                      ></Select>
                    </Form.Item>
                  </Col>

                  <Form.List
                    name="items"
                    initialValue={[
                      {
                        key: "",
                        operation: undefined,
                        valueExpression: undefined
                      }
                    ]} // 初始化至少一条数据
                  >
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <Space
                            key={key}
                            style={{
                              display: "flex",
                              width: "100%"
                            }}
                            align="start"
                          >
                            <Form.Item
                              {...restField}
                              shouldUpdate={true}
                              name={[name, "key"]}
                              className="w-40"
                              rules={[{ required: true, message: "请输入变量名" }]}
                            >
                              <Select
                                showSearch
                                placeholder="请选择变量名"
                                optionFilterProp="children"
                                onChange={(value) => handleVariableChange(value, index)}
                                // onSearch={onSearch}
                                filterOption={filterOption}
                                options={variableFiledOptions}
                              />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              className="w-32"
                              name={[name, "operation"]}
                              rules={[{ required: true, message: "请选择操作符" }]}
                            >
                              <Select
                                placeholder="操作符"
                                options={filterOperationTypes(
                                  selectedVariables?.[index]?.operationTypes,
                                  index
                                )}
                                onChange={handleOperationChange}
                              />
                            </Form.Item>
                            <GlobalVariableSelect
                              {...restField}
                              isTag={true}
                              required={true}
                              formName={[name, "valueExpression"]}
                              multiple={false}
                              style={{ width: "210px", marginRight: "6px", marginBottom: "0" }}
                              onChange={generateDebugData}
                              disabled={isDisabled}
                            />
                            <div style={{ width: 20, paddingTop: 6 }}>
                              {fields.length > 1 && !isDisabled && (
                                <DeleteIcon onClick={() => remove(name)} />
                              )}
                            </div>
                          </Space>
                        ))}
                        {!isDisabled && <AddIcon text="添加字段条件" onClick={() => add()} />}
                      </>
                    )}
                  </Form.List>
                  <Col span={24}>
                    <CustomDivider showTopLine={true}>查询参数</CustomDivider>
                    <Form.Item
                      name="size"
                      label="查询数量"
                      rules={[
                        { required: false, message: "请输入查询数量" },
                        {
                          pattern: /^[1-9][0-9]*$/,
                          message: "请输入一个大于0的整数"
                        },
                        {
                          validator: (_, value) =>
                            !value || value <= 200
                              ? Promise.resolve()
                              : Promise.reject(new Error("查询数量不得超过200"))
                        }
                      ]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        type="number"
                        placeholder="请输入"
                        min={1}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <CustomDivider showTopLine={true}>输出参数</CustomDivider>
                    <Form.Item
                      name="outputName"
                      label="输出变量名"
                      rules={[{ required: true, message: "请输入" }]}
                    >
                      <Input placeholder="输出变量名" />
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="后置处理" key="2" forceRender>
                <DynamicFormList form={form} varOptions={varOptions} />
              </TabPane>
            </Tabs>
          </CommonContent>
          <Form.Item name="inputParams" className="hidden">
            <Input type="hidden" />
          </Form.Item>
        </Form>
        <div className="debug-panel">
          <DynamicFormComponent
            nodeId={targetData.id}
            preview={false}
            isProcess={false}
            formData={formData.map((item) => {
              return {
                ...item,
                attributeName: item.attributeName || item.valueExpression
              }
            })}
            onFinish={onFinish}
          />
        </div>
      </div>
    </div>
  )
}

export default QueryDatasetComponent
