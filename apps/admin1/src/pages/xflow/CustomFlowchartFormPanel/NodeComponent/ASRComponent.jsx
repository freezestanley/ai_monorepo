import { useEffect, useState } from "react"
import { Form, Input, Row, Col, Button, Divider, Tabs, Switch, Radio, Tooltip } from "antd"
import { QuestionCircleOutlined } from "@ant-design/icons"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { useCustomVariableType } from "../../hooks"
import { formatSessionParams } from "./utils"
import PreJudgment from "./components/PreJudgment"
import DynamicFormList from "./DynamicFormList"
import { Select } from "antd"
import FallbackHandler from "./FallbackHandler"
import CustomDivider from "@/components/CustomDivider"

const TabPane = Tabs.TabPane

const ASRComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})
  const [timeReturned, setTimeReturned] = useState(form.getFieldValue("timeReturned") || false)

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  useEffect(() => {
    form.setFieldsValue({
      ...targetData,
      inputParams: targetData?.inputParams?.[0]
    }) // assuming targetData fields match with form fields
    forceUpdate({})
  }, [targetData, form])

  // 保证 timeReturned 与表单联动，详情回显时也能正确显示
  useEffect(() => {
    const value = form.getFieldValue("timeReturned")
    setTimeReturned(value === true)
  }, [form])

  // 监听 timeReturned 字段变化
  useEffect(() => {
    const unsubscribe = form.subscribe?.(() => {
      const value = form.getFieldValue("timeReturned")
      setTimeReturned(value === true)
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [form])

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      console.log("Received values of form: ", values)
      const session = formatSessionParams(globalData, values.sessions)
      const params = {
        ...values,
        inputParams: [values.inputParams],
        session
      }
      updateNodeComp(
        {
          ...targetData,
          ...params,
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

  return (
    <div className="common-node-wrapper">
      <div className="base-node-comp ">
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 24 }}
          disabled={isDisabled}
          initialValues={{
            sampleRate: 8000
          }}
          layout="vertical"
        >
          <CommonContent
            title={"ASR音转文组件"}
            containerClass="noPadding"
            onFinish={onFinish}
            isLoading={isLoading}
            disabled={isLocked}
          >
            <Tabs defaultActiveKey="1" type="line">
              <TabPane tab="组件设置" key="1" forceRender>
                <PreJudgment form={form} />
                <CustomDivider showTopLine={true}>基础设置</CustomDivider>
                <div className="p-2 text-sm text-gray-500 rounded-md bg-gray-100">
                  <p className="font-bold text-red-500">注意：</p>
                  模型类型，前缀8k/16k为针对对应采样率进行过优化，经过验证若实际音频为16000但是选用8k模型会使得结果无法接受，但是部分语种只有16k选项，可以识别8k采样率的音频，效果请预先验证
                </div>
                <Row className="mt-3">
                  <Col span={24}>
                    <Form.Item
                      labelCol={{
                        span: 4
                      }}
                      name="label"
                      label="组件名"
                      tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
                      rules={[{ required: true, message: "请输入组件名" }]}
                    >
                      <Input placeholder="输入组件名" />
                    </Form.Item>
                    <Form.Item
                      labelCol={{
                        span: 4
                      }}
                      name="model"
                      label="选择模型"
                      rules={[{ required: true, message: "请选择模型" }]}
                      initialValue="tencent_zh_8k"
                    >
                      <Select placeholder="请选择模型" showSearch optionFilterProp="children">
                        <Select.Option value="tencent_zh_8k">
                          tencent_zh_8k (中文通用)
                        </Select.Option>
                        <Select.Option value="tencent_zh_16k">tencent_zh_16k</Select.Option>
                        <Select.Option value="tencent_en_8k">
                          tencent_en_8k (英文通用)
                        </Select.Option>
                        <Select.Option value="tencent_en_16k">tencent_en_16k</Select.Option>
                        <Select.Option value="tencent_zh_large_8k">
                          tencent_zh_large_8k (普方【大模型版】)
                        </Select.Option>
                        <Select.Option value="tencent_jp_16k">tencent_jp_16k (日语)</Select.Option>
                        <Select.Option value="tencent_yue_16k">
                          tencent_yue_16k (粤语)
                        </Select.Option>
                        <Select.Option value="tencent_zh_finance_8k">
                          tencent_zh_finance_8k
                        </Select.Option>
                        <Select.Option value="ali_yue_8k">ali_yue_8k</Select.Option>
                        <Select.Option value="ali_jp_16k">ali_jp_16k</Select.Option>
                        <Select.Option value="ali_zh_8k">ali_zh_8k</Select.Option>
                      </Select>
                    </Form.Item>
                    {/* <Form.Item name="sceneId" label="场景ID">
                      <Input placeholder="请输入场景ID" />
                    </Form.Item> */}
                    <Form.Item name="sampleRate" label="音频采样率">
                      <Select
                        defaultValue={8000}
                        placeholder="请选择音频采样率"
                        options={[
                          { value: 8000, label: "8000Hz" },
                          { value: 16000, label: "16000Hz" },
                          { value: 32000, label: "32000Hz" }
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      name="hotWordId"
                      label="热词ID"
                      tooltip="后续开放标注，目前有热词需求联系 @陶激扬"
                    >
                      <Input placeholder="请输入热词ID" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="dissociation"
                      label="人声分离"
                      valuePropName="checked"
                      initialValue={true}
                      layout="horizontal"
                      labelCol={{
                        span: 6
                      }}
                    >
                      <Switch defaultChecked />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="recognizeAllChannel"
                      label="多声道识别"
                      valuePropName="checked"
                      initialValue={false}
                      layout="horizontal"
                      labelCol={{
                        span: 8
                      }}
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <CustomDivider showTopLine={true}>输入参数</CustomDivider>
                    <GlobalVariableSelect
                      label={"输入"}
                      span={4}
                      formName="inputParams"
                      multiple={false}
                      className={undefined}
                      onChange={undefined}
                      style={undefined}
                      initialValue={undefined}
                      layout="vertical"
                      tooltip={"支持的文件地址格式：mp3，wav，amr，m4a"}
                      disabled={isDisabled}
                    />
                  </Col>
                </Row>
                <CustomDivider showTopLine={true}>输出参数</CustomDivider>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="timeReturned"
                      label="输出格式"
                      initialValue={false}
                      className="mb-2"
                    >
                      <Radio.Group
                        onChange={(e) => setTimeReturned(e.target.value)}
                        value={timeReturned}
                      >
                        <Radio value={false}>
                          标准
                          <Tooltip title="标准模式下，返回【人物角色】 + 【内容】">
                            <QuestionCircleOutlined className="ml-1 text-gray-400" />
                          </Tooltip>
                        </Radio>
                        <Radio value={true}>
                          原生
                          <Tooltip title="原生模式下，返回【任务角色】+ 【时间】+【内容】">
                            <QuestionCircleOutlined className="ml-1 text-gray-400" />
                          </Tooltip>
                        </Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={timeReturned ? "输出结果类型" : "输出结果类型"}
                      className="mb-2"
                    >
                      <Input value={timeReturned ? "timeReturned" : "字符串"} disabled={true} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="outputName"
                      label="输出变量名"
                      rules={[{ required: true, message: "请输入" }]}
                      className="mb-2"
                    >
                      <Input placeholder="输出变量名" />
                    </Form.Item>
                  </Col>
                </Row>

                {timeReturned && (
                  <div className="bg-[#F5F7FA] p-2 rounded-md mt-2">
                    <div>
                      <span className="item-title">JSON对象包含字段：</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">音频时长：</span>
                      <span className="item-value">duration</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">声道识别结果：</span>
                      <span className="item-value">result</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">错误：</span>
                      <span className="item-value">error</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">声道ID：</span>
                      <span className="item-value">result[].channelId</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">声道完整文本：</span>
                      <span className="item-value">result[].text</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">声道识别单句：</span>
                      <span className="item-value">result[].sentences</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">单句文本：</span>
                      <span className="item-value">result[].sentences[].text</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">单句开始时间：</span>
                      <span className="item-value">result[].sentences[].startTime</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">单句结束时间：</span>
                      <span className="item-value">result[].sentences[].endTime</span>
                    </div>
                    <div className="mt-2">
                      <span className="item-title">单句说话人ID：</span>
                      <span className="item-value">result[].sentences[].speakerId</span>
                    </div>
                  </div>
                )}
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
            nodeId={targetData.id}
            preview={false}
            isProcess={false}
            formData={formData}
            onFinish={onFinish}
          />
        </div>
      </div>
    </div>
  )
}

export default ASRComponent
