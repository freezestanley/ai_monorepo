import { useCallback, useEffect, useState } from "react"
import { Form, Input, Select, Button, Row, Col, Divider, Tabs, Switch, Tooltip } from "antd"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { OutputParameter } from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/OutputParameter"
import { parseTypes } from "@/constants"
import { useNode } from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/hooks/useNodeOutput"
import DynamicFormComponent from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/DynamicFormComponent"
import "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/index.scss"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import { useFetchOutputType } from "@/api/common"
import { useFetchGlobalVariable } from "@/api/skill"
import { useFormData } from "../../hooks/useInputFormData"
import React from "react"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import VariableTextArea from "./components/VariableTextArea"
import { isFunction } from "lodash"
import { useNodeInput } from "./hooks/useNodeInput"
import UseGenerateCode from "./hooks/useGenerateCode"
import { CodeEditor } from "@/components/CodeEditor"
import { CommonContent } from "../CommonContent"
import { useComponentAndDebugPanel, useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import PreJudgment from "./components/PreJudgment"
import { formatSessionParams } from "./utils"
import { useCustomVariableType } from "../../hooks"
import DynamicFormList from "./DynamicFormList"
import FallbackHandler from "./FallbackHandler"
import { moveItem } from "@/api/tools"
import CustomDivider from "@/components/CustomDivider"
import { PlusOutlined, QuestionCircleOutlined, HistoryOutlined } from "@ant-design/icons"
import JSONDiffModal from "@/components/JSONDiffModal"

const { TabPane } = Tabs

// Memo
const ScriptComponent = React.memo(
  // @ts-ignore
  ({ targetData, appData, commandService }) => {
    const [forceRender, setForceRender] = useState(Math.random())
    const { form, formData } = useFormData()
    const [debugFormData, setDebugFormData] = useState([])
    const [_, forceUpdate] = useState({})
    const [diffModalVisible, setDiffModalVisible] = useState(false)
    console.log("targetData=>>>", targetData)

    const { parseMethod, outputs, handleParseMethodChange, addOutput, deleteOutput } = useNode(
      form,
      targetData
    )

    const moveOutput = (index, direction) => {
      form.setFieldsValue({
        outputParams: moveItem(form.getFieldValue("outputParams"), index, direction)
      })
    }

    const { inputs, addInput, deleteInput } = useNodeInput(form, targetData)
    const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)

    const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
    const [isDisabled] = useFormDisabled()

    const onFinish = (callback = () => {}, noMessage = false) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      return form.validateFields().then((values) => {
        const { inputArgs = [], sessions } = values
        const inputItems = inputArgs
          .filter((arg) => Object.values(arg).some((value) => value !== undefined && value !== ""))
          .map((arg) => {
            return {
              ...arg,
              // useSkillFlow.jsx保存时需要这个字段
              variableType: arg.variableValueType
            }
          })

        console.log("Received values of form: ", values, globalData)
        const session = formatSessionParams(globalData, sessions)

        updateNodeComp(
          {
            ...targetData,
            ...values,
            globalDataOptions: globalData,
            inputItems,
            session
          },
          callbackFunc,
          noMessage
        )
        forceUpdate({})
      })
    }

    const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

    // 处理历史记录图标点击
    const handleHistoryClick = () => {
      setDiffModalVisible(true)
    }

    // 获取当前组件的bizNo
    const getCurrentBizNo = () => {
      if (!targetData?.id || !skillFlowData?.skillComponentDefinitions) {
        return undefined
      }
      const currentComponent = skillFlowData.skillComponentDefinitions.find(
        (comp) => comp.nodeId === targetData.id
      )
      return currentComponent?.bizNo
    }

    // 获取当前工作流数据用于对比
    const getCurrentSkillData = () => {
      const formValues = form.getFieldsValue()
      return {
        codeContent: formValues.codeContent || "",
        inputs: formValues.inputArgs || [],
        skillInfo: {
          skillNo: skillFlowData?.skillNo,
          ...skillFlowData
        }
      }
    }

    const { codeContent, setCodeContent, startGenerateCode, loading, stopGenerate } =
      UseGenerateCode()

    const onGenerateCode = () => {
      if (loading) {
        stopGenerate()
        return
      }
      return form.validateFields().then((values) => {
        const { inputArgs = [], methodDesc = "", scriptType } = values
        const args = inputArgs.map((arg) => {
          return {
            name: arg.variableName,
            type: arg.variableValueType,
            desc: arg.description
          }
        })

        const generateCodeParams = {
          args,
          methodDesc,
          scriptType
        }
        console.log("generateCodeParams:", generateCodeParams)
        setCodeContent("")
        startGenerateCode(`/botWeb/common/script/generate`, generateCodeParams)
      })
    }

    const { data: outputType = [] } = useFetchOutputType("PROMPT_TEMPLATE")
    const scriptTypes = [
      {
        name: "python",
        code: "python"
      },
      {
        name: "javascript",
        code: "javascript"
      }
    ]
    useSaveShortcut(onFinish, isLoading)

    useEffect(() => {
      form.setFieldValue("codeContent", codeContent)
    }, [codeContent])

    const onCodeChange = useCallback((codeContent) => {
      form.setFieldValue("codeContent", codeContent)
    }, [])

    useEffect(() => {
      setCodeContent(targetData.codeContent)
    }, [targetData.codeContent])

    const handleGlobalVariableChange = (keys, value, options) => {
      const { variableValueType, description } = form.getFieldValue(keys) || {}
      const curData = options?.find((v) => v.displayName === value)
      const formVal = {}
      curData?.variableValueType &&
        curData?.variableValueType !== variableValueType &&
        (formVal.variableValueType = curData.variableValueType)
      !description && curData?.description && (formVal.description = curData.description)
      form.setFieldValue(keys, { ...form.getFieldValue(keys), ...formVal })
      setForceRender(Math.random())
    }

    const handleDebugFormDataChange = (formData) => {
      setDebugFormData(formData)
    }

    useEffect(() => {
      handleDebugFormDataChange(formData)
    }, [JSON.stringify(formData)])

    const { data: varOptions = [] } = useCustomVariableType()
    const scriptType = Form.useWatch("scriptType", form)

    return (
      <div className="common-node-wrapper">
        <div className="base-node-comp ">
          <Form
            form={form}
            onFinish={onFinish}
            labelCol={{ span: 10 }}
            disabled={isDisabled}
            layout="vertical"
          >
            <CommonContent
              containerClass="noPadding"
              title={"Script组件"}
              isLoading={isLoading}
              disabled={isLocked}
              onFinish={onFinish}
            >
              <Tabs defaultActiveKey="1" type="line">
                <TabPane tab="组件设置" key="1" forceRender>
                  <PreJudgment form={form} />
                  <CustomDivider showTopLine={true}>基础设置</CustomDivider>
                  <Row gutter={[0, 8]}>
                    <Col span={24}>
                      <Form.Item
                        labelCol={{
                          span: 4
                        }}
                        name="label"
                        label="组件名"
                        tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="请输入组件名" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="scriptType"
                        label="脚本类型"
                        labelCol={{
                          span: 4
                        }}
                        rules={[{ required: true, message: "请选择脚本类型" }]}
                        initialValue={"python"}
                      >
                        <Select placeholder="请选择脚本类型">
                          {scriptTypes.map((type) => (
                            <Select.Option key={type.code} value={type.code}>
                              {type.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <CustomDivider showTopLine={true}>输入参数</CustomDivider>
                  <DndProvider backend={HTML5Backend}>
                    <>
                      {inputs.map((input, index) => (
                        <React.Fragment key={index}>
                          <OutputParameter
                            inputParamsOrOutputParams="inputArgs"
                            allowDelete={inputs.length > 1}
                            index={index}
                            id={input.id}
                            parseMethod="JSON"
                            deleteOutput={deleteInput}
                            addOutput={addInput}
                            parseTypes=""
                            isFirst={index === 0}
                            isLast={index === inputs.length - 1}
                            form={form}
                            required={false}
                            suffixChildren={
                              <GlobalVariableSelect
                                isTag={true}
                                span={3}
                                formName={["inputParams", index]}
                                multiple={false}
                                label={""}
                                onChange={(value, options) =>
                                  handleGlobalVariableChange(["inputArgs", index], value, options)
                                }
                                style={{ marginBottom: 0 }}
                                placeholder="请选择取值（必填）"
                                message="请选择取值（必填）"
                                required={false}
                                disabled={isDisabled}
                              />
                            }
                          />
                        </React.Fragment>
                      ))}
                      <Row>
                        <Col span={24}>
                          {!isDisabled && (
                            <Button
                              type="link"
                              onClick={addInput}
                              style={{
                                paddingLeft: 24,
                                marginTop: 8
                              }}
                              icon={<PlusOutlined />}
                            >
                              添加
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </>
                  </DndProvider>

                  <CustomDivider showTopLine={true}>输出参数</CustomDivider>
                  <Row gutter={[24, 4]}>
                    <Col span={12}>
                      <Form.Item
                        labelCol={{
                          span: 8
                        }}
                        name="parseMethod"
                        className="mb-2"
                        label="解析方式"
                        rules={[
                          {
                            required: true,
                            message: "请选择解析方式"
                          }
                        ]}
                      >
                        <Select placeholder="请选择解析方式" onChange={handleParseMethodChange}>
                          {outputType.map((method, i) => (
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
                        className="mb-2"
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
                    <Col span={24}>
                      <DndProvider backend={HTML5Backend}>
                        <>
                          {(parseMethod === "JSON" || parseMethod === "JSON_ARRAY") &&
                            outputs.map((output, index) => (
                              <OutputParameter
                                inputParamsOrOutputParams="outputParams"
                                allowDelete={outputs.length > 1}
                                key={index}
                                index={index}
                                id={output.id}
                                parseMethod={parseMethod}
                                deleteOutput={deleteOutput}
                                addOutput={addOutput}
                                parseTypes={parseTypes}
                                moveOutput={moveOutput}
                                isFirst={index === 0}
                                isLast={index === outputs.length - 1}
                                form={form}
                              />
                            ))}
                          <Row>
                            <Col span={24}>
                              {!isDisabled && (
                                <Button
                                  type="link"
                                  onClick={addOutput}
                                  style={{
                                    paddingLeft: 24,
                                    marginTop: 8
                                  }}
                                  icon={<PlusOutlined />}
                                >
                                  添加
                                </Button>
                              )}
                            </Col>
                          </Row>
                        </>
                      </DndProvider>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        className="global-tips"
                        name="methodDesc"
                        label="方法描述"
                        labelCol={{
                          span: 24,
                          offset: 0.3
                        }}
                      >
                        <VariableTextArea variables={globalData} disabled={isDisabled} />
                      </Form.Item>
                    </Col>
                    <Col span={24} style={{ textAlign: "right" }}>
                      <Button onClick={onGenerateCode} type="primary" loading={loading}>
                        生成代码
                      </Button>
                    </Col>
                  </Row>
                  <Form.Item
                    className="global-tips"
                    style={{
                      marginTop: 16
                    }}
                    name="codeContent"
                  >
                    <CodeEditor
                      miniTitle={
                        <>
                          脚本内容
                          <Tooltip
                            title="有些python语法在沙箱中不支持，请按提示更换。
1. dict更新，不支持类似于item['code'] = 'xx'的赋值方式，请使用 item.update({'code':'xx'})
2. 不支持使用类似于'+=', '-='等操作符。如 num +=1 请替换为 num = num + 1
3. 嵌套的自定义函数仅支持返回一个值，不可返回多个值（如 return r1, r2）"
                            overlayInnerStyle={{ whiteSpace: "pre-line" }}
                          >
                            <QuestionCircleOutlined
                              style={{ marginLeft: "4px", color: "#6B7280", cursor: "pointer" }}
                            />
                          </Tooltip>
                          <Tooltip title="查看历史版本">
                            <i
                              className="iconfont icon-lishijilu"
                              style={{ marginLeft: "8px", color: "#6B7280", cursor: "pointer" }}
                              onClick={handleHistoryClick}
                            />
                          </Tooltip>
                          <div className="text-[12px] text-red-400">
                            提示：代码将在沙箱中运行，不支持自行导包
                          </div>
                        </>
                      }
                      scriptType={scriptType}
                      codeContent={codeContent}
                      onCodeChange={onCodeChange}
                      editable={!isDisabled}
                      miniStyle={{
                        util: { justifyContent: "space-between" }
                      }}
                    />
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
        </div>
        <div className="debug-panel">
          <DynamicFormComponent
            onFinish={onFinish}
            nodeId={targetData.id}
            preview={false}
            formData={debugFormData || []}
            isProcess={false}
          />
        </div>
        <JSONDiffModal
          visible={diffModalVisible}
          onCancel={() => setDiffModalVisible(false)}
          currentSkill={getCurrentSkillData()}
          globalData={form.getFieldValue("codeContent") || ""}
          skillNo={skillFlowData?.skillNo}
          bizNo={getCurrentBizNo()} //getCurrentBizNo() targetData?.nodeNo
          onEnableVersion={(versionContent) => {
            // 将历史版本内容替换到form的codeContent字段
            form.setFieldsValue({ codeContent: versionContent })
            setCodeContent(versionContent)
            // 关闭弹窗
            setDiffModalVisible(false)
          }}
        />
      </div>
    )
  }
)

export default ScriptComponent
