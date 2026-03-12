import { useEffect, useMemo, useRef, useState } from "react"
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  Divider,
  InputNumber,
  Tabs,
  Switch,
  Tooltip,
  Slider
} from "antd"
import { MinusCircleOutlined } from "@ant-design/icons"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useCustomVariableType } from "../../hooks"
import { useFormData } from "../../hooks/useInputFormData"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import { useFetchGlobalVariable, useFetchAvailableSkills } from "@/api/skill"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import RecursiveInputList from "@/components/RecursiveInputList"
import { useFetchOutputType } from "@/api/common"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { InputEditTable } from "./components/InputEditTable"
import { getRandomString } from "@/utils"
import JsonTable from "./components/JsonTable"
import { assignRowIdAndLayer } from "./CallPluginToolComponent"
import ParsingSpecificFields from "./components/ParsingSpecificFields"
import { formatSessionParams } from "./utils"
import PreJudgment from "./components/PreJudgment"
import DynamicFormList from "./DynamicFormList"
import FallbackHandler from "./FallbackHandler"
import CustomDivider from "@/components/CustomDivider"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { useSearchParams } from "react-router-dom"

const TabPane = Tabs.TabPane

const SkillComponent = ({ targetData, appData, currentSkillInfo, commandService }) => {
  const [searchParams] = useSearchParams()
  const agentNo = searchParams.get("agentNo")
  const { form, formData } = useFormData()
  const [inputTableData, setInputTableData] = useState({})
  const [filterText, setFilterText] = useState("")
  const [_, forceUpdate] = useState({})
  const [currentSkill, setCurrentSkill] = useState({
    skillNo: "",
    inputVariables: [],
    outputVariables: []
  })
  const [submitKey, setSubmitKey] = useState("")

  useEffect(() => {
    console.log("targetData= >>", targetData)
    const batchEnabled = targetData.batchEnabled
    form.setFieldsValue({
      ...targetData,
      skillNo: targetData.skillNo, //currentSkillInfo?.skillNo ||
      // 根据批量模式设置解析方式的初始值
      parseMethod: targetData.parseMethod || (batchEnabled ? "JSON_ARRAY" : "JSON")
    })
    setCurrentSkill((prev) => {
      return {
        ...prev,
        skillNo: targetData.skillNo, //currentSkillInfo?.skillNo ||
        inputVariables: targetData.inputItems,
        outputVariables: targetData.outputParams
      }
    })
    forceUpdate({})
  }, [targetData, form])

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  const { data: availableSkills = [] } = useFetchAvailableSkills({
    botNo: skillFlowData?.botNo,
    agentNo: agentNo
  })

  useEffect(() => {
    if (
      currentSkill?.skillNo &&
      (availableSkills?.selfSkills || availableSkills?.subscribedSkills)
    ) {
      setCurrentSkill((prev) => {
        const skillInfo = findSkillInfoBySkillNo(availableSkills, currentSkill.skillNo)
        if (skillInfo) {
          return {
            ...prev,
            inputVariables: skillInfo.inputVariables || [],
            outputVariables: skillInfo.outputVariables || []
          }
        }
        return prev
      })
    }
  }, [availableSkills, currentSkill?.skillNo])

  const skills = useMemo(() => {
    const selfSkills =
      availableSkills?.selfSkills?.map((skill) => {
        return {
          ...skill,
          label: skill.skillName,
          value: skill.skillNo
        }
      }) || []
    // 取 selfSkills 的 skillNo 列表
    const selfSkillNos = new Set(selfSkills.map((s) => s.skillNo))
    // 过滤掉 skillNo 已经在 selfSkills 里的 subscribedSkills
    const subscribedSkills =
      availableSkills?.subscribedSkills
        ?.filter((skill) => !selfSkillNos.has(skill.skillNo))
        .map((skill) => {
          return {
            ...skill,
            label: skill.skillName,
            value: skill.skillNo
          }
        }) || []
    return [
      {
        label: "来自本空间",
        options: selfSkills.filter((o) => o.label.includes(filterText))
      },
      {
        label: "来自其他空间",
        options: subscribedSkills.filter((o) => o.label.includes(filterText))
      }
    ]
  }, [availableSkills, filterText])

  // console.log("skills2222", skills)

  const handleSearch = (val) => {
    setFilterText(val)
  }

  const handleSkillChange = (skillNo, skillInfo) => {
    if (skillInfo) {
      setCurrentSkill({
        skillNo,
        inputVariables: skillInfo.inputVariables || [],
        outputVariables: skillInfo.outputVariables || []
      })
      setFilterText("")
      // form.setFieldsValue({
      //   outputParams: skillInfo.outputVariables.variables
      // })
    }
  }
  const inputDataSource = useMemo(() => {
    // 获取历史保存的输入项配置
    const historicalInputItems = targetData?.inputItems || []
    // 获取当前工作流的最新参数
    const currentInputVariables = currentSkill?.inputVariables || []

    // 以最新的工作流参数为基准，确保参数信息是最新的
    const mergedItems = currentInputVariables.map((currentParam) => {
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
        inputParams: null // 新参数的值为空
      }
    })

    // 注意：历史记录中存在但最新参数中不存在的参数会被自动丢弃（已删除的参数）
    return assignRowId(mergedItems)
  }, [currentSkill?.inputVariables, targetData?.inputItems])

  const outputDataSource = useMemo(() => {
    let outputType = ""
    let variables = []
    let outputData = []
    if (
      Array.isArray(currentSkill?.outputVariables) &&
      currentSkill?.outputVariables.length &&
      currentSkill?.outputVariables[0].variableName
    ) {
      outputData = assignRowIdAndLayer([...(currentSkill?.outputVariables || [])])
    } else if (
      Array.isArray(currentSkill?.outputVariables) &&
      currentSkill?.outputVariables.length
    ) {
      outputType = currentSkill?.outputVariables[0].outputType
      variables = currentSkill?.outputVariables[0].variables
      outputData = assignRowIdAndLayer([...(variables || [])])
    }

    return outputData
  }, [currentSkill])

  const getOutputType = useMemo(() => {
    let outputType = ""

    if (Array.isArray(currentSkill?.outputVariables) && currentSkill?.outputVariables.length) {
      outputType = currentSkill?.outputVariables[0].outputType
    }

    return outputType
  }, [currentSkill])

  console.log("outputDataSource:", outputDataSource, getOutputType)
  const { data: outputType = [] } = useFetchOutputType("PROMPT_TEMPLATE")
  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      const { sessions, ...rest } = values
      console.log("Received values of form: ", values)
      const inputParams = values.inputItems?.map((item) => item.inputParams)
      const session = formatSessionParams(globalData, sessions)
      updateNodeComp(
        {
          ...targetData,
          ...rest,
          globalDataOptions: globalData,
          inputItems: inputTableData,
          outputType: values.batchEnabled ? "JSON_ARRAY" : "JSON",
          label: values.componentName,
          isAsync: values.isAsync,
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
            title={"调用工作流"}
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
                  <Col span={24} className="mr-4">
                    <Form.Item
                      name="componentName"
                      label="组件名"
                      tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
                      rules={[{ required: true, message: "请输入组件名" }]}
                    >
                      <Input placeholder="请输入组件名" />
                    </Form.Item>
                    <Form.Item
                      label="选择工作流"
                      name="skillNo"
                      rules={[
                        {
                          required: true,
                          message: "请选择工作流"
                        }
                      ]}
                    >
                      <Select
                        showSearch
                        placeholder="请选择工作流"
                        onChange={handleSkillChange}
                        onSearch={handleSearch}
                        filterOption={false}
                        options={skills}
                      />
                    </Form.Item>
                    <Form.Item
                      layout="horizontal"
                      labelCol={{ span: 5 }}
                      name="isAsync"
                      label={
                        <span>
                          是否异步调用{" "}
                          <Tooltip title="提示：若后续节点不关联该节点返回值，可以开启">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </span>
                      }
                      valuePropName="checked"
                      initialValue={false}
                    >
                      <Switch size="small" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider className="!my-2 !mb-4" />

                {/* 新增批量循环开关 */}
                <Row>
                  <Col span={24}>
                    <Form.Item
                      layout="horizontal"
                      labelCol={{ span: 4 }}
                      name="batchEnabled"
                      label={
                        <span>
                          批量循环{" "}
                          <Tooltip title="开启后，将批量循环调用指定工作流">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </span>
                      }
                      valuePropName="checked"
                      initialValue={false}
                    >
                      <Switch size="small" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    const batchEnabled = getFieldValue("batchEnabled")

                    if (batchEnabled) {
                      // 批量模式时显示的内容
                      return (
                        <>
                          {/* 批处理变量选择 */}
                          <Row>
                            <Col span={24}>
                              <Form.Item
                                name="batchExecuteParams"
                                label="流程变量"
                                rules={[
                                  {
                                    required: true,
                                    message: "请选择流程变量"
                                  }
                                ]}
                              >
                                <Select
                                  showSearch
                                  allowClear
                                  placeholder="请选择流程变量（仅数组类型）"
                                  dropdownStyle={{ minWidth: 350 }}
                                >
                                  {globalData
                                    ?.filter((variable) => variable.variableValueType === "array")
                                    ?.map((variable, i) => (
                                      <Select.Option
                                        key={variable.globalVariableNo}
                                        value={variable.displayName}
                                      >
                                        <Tooltip
                                          title={
                                            <>
                                              {variable.displayName}
                                              {variable.description
                                                ? `(${variable.description})`
                                                : ""}
                                            </>
                                          }
                                        >
                                          {variable.displayName}
                                          {variable.description ? `(${variable.description})` : ""}
                                        </Tooltip>
                                      </Select.Option>
                                    ))}
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row>
                            <Col span={24}>
                              <Form.Item
                                layout="horizontal"
                                labelCol={{ span: 4 }}
                                name="parallelEnabled"
                                label="并行模式"
                                valuePropName="checked"
                                initialValue={false}
                                required
                                className="-ml-4"
                              >
                                <Switch size="small" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item shouldUpdate noStyle>
                            {({ getFieldValue }) => {
                              const parallelEnabled = getFieldValue("parallelEnabled")

                              if (parallelEnabled) {
                                return (
                                  <Row className="!-mt-3" align="middle">
                                    <Col span={4}>
                                      <span className="text-gray-500">最大并行度</span>
                                    </Col>
                                    <Col span={16}>
                                      <Form.Item
                                        name="concurrency"
                                        initialValue={2}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <Slider
                                          min={1}
                                          max={10}
                                          step={1}
                                          marks={{
                                            1: "1",
                                            5: "5",
                                            10: "10"
                                          }}
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                      <InputNumber
                                        min={1}
                                        max={10}
                                        style={{ marginLeft: 16, width: 60 }}
                                        value={form.getFieldValue("concurrency")}
                                        onChange={(value) =>
                                          form.setFieldsValue({ concurrency: value })
                                        }
                                      />
                                    </Col>
                                  </Row>
                                )
                              }
                              return null
                            }}
                          </Form.Item>
                        </>
                      )
                    } else {
                      // 非批量模式时显示原有的输入项配置
                      return (
                        <>
                          <CustomDivider showTopLine={true}>输入项配置 </CustomDivider>
                          <InputEditTable
                            onChangeData={(treeData) => {
                              setInputTableData(treeData)
                            }}
                            submitKey={submitKey}
                            dataSource={inputDataSource}
                            disabled={isDisabled}
                          />
                        </>
                      )
                    }
                  }}
                </Form.Item>

                {/* 共用的输出项配置 */}
                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue, setFieldsValue }) => {
                    const batchEnabled = getFieldValue("batchEnabled")
                    const currentParseMethod = getFieldValue("parseMethod")
                    const _getOutputType = getOutputType

                    // 当批量模式状态改变时，动态设置解析方式的值
                    const targetParseMethod = _getOutputType === "JSON" ? "JSON" : "PLAIN_TEXT" //batchEnabled ? "JSON_ARRAY" : "JSON"
                    if (currentParseMethod !== targetParseMethod) {
                      setTimeout(() => {
                        setFieldsValue({ parseMethod: targetParseMethod })
                      }, 0)
                    }

                    return (
                      <>
                        <CustomDivider showTopLine={true}>输出项配置</CustomDivider>
                        <Row gutter={[16, 16]}>
                          <Col span={12}>
                            <Form.Item
                              name="parseMethod"
                              label="解析方式"
                              rules={[
                                {
                                  required: true,
                                  message: "请选择解析方式"
                                }
                              ]}
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
                        {_getOutputType === "JSON" && <JsonTable dataSource={outputDataSource} />}
                      </>
                    )
                  }}
                </Form.Item>
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

export default SkillComponent

function findSkillInfoBySkillNo(data, skillNo) {
  const allSkills = (data.selfSkills || []).concat(data.subscribedSkills || [])

  for (const skill of allSkills) {
    if (skill.skillNo === skillNo) {
      return skill
    }
  }

  return null
}

function assignRowId(jsonData) {
  jsonData.forEach((item) => {
    item.rowId = item.rowId ?? getRandomString()

    if (item.children && item.children.length > 0) {
      assignRowId(item.children)
    }
  })
  return jsonData
}
