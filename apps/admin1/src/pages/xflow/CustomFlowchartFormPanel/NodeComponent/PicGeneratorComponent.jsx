import { useEffect, useState } from "react"
import { Form, Input, Select, Row, Col, Tabs, Switch, InputNumber } from "antd"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import {
  useFetchPictureModelType,
  useFetchGeminiAspectRatio,
  useFetchGeminiImageSize
} from "@/api/common"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { useCustomVariableType } from "../../hooks"
import { formatSessionParams } from "./utils"
import PreJudgment from "./components/PreJudgment"
import DynamicFormList from "./DynamicFormList"
import FallbackHandler from "./FallbackHandler"
import CustomDivider from "@/components/CustomDivider"

const TabPane = Tabs.TabPane

const PicGeneratorComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)

  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  useEffect(() => {
    form.setFieldsValue(targetData)
    forceUpdate({})
  }, [targetData, form])

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
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

  const { data: pictureModelTypeList = [] } = useFetchPictureModelType()
  const { data: geminiAspectRatioList = [] } = useFetchGeminiAspectRatio()
  const { data: geminiImageSizeList = [] } = useFetchGeminiImageSize()
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
            title={"文生图组件"}
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
                    <CustomDivider showTopLine={true}>输入参数</CustomDivider>
                    <GlobalVariableSelect
                      span={false}
                      label={"输入"}
                      formName="inputParams"
                      multiple={true}
                      layout="vertical"
                      disabled={isDisabled}
                    />
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="ttiModel"
                      label="图片模型类型"
                      rules={[{ required: true, message: "请选择图片模型类型" }]}
                    >
                      <Select placeholder="请选择图片模型类型" onChange={() => forceUpdate({})}>
                        {pictureModelTypeList.map((type) => (
                          <Select.Option key={type.code} value={type.code}>
                            {type.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item name="_extraInfo" hidden>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.ttiModel !== currentValues.ttiModel ||
                      prevValues.subSetting !== currentValues.subSetting
                    }
                  >
                    {({ getFieldValue, validateFields, setFieldValue }) => {
                      const ttiModel = getFieldValue("ttiModel")
                      const extraInfo = pictureModelTypeList?.find(
                        (v) => v.code === ttiModel
                      )?.extraInfo
                      setFieldValue("_extraInfo", extraInfo)
                      return (
                        <>
                          {/* Gemini Flash - nanobanana_gemini-2.5-flash-image */}
                          {ttiModel === "GEMINI_FLASH" && (
                            <>
                              <Col span={24}>
                                <Form.Item
                                  label={
                                    <div className="flex items-center gap-2">
                                      <span>宽高比例</span>
                                      <Form.Item
                                        noStyle
                                        name={["geminiSetting", "enableCustomAspectRatio"]}
                                        valuePropName="checked"
                                        initialValue={false}
                                      >
                                        <Switch
                                          size="small"
                                          onChange={(checked) => {
                                            if (checked) {
                                              setFieldValue(
                                                ["geminiSetting", "aspectRatio"],
                                                undefined
                                              )
                                            } else {
                                              setFieldValue(
                                                ["geminiSetting", "aspectRatioExpression"],
                                                undefined
                                              )
                                            }
                                            validateFields([["geminiSetting", "aspectRatio"]])
                                            validateFields([
                                              ["geminiSetting", "aspectRatioExpression"]
                                            ])
                                            forceUpdate({})
                                          }}
                                        />
                                      </Form.Item>
                                      <span className="text-[12px] text-gray-500">自定义输入</span>
                                    </div>
                                  }
                                >
                                  {getFieldValue(["geminiSetting", "enableCustomAspectRatio"]) ? (
                                    <GlobalVariableSelect
                                      multiple={false}
                                      span={24}
                                      isTag
                                      formName={["geminiSetting", "aspectRatioExpression"]}
                                      layout="vertical"
                                      required={true}
                                      message="请选择宽高比例"
                                      placeholder="请选择变量"
                                    />
                                  ) : (
                                    <Form.Item
                                      noStyle
                                      name={["geminiSetting", "aspectRatio"]}
                                      rules={[{ required: true, message: "请选择宽高比例" }]}
                                    >
                                      <Select placeholder="请选择宽高比例">
                                        {geminiAspectRatioList.map((item) => (
                                          <Select.Option key={item.code} value={item.code}>
                                            {item.name}
                                          </Select.Option>
                                        ))}
                                      </Select>
                                    </Form.Item>
                                  )}
                                </Form.Item>
                                {getFieldValue(["geminiSetting", "enableCustomAspectRatio"]) && (
                                  <p className="mb-1 text-red-400 text-[12px] -mt-8">
                                    宽高比例仅支持1:1，2:3，3:2，3:4，4:3，4:5，5:4，9:16，16:9，21:9
                                  </p>
                                )}
                              </Col>
                              <Col span={24}>
                                <GlobalVariableSelect
                                  multiple={false}
                                  span={24}
                                  isTag
                                  label={"参考图片"}
                                  formName={["geminiSetting", "referenceImageExpression"]}
                                  layout="vertical"
                                  required={false}
                                />
                              </Col>
                            </>
                          )}
                          {/* Gemini 3 Pro - nanobanana_gemini-3-pro-image-preview */}
                          {ttiModel === "GEMINI_3PRO_IMAGE" && (
                            <>
                              <Col span={24}>
                                <Form.Item
                                  label={
                                    <div className="flex items-center gap-2">
                                      <span>宽高比例</span>
                                      <Form.Item
                                        noStyle
                                        name={["geminiSetting", "enableCustomAspectRatio"]}
                                        valuePropName="checked"
                                        initialValue={false}
                                      >
                                        <Switch
                                          size="small"
                                          onChange={(checked) => {
                                            if (checked) {
                                              setFieldValue(
                                                ["geminiSetting", "aspectRatio"],
                                                undefined
                                              )
                                            } else {
                                              setFieldValue(
                                                ["geminiSetting", "aspectRatioExpression"],
                                                undefined
                                              )
                                            }
                                            validateFields([["geminiSetting", "aspectRatio"]])
                                            validateFields([
                                              ["geminiSetting", "aspectRatioExpression"]
                                            ])
                                            forceUpdate({})
                                          }}
                                        />
                                      </Form.Item>
                                      <span className="text-[12px] text-gray-500">自定义输入</span>
                                    </div>
                                  }
                                >
                                  {getFieldValue(["geminiSetting", "enableCustomAspectRatio"]) ? (
                                    <GlobalVariableSelect
                                      multiple={false}
                                      span={24}
                                      isTag
                                      formName={["geminiSetting", "aspectRatioExpression"]}
                                      layout="vertical"
                                      required={true}
                                      message="请选择宽高比例"
                                      placeholder="请选择变量"
                                    />
                                  ) : (
                                    <Form.Item
                                      noStyle
                                      name={["geminiSetting", "aspectRatio"]}
                                      rules={[{ required: true, message: "请选择宽高比例" }]}
                                    >
                                      <Select placeholder="请选择宽高比例">
                                        {geminiAspectRatioList.map((item) => (
                                          <Select.Option key={item.code} value={item.code}>
                                            {item.name}
                                          </Select.Option>
                                        ))}
                                      </Select>
                                    </Form.Item>
                                  )}
                                </Form.Item>
                                {getFieldValue(["geminiSetting", "enableCustomAspectRatio"]) && (
                                  <p className="mb-1 text-red-400 text-[12px] -mt-8">
                                    宽高比例仅支持1:1，2:3，3:2，3:4，4:3，4:5，5:4，9:16，16:9，21:9
                                  </p>
                                )}
                              </Col>
                              <Col span={24}>
                                <Form.Item
                                  label={
                                    <div className="flex items-center gap-2">
                                      <span>图片分辨率</span>
                                      <Form.Item
                                        noStyle
                                        name={["geminiSetting", "enableCustomImageSize"]}
                                        valuePropName="checked"
                                        initialValue={false}
                                      >
                                        <Switch
                                          size="small"
                                          onChange={(checked) => {
                                            if (checked) {
                                              setFieldValue(
                                                ["geminiSetting", "imageSize"],
                                                undefined
                                              )
                                            } else {
                                              setFieldValue(
                                                ["geminiSetting", "imageSizeExpression"],
                                                undefined
                                              )
                                            }
                                            validateFields([["geminiSetting", "imageSize"]])
                                            validateFields([
                                              ["geminiSetting", "imageSizeExpression"]
                                            ])
                                            forceUpdate({})
                                          }}
                                        />
                                      </Form.Item>
                                      <span className="text-[12px] text-gray-500">自定义输入</span>
                                    </div>
                                  }
                                >
                                  {getFieldValue(["geminiSetting", "enableCustomImageSize"]) ? (
                                    <GlobalVariableSelect
                                      multiple={false}
                                      span={24}
                                      isTag
                                      formName={["geminiSetting", "imageSizeExpression"]}
                                      layout="vertical"
                                      required={true}
                                      message="请选择图片分辨率"
                                      placeholder="请选择变量"
                                    />
                                  ) : (
                                    <Form.Item
                                      noStyle
                                      name={["geminiSetting", "imageSize"]}
                                      rules={[{ required: true, message: "请选择图片分辨率" }]}
                                    >
                                      <Select placeholder="请选择图片分辨率">
                                        {geminiImageSizeList.map((item) => (
                                          <Select.Option key={item.code} value={item.code}>
                                            {item.name}
                                          </Select.Option>
                                        ))}
                                      </Select>
                                    </Form.Item>
                                  )}
                                </Form.Item>
                                {getFieldValue(["geminiSetting", "enableCustomImageSize"]) && (
                                  <p className="mb-1 text-red-400 text-[12px] -mt-8">
                                    分辨率仅支持1K，2K，4K，必须使用大写【K】，小写参数（例如，1k）将被拒绝
                                  </p>
                                )}
                              </Col>
                              <Col span={24}>
                                <GlobalVariableSelect
                                  multiple={false}
                                  span={24}
                                  isTag
                                  label={"参考图片"}
                                  formName={["geminiSetting", "referenceImageExpression"]}
                                  layout="vertical"
                                  required={false}
                                />
                              </Col>
                            </>
                          )}
                          {/* 即梦 */}
                          {!!extraInfo && extraInfo === "JiMeng" && (
                            <>
                              <Col span={24} className="flex gap-2">
                                <Form.Item
                                  name={["subSetting", "enableSeed"]}
                                  valuePropName="checked"
                                  initialValue={false}
                                >
                                  <Switch
                                    onChange={(checked) => {
                                      if (!checked) {
                                        setFieldValue(["subSetting", "seed"], undefined)
                                        validateFields(["subSetting", "seed"])
                                      }
                                    }}
                                  />
                                </Form.Item>
                                <Form.Item
                                  className="flex-1"
                                  layout="horizontal"
                                  labelCol={{
                                    span: getFieldValue(["subSetting", "enableSeed"]) ? 4 : 3
                                  }}
                                  name={["subSetting", "seed"]}
                                  label="Seed"
                                  rules={[
                                    {
                                      required: !!getFieldValue(["subSetting", "enableSeed"]),
                                      message: "请输入Seed"
                                    }
                                  ]}
                                  tooltip="-1表示完全随机，若为正数值，则相同的正数值在其他设置相同的情况下生成的图像会相似"
                                >
                                  <InputNumber
                                    placeholder="请输入Seed"
                                    min={-1}
                                    className="w-100"
                                    disabled={
                                      isDisabled || !getFieldValue(["subSetting", "enableSeed"])
                                    }
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={24} className="flex gap-2">
                                <Form.Item
                                  name={["subSetting", "promptOptimize"]}
                                  valuePropName="checked"
                                  initialValue={false}
                                >
                                  <Switch />
                                </Form.Item>
                                <Form.Item
                                  layout="horizontal"
                                  label="自动优化输入"
                                  tooltip="开启后，针对输入提示词进行优化"
                                />
                              </Col>
                              <Col span={24} className="flex gap-2">
                                <Form.Item
                                  name={["subSetting", "enableExpression"]}
                                  valuePropName="checked"
                                  initialValue={false}
                                >
                                  <Switch
                                    onChange={(checked) => {
                                      if (!checked) {
                                        setFieldValue(["subSetting", "widthExpression"], undefined)
                                        setFieldValue(["subSetting", "heightExpression"], undefined)
                                        validateFields(["subSetting", "widthExpression"])
                                        validateFields(["subSetting", "heightExpression"])
                                      }
                                      setFieldValue(
                                        ["subSetting", "imageFormat"],
                                        checked ? "png" : undefined
                                      )
                                    }}
                                  />
                                </Form.Item>
                                <Form.Item
                                  className="flex-1"
                                  layout="horizontal"
                                  label="自定义宽高"
                                  labelCol={{ span: 5 }}
                                  tooltip={{
                                    overlayInnerStyle: {
                                      wordBreak: "break-all",
                                      maxWidth: "400px"
                                    },
                                    title: (
                                      <>
                                        宽高最大不要超过756，宽、高与512差距过大，则出图效果不佳、延迟过长概率显著增加。超分前建议比例及对应宽高：
                                        <br />
                                        【1:1】 512*512
                                        <br />
                                        【4:3】 512*384
                                        <br />
                                        【3:4】 384*512
                                        <br />
                                        【3:2】 512*341
                                        <br />
                                        【2:3】 341*512
                                        <br />
                                        【16:9】 512*288
                                        <br />
                                        【9:16】 288*512
                                      </>
                                    )
                                  }}
                                >
                                  <div className="flex">
                                    <div className="flex-1">
                                      <GlobalVariableSelect
                                        span={
                                          !getFieldValue(["subSetting", "enableExpression"]) ? 2 : 3
                                        }
                                        multiple={false}
                                        isTag
                                        label={"宽"}
                                        placeholder="请选择变量"
                                        message="请选择变量"
                                        formName={["subSetting", "widthExpression"]}
                                        layout="horizontal"
                                        required={
                                          !!getFieldValue(["subSetting", "enableExpression"])
                                        }
                                        disabled={
                                          isDisabled ||
                                          !getFieldValue(["subSetting", "enableExpression"])
                                        }
                                      />
                                    </div>
                                    <span className="ml-[4px] mt-[5px]">px</span>
                                  </div>
                                  <div className="flex">
                                    <div className="flex-1">
                                      <GlobalVariableSelect
                                        span={
                                          !getFieldValue(["subSetting", "enableExpression"]) ? 2 : 3
                                        }
                                        multiple={false}
                                        isTag
                                        label={"高"}
                                        placeholder="请选择变量"
                                        message="请选择变量"
                                        formName={["subSetting", "heightExpression"]}
                                        layout="horizontal"
                                        required={
                                          !!getFieldValue(["subSetting", "enableExpression"])
                                        }
                                        disabled={
                                          isDisabled ||
                                          !getFieldValue(["subSetting", "enableExpression"])
                                        }
                                      />
                                    </div>
                                    <span className="ml-[4px] mt-[5px]">px</span>
                                  </div>
                                  <Form.Item name={["subSetting", "imageFormat"]} hidden>
                                    <Input />
                                  </Form.Item>
                                </Form.Item>
                              </Col>
                              <p className="text-[#98A2B3] mb-[10px]">
                                即梦AI限流（QPS≤2），如有报错请稍后重试
                              </p>
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
                      layout="horizontal"
                      label="是否异步调用"
                      tooltip={{
                        title:
                          "开启后，将通过异步任务调度方式执行，该节点只会返回任务ID，具体生图地址需通过任务ID查询方式获取。"
                      }}
                      labelCol={{
                        span: 5
                      }}
                    >
                      <Form.Item
                        noStyle
                        name="isAsyncTask"
                        valuePropName="checked"
                        initialValue={false}
                      >
                        <Switch
                          size="small"
                          onChange={(checked) => {
                            form.setFieldsValue({ outputName: checked ? "taskld" : "imageUrl" })
                            forceUpdate({})
                          }}
                        />
                      </Form.Item>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="outputName"
                      label="输出变量名"
                      rules={[{ required: true, message: "请输入" }]}
                      initialValue={"imageUrl"}
                    >
                      <Input disabled placeholder="输出变量名" />
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
            formData={formData || []}
            isProcess={false}
            nodeId={targetData.id}
          />
        </div>
      </div>
    </div>
  )
}

export default PicGeneratorComponent
