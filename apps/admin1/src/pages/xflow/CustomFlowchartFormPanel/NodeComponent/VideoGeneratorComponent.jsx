import { useEffect, useState, useMemo } from "react"
import {
  Form,
  Input,
  Row,
  Col,
  Tabs,
  Tooltip,
  InputNumber,
  Select,
  Radio,
  message,
  Button
} from "antd"
import { QuestionCircleOutlined } from "@ant-design/icons"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction, uniq } from "lodash"
import { CommonContent } from "../CommonContent"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { useCustomVariableType } from "../../hooks"
import { formatSessionParams } from "./utils"
import PreJudgment from "./components/PreJudgment"
import DynamicFormList from "./DynamicFormList"
import FallbackHandler from "./FallbackHandler"
import CustomDivider from "@/components/CustomDivider"
import AIOptimize from "@/components/AIOptimize"
import VariableTextArea from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/VariableTextArea"
import { useFetchVideoGenerateMode } from "@/api/common"

const TabPane = Tabs.TabPane

const TOOLTIP_TEXT = {
  jmStandardMode: "支持根据传入的提示词或场景图，完成视频生成",
  jmVividMode:
    "输入图片和模板视频，可按视频的动作、表情、口型驱动图片人物，且人物与背景特征和原图片一致",
  jmFirstTailMode: "支持传入首尾帧图片，完成视频生成"
}

/**
 * 析出prompt里边的字段
 */
function matchElements(content, globalObject) {
  let fieldNames = Object.keys(globalObject)
  const sortedArray = fieldNames.slice().sort((a, b) => b.length - a.length)
  const pattern = sortedArray
    .map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // 转义需要转义的字符
    .join("|")
  const regex = new RegExp(pattern, "g")
  let match = content?.match(regex)

  const matchedFields = []
  if (match && Array.isArray(match)) {
    uniq(match).map((item) => {
      let fieldObject = globalObject[item]
      if (
        fieldObject &&
        fieldObject.hasOwnProperty("formControlFacade") &&
        fieldObject.formControlFacade &&
        fieldObject.formControlFacade.controlType
      ) {
        matchedFields.push({
          ...fieldObject.formControlFacade,
          title: fieldObject.formControlFacade.title || fieldObject.displayName,
          valueExpression: fieldObject.valueExpression,
          attributeName: fieldObject.valueExpression
        })
      } else {
        matchedFields.push({
          ...fieldObject,
          controlType: "textarea",
          attributeName: fieldObject?.valueExpression,
          title: fieldObject?.description || fieldObject?.displayName,
          placeholder: "请输入……"
        })
      }
    })
  }
  return matchedFields
}

const VideoGeneratorComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData({ type: "VideoGeneratorComponent" })
  const [_, forceUpdate] = useState({})
  const [debugData, setDebugData] = useState([])
  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)

  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()
  const { data: videoGenerateMode } = useFetchVideoGenerateMode()

  useEffect(() => {
    form.setFieldsValue(targetData)
    forceUpdate({})
  }, [targetData, form])

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      if (values.generateMode === "jmStandardMode" && !values.prompt && !values.fileUrl) {
        message.error("提示词与场景图两者至少填1项")
        return
      }
      if (values.generateMode === "jmFirstTailMode" && !values.prompt) {
        message.error("请输入提示词")
        return
      }
      const callbackFunc = isFunction(callback) ? callback : () => {}
      const session = formatSessionParams(globalData, values.sessions)
      updateNodeComp(
        {
          ...targetData,
          ...values,
          session,
          label: values.componentName,
          globalDataOptions: globalData
        },
        callbackFunc,
        noMessage
      )
      forceUpdate({})
    })
  }

  const globalDataMemo = useMemo(() => {
    const data = {}
    if (Array.isArray(globalData)) {
      globalData.forEach((item) => {
        data[item.displayName] = item
      })
    }
    return data
  }, [globalData])

  const onMouseBlur = (value) => {
    const str = `${value?.target?.value}`
    form.setFieldsValue({
      prompt: str
    })
    const fieldList = matchElements(str, globalDataMemo)
    setDebugData(fieldList)
  }

  useEffect(() => {
    const fieldList = matchElements(targetData?.prompt, globalDataMemo)
    setDebugData(fieldList)
  }, [targetData, globalDataMemo])

  useSaveShortcut(onFinish, isLoading)
  const { data: varOptions = [] } = useCustomVariableType()

  return (
    <div className="common-node-wrapper">
      <div className="base-node-comp">
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 24 }}
          disabled={isDisabled}
          layout="vertical"
        >
          <CommonContent
            title={
              <div className="flex items-center">
                视频生成组件
                <Tooltip title="点击查看视频生成指南">
                  <Button
                    type="link"
                    className="ml-[5px] !p-0 !h-auto"
                    onClick={() => {
                      window.open(
                        "https://doc.weixin.qq.com/doc/w3_AVcAhwa9ANcCNLbB4LmtwT0iLHoWF?scode=AE4AywdQAA4rLd0yIBAdkAoQbCAA8",
                        "_blank"
                      )
                    }}
                  >
                    <QuestionCircleOutlined className="text-[16px]" />
                  </Button>
                </Tooltip>
              </div>
            }
            containerClass="noPadding"
            onFinish={onFinish}
            isLoading={isLoading}
            disabled={isLocked}
          >
            <Tabs defaultActiveKey="1" type="line">
              <TabPane tab="组件设置" key="1" forceRender>
                <PreJudgment form={form} />
                <CustomDivider showTopLine={true}>基础设置</CustomDivider>
                <Row>
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
                  <Col span={24}>
                    <Form.Item
                      name="generateMode"
                      label="视频模型类型"
                      rules={[{ required: true, message: "请选择视频模型类型" }]}
                      initialValue={"jmStandardMode"}
                    >
                      <Select
                        placeholder="请选择视频模型类型"
                        options={videoGenerateMode}
                        fieldNames={{ label: "name", value: "code" }}
                        optionRender={(option) => (
                          <Tooltip title={TOOLTIP_TEXT[option.data?.code]}>
                            <div className="w-full">{option.data?.name}</div>
                          </Tooltip>
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <CustomDivider showTopLine={true}>输入参数</CustomDivider>
                  </Col>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.generateMode !== curr.generateMode}
                  >
                    {({ getFieldValue }) => {
                      return (
                        <>
                          {getFieldValue("generateMode") === "jmVividMode" ? (
                            <>
                              <Col span={24}>
                                <GlobalVariableSelect
                                  span={false}
                                  label={"视频URL"}
                                  formName={["vividModeConfig", "videoUrlExpression"]}
                                  multiple={false}
                                  tooltip={"必须公网可访问"}
                                  isTag
                                  disabled={isDisabled}
                                />
                              </Col>
                              <Col span={24}>
                                <GlobalVariableSelect
                                  span={false}
                                  label={"图片URL"}
                                  formName={["vividModeConfig", "imageUrlExpression"]}
                                  multiple={false}
                                  tooltip={"必须公网可访问"}
                                  isTag
                                  disabled={isDisabled}
                                />
                              </Col>
                            </>
                          ) : (
                            <>
                              {(getFieldValue("generateMode") === "jmStandardMode" ||
                                getFieldValue("generateMode") === "jmFirstTailMode") && (
                                <>
                                  <Col span={24}>
                                    <div className="p-2 pb-1 rounded-md bg-gray-100 mt-0 mb-[16px]">
                                      <Form.Item
                                        className="global-tips"
                                        name="prompt"
                                        label={
                                          <div className="flex items-center justify-between w-[520px]">
                                            <div className="flex items-center">
                                              <span className="mr-2">提示词</span>
                                              {skillFlowData?.skillNo && (
                                                <AIOptimize
                                                  // originalPrompt={contentValue}
                                                  intelligentAgentType="SKILL"
                                                  intelligentAgentNo={skillFlowData.skillNo}
                                                  onSubmit={({ type, content }) => {
                                                    if (type === "agent") {
                                                      form.setFieldsValue({ prompt: content })
                                                    }
                                                  }}
                                                />
                                              )}
                                            </div>
                                            <Tooltip
                                              title={
                                                "用于生成视频的提示词，中英文均可输入。建议在400字以内，不超过800字，prompt过长可能出现效果异常或不生效"
                                              }
                                              placement="left"
                                            >
                                              <div className=" hover:text-gray-300">
                                                <i className="iconfont icon-Warning text-gray-500 text-[18px] cursor-pointer"></i>
                                              </div>
                                            </Tooltip>
                                          </div>
                                        }
                                        help={"输入$调用过程变量或快捷指令"}
                                        labelCol={{
                                          span: 24,
                                          offset: 0.3
                                        }}
                                      >
                                        <VariableTextArea
                                          variables={globalData}
                                          disabled={isDisabled}
                                          onMouseBlur={onMouseBlur}
                                          onChange={onMouseBlur}
                                          placeholder="请输入提示词内容..."
                                          miniInputStyle={{
                                            border: "none",
                                            boxShadow: "none",
                                            backgroundColor: "#f4f4f4"
                                          }}
                                        />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                  {getFieldValue("generateMode") === "jmStandardMode" && (
                                    <Col span={24}>
                                      <GlobalVariableSelect
                                        span={false}
                                        label={"场景图"}
                                        formName="fileUrl"
                                        multiple={false}
                                        required={false}
                                        tooltip={"支持JPEG、PNG格式图片传入"}
                                        isTag
                                        disabled={isDisabled}
                                      />
                                    </Col>
                                  )}
                                </>
                              )}
                              <Col span={24}>
                                <Form.Item
                                  name="seed"
                                  label="Seed"
                                  rules={[{ required: true, message: "请输入Seed" }]}
                                  tooltip={
                                    "-1表示完全随机，若随机种子为相同正整数且其他参数均一致，则生成视频极大概率效果一致"
                                  }
                                  initialValue={-1}
                                  layout="horizontal"
                                  labelCol={{ span: 4 }}
                                >
                                  <InputNumber placeholder="请输入Seed" className="w-full" />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item
                                  name="seconds"
                                  label="视频时长"
                                  rules={[{ required: true, message: "请选择视频时长" }]}
                                  tooltip={"将决定视频生成总帧数，时长支持5s、6s、7s、8s、9s、10s"}
                                  initialValue={5}
                                  layout="horizontal"
                                  labelCol={{ span: 5 }}
                                >
                                  <Select
                                    options={[
                                      { label: "5s", value: 5 },
                                      { label: "6s", value: 6 },
                                      { label: "7s", value: 7 },
                                      { label: "8s", value: 8 },
                                      { label: "9s", value: 9 },
                                      { label: "10s", value: 10 }
                                    ]}
                                    placeholder="请选择视频时长"
                                  />
                                </Form.Item>
                              </Col>
                              {getFieldValue("generateMode") === "jmFirstTailMode" && (
                                <>
                                  <Col span={24}>
                                    <GlobalVariableSelect
                                      span={false}
                                      label={"首帧URL"}
                                      formName={["firstTailModeConfig", "firstUrlExpression"]}
                                      multiple={false}
                                      isTag
                                      disabled={isDisabled}
                                    />
                                  </Col>
                                  <Col span={24}>
                                    <GlobalVariableSelect
                                      span={false}
                                      label={"尾帧URL"}
                                      formName={["firstTailModeConfig", "tailUrlExpression"]}
                                      multiple={false}
                                      isTag
                                      disabled={isDisabled}
                                    />
                                  </Col>
                                </>
                              )}
                              {getFieldValue("generateMode") === "jmStandardMode" && (
                                <Col span={24}>
                                  <Form.Item
                                    name="aspectRatio"
                                    label="视频比例"
                                    rules={[{ required: true, message: "请选择视频比例" }]}
                                    tooltip={
                                      "生成视频的长宽比，只在文生视频场景下生效，图生视频场景会根据输入图的长宽比从可选取值中选择最接近的比例生成"
                                    }
                                    initialValue={"16:9"}
                                    layout="horizontal"
                                    labelCol={{ span: 5 }}
                                  >
                                    <Radio.Group
                                      options={[
                                        { label: "16:9", value: "16:9" },
                                        { label: "4:3", value: "4:3" },
                                        { label: "1:1", value: "1:1" },
                                        { label: "9:16", value: "9:16" },
                                        { label: "21:9", value: "9:16" }
                                      ]}
                                      placeholder="请选择视频比例"
                                    />
                                  </Form.Item>
                                </Col>
                              )}
                            </>
                          )}
                        </>
                      )
                    }}
                  </Form.Item>
                </Row>
                <CustomDivider showTopLine={true}>输出变量</CustomDivider>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="outputName"
                      label="输出变量名"
                      rules={[{ required: true, message: "请输入" }]}
                      initialValue={"taskId"}
                    >
                      <Input placeholder="输出变量名" disabled />
                    </Form.Item>
                  </Col>
                </Row>
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
            preview={false}
            formData={[...(debugData || []), ...(formData || [])]}
            isProcess={false}
            nodeId={targetData.id}
          />
        </div>
      </div>
    </div>
  )
}

export default VideoGeneratorComponent
