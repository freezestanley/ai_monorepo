import { useEffect, useMemo, useState } from "react"
import { Form, Input, Select, Row, Col, Tabs, Table, TreeSelect, Typography, Tooltip } from "antd"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useCustomVariableType } from "../../hooks"
import { useFormData } from "../../hooks/useInputFormData"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import { useFetchGlobalVariable } from "@/api/skill"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useFetchOutputType } from "@/api/common"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import DynamicFormList from "./DynamicFormList"
import FallbackHandler from "./FallbackHandler"
import JsonTable from "./components/JsonTable"
import React from "react"
import { useFetchAvailablePluginTools } from "@/api/pluginTool"
import { getRandomString } from "@/utils"
import PreJudgment from "./components/PreJudgment"
import { formatSessionParams } from "./utils"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import OverflowTooltip from "@/components/overflowTooltip"
import CustomDivider from "@/components/CustomDivider"
const { Text } = Typography
const TabPane = Tabs.TabPane

export const EditableCell = ({ children, ...restProps }) => {
  let childNode = children
  return <td {...restProps}>{childNode}</td>
}
const EditableContext = React.createContext(null)

export const EditableRow = ({ form, ...props }) => {
  return (
    <EditableContext.Provider value={form}>
      <tr {...props} />
    </EditableContext.Provider>
  )
}

const PluginComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})
  const [currentTool, setCurrentTool] = useState({
    toolCode: "",
    pluginCode: "",
    inputVariables: [],
    outputVariables: []
  })

  useEffect(() => {
    form.setFieldsValue({
      ...targetData
    })
    setCurrentTool((prev) => {
      return {
        ...prev,
        toolCode: targetData.toolCode,
        pluginCode: targetData.pluginCode,
        inputVariables: targetData.inputItems,
        outputVariables: []
      }
    })
    forceUpdate({})
  }, [targetData, form])

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
  console.log("globalData:", globalData)
  const { data: outputType = [] } = useFetchOutputType("PROMPT_TEMPLATE")
  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)

  const { data: availablePluginTools = {} } = useFetchAvailablePluginTools({
    botNo: skillFlowData?.botNo
  })
  useEffect(() => {
    if (
      currentTool?.toolCode &&
      !currentTool?.inputVariables?.some((v) => v.isSave) &&
      (availablePluginTools?.selfPlugins || availablePluginTools?.subscribedPlugins)
    ) {
      setCurrentTool((prev) => {
        const pluginInfo = findToolInfoByToolCode(availablePluginTools, currentTool.toolCode)
        if (pluginInfo) {
          return {
            ...prev,
            inputVariables: pluginInfo.toolInfo.inputVariables || [],
            outputVariables: pluginInfo.toolInfo.outputVariables || []
          }
        }
        return prev
      })
    }
  }, [availablePluginTools, currentTool?.toolCode])

  const pluginTools = useMemo(() => {
    const selfPlugins =
      availablePluginTools?.selfPlugins?.map((plugin) => {
        return {
          ...plugin,
          title: (
            <Tooltip title="只能选中的工具">
              <Text disabled>{plugin.pluginName}</Text>
            </Tooltip>
          ),
          value: plugin.pluginCode,
          selectable: false,
          italic: true,
          children:
            plugin.tools?.map((tool) => {
              return { ...tool, title: tool.toolName, value: tool.toolCode }
            }) || []
        }
      }) || []
    const subscribedPlugins =
      availablePluginTools?.subscribedPlugins?.map((plugin) => {
        return {
          ...plugin,
          title: (
            <Tooltip title="只能选中的工具">
              <Text disabled>{plugin.pluginName}</Text>
            </Tooltip>
          ),
          value: plugin.pluginCode,
          selectable: false,
          children:
            plugin.tools?.map((tool) => {
              return { ...tool, title: tool.toolName, value: tool.toolCode }
            }) || []
        }
      }) || []
    return [
      {
        title: <Text type="secondary">来自本空间</Text>,
        value: "self",
        selectable: false,
        children: selfPlugins
      },
      {
        title: <Text type="secondary">来自其他空间</Text>,
        value: "other",
        selectable: false,
        children: subscribedPlugins
      }
    ]
  }, [availablePluginTools])

  const handlePluginChange = (toolCode) => {
    const pluginInfo = findToolInfoByToolCode(availablePluginTools, toolCode)
    if (pluginInfo) {
      setCurrentTool({
        toolCode,
        pluginCode: pluginInfo.parentPluginCode,
        inputVariables: pluginInfo.toolInfo.inputVariables || [],
        outputVariables: pluginInfo.toolInfo.outputVariables || []
      })
    }
  }

  const inputDataSource = useMemo(() => {
    console.log("currentTool.inputVariables:", currentTool?.inputVariables)

    // 获取历史保存的输入项配置
    const historicalInputItems = targetData?.inputItems || []
    // 获取当前工具的最新参数
    const currentInputVariables = currentTool?.inputVariables || []

    // 以最新的工具参数为基准，确保参数信息是最新的
    const mergedItems = currentInputVariables.map(({ isSave, ...currentParam }) => {
      // 尝试从历史记录中找到对应的参数配置（通过variableName匹配）
      const historicalItem = historicalInputItems.find(
        (historical) => historical.variableName === currentParam.variableName
      )

      // 如果找到历史配置，保留用户的配置值，但使用最新的参数基础信息
      if (historicalItem) {
        return {
          ...currentParam, // 使用最新的参数基础信息（名称、描述、类型等）
          inputParams: historicalItem.inputParams, // 保留用户配置的参数值
          rowId: historicalItem.rowId ?? getRandomString() // 保留或生成rowId
        }
      }

      // 如果没找到历史配置，说明是新增参数，使用默认值
      return {
        ...currentParam,
        rowId: getRandomString(),
        inputParams: isSave ? currentParam.inputParams : null // 新参数的值为空
      }
    })

    // 注意：历史记录中存在但最新参数中不存在的参数会被自动丢弃（已删除的参数）
    return mergedItems
  }, [currentTool?.inputVariables, targetData?.inputItems])

  const outputDataSource = useMemo(() => {
    return assignRowIdAndLayer([...(currentTool?.outputVariables || [])])
  }, [currentTool])

  const [isDisabled] = useFormDisabled()

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      const afterDeleteInputParams = {}
      const inputParams = inputDataSource.map((item) => {
        const kv = values[item.rowId]
        return {
          ...item,
          isSave: true,
          inputParams: kv?.[item.variableName] || null
        }
      })

      // 更新本地数据，确保渲染时能拿到最新值
      setCurrentTool((prev) => ({
        ...prev,
        inputVariables: inputParams
      }))

      Object.entries(values).map(([k, v]) => {
        if (!/^\d+$/.test(k)) {
          afterDeleteInputParams[k] = v
        }
      })

      const { sessions, ...rest } = afterDeleteInputParams
      const session = formatSessionParams(globalData, sessions)
      updateNodeComp(
        {
          ...targetData,
          ...rest,
          globalDataOptions: globalData,
          // inputParams,
          inputItems: inputParams.map(({ isSave, ...item }) => item),
          outputType: "JSON",
          label: values.componentName,
          pluginCode: currentTool?.pluginCode,
          session,
          sessions,
          outputParams: outputDataSource
        },
        callbackFunc,
        noMessage
      )
    })
  }

  const { data: varOptions = [] } = useCustomVariableType()
  useSaveShortcut(onFinish, isLoading)

  const components = {
    body: {
      row: (props) => <EditableRow {...props} form={form} />,
      cell: (props) => <EditableCell {...props} list={globalData} />
    }
  }
  const defaultColumns = [
    {
      title: "参数名称",
      dataIndex: "variableName",
      width: "100px"
    },
    {
      title: "类型",
      dataIndex: "variableValueType",
      width: "70px"
    },
    {
      title: "说明",
      dataIndex: "description",
      width: "70px",
      render: (text, record) => {
        return <OverflowTooltip text={text} width={140} />
      }
    },
    {
      title: "参数值",
      dataIndex: "variableValue",
      width: "200px",
      placeholder: "请输入参数值",
      editable: true,
      required: true,
      render: (text, record) => {
        const initialValue = record.inputParams || record.defaultValue || undefined

        return (
          <div className="-mt-[20px]">
            <GlobalVariableSelect
              initialValue={initialValue}
              required={record?.required || false}
              span={false}
              label={""}
              isTag={true}
              formName={[record.rowId, record.variableName]}
              multiple={false}
              style={{ maxWidth: "200px", marginBottom: 0 }}
              key={`${record.rowId}-${record.variableName}-${JSON.stringify(initialValue)}`}
              disabled={isLocked || !record.isOpen}
            />
          </div>
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
            title={"调用工具"}
            containerClass="noPadding"
            onFinish={onFinish}
            isLoading={isLoading}
            disabled={isLocked}
          >
            <Tabs defaultActiveKey="1" type="line">
              <TabPane tab="组件设置" key="1">
                <PreJudgment form={form} />
                <CustomDivider showTopLine={true}>基础设置</CustomDivider>
                <Col span={24} className="mr-4">
                  <Form.Item
                    labelCol={{
                      span: 5
                    }}
                    name="componentName"
                    label="组件名"
                    tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
                    rules={[{ required: true, message: "请输入组件名" }]}
                  >
                    <Input placeholder="请输入组件名" />
                  </Form.Item>
                </Col>
                <Col span={24} className="mr-4">
                  <Form.Item
                    name="toolCode"
                    labelCol={{
                      span: 5
                    }}
                    label="选择工具"
                    tooltip="不可选中，只能选中的工具"
                    rules={[{ required: true, message: "请选择工具" }]}
                  >
                    <TreeSelect
                      placeholder="请选择工具"
                      treeData={pluginTools}
                      onChange={handlePluginChange}
                    />
                  </Form.Item>
                </Col>
                <CustomDivider showTopLine={true}>输入项配置</CustomDivider>
                <Form.Item name="inputItems">
                  <Table
                    components={components}
                    rowClassName={() => "editable-row"}
                    bordered
                    pagination={false}
                    dataSource={
                      Array.isArray(inputDataSource)
                        ? inputDataSource.map((item) => ({
                            ...item,
                            list: item.children,
                            children: undefined
                          }))
                        : []
                    }
                    columns={columns}
                  />
                </Form.Item>

                <CustomDivider showTopLine={true}>输出项配置</CustomDivider>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item
                      labelCol={{
                        span: 8
                      }}
                      name="parseMethod"
                      label="解析方式"
                      rules={[
                        {
                          required: true,
                          message: "请选择解析方式"
                        }
                      ]}
                      initialValue={"JSON"}
                    >
                      <Select placeholder="请选择解析方式" disabled={true}>
                        {outputType
                          .filter((item) => item.name !== "文本")
                          .map((method, i) => (
                            <Select.Option key={i} value={method.code}>
                              {method.name}
                            </Select.Option>
                          ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="outputName"
                      label="输出变量名"
                      rules={[
                        {
                          required: true,
                          message: "请输入"
                        }
                      ]}
                    >
                      <Input placeholder="请输入" />
                    </Form.Item>
                  </Col>
                </Row>
                <JsonTable dataSource={outputDataSource} />
              </TabPane>
              <TabPane tab="后置处理" key="2" forceRender>
                <DynamicFormList form={form} varOptions={varOptions} />
              </TabPane>
              <TabPane tab="兜底处理" key="3" forceRender>
                <FallbackHandler
                  form={form}
                  varOptions={varOptions}
                  botNo={skillFlowData?.botNo}
                  skillNo={skillFlowData?.skillNo}
                />
              </TabPane>
            </Tabs>
          </CommonContent>
        </Form>
        <div className="debug-panel">
          <DynamicFormComponent
            onFinish={onFinish}
            nodeId={targetData.id}
            preview={false}
            formData={formData || []}
            isProcess={true}
            isJSONDebug={true}
          />
        </div>
      </div>
    </div>
  )
}

export default PluginComponent

function findToolInfoByToolCode(data, toolCode) {
  const allPlugins = data.selfPlugins?.concat(data.subscribedPlugins) || []

  for (const plugin of allPlugins) {
    for (const tool of plugin.tools || []) {
      if (tool.toolCode === toolCode) {
        return {
          toolInfo: tool,
          parentPluginCode: plugin.pluginCode
        }
      }
    }
  }

  return null
}

export function assignRowIdAndLayer(jsonData, layer = 1) {
  jsonData.forEach((item) => {
    item.rowId = item.rowId ?? getRandomString()
    item.layer = layer

    if (item.children && item.children.length > 0) {
      assignRowIdAndLayer(item.children, layer + 1)
    }
  })
  return jsonData
}
