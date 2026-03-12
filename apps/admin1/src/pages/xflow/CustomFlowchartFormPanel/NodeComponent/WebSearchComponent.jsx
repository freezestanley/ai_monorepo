import { useEffect, useState } from "react"
import { Form, Input, Row, Col, Tabs, Select } from "antd"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useWebSearchEngineType } from "@/api/common"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { useCustomVariableType } from "../../hooks"
import { formatSessionParams } from "./utils"
import PreJudgment from "./components/PreJudgment"
import DynamicFormList from "./DynamicFormList"
import FallbackHandler from "./FallbackHandler"
import CustomDivider from "@/components/CustomDivider"

const TabPane = Tabs.TabPane

const WebSearchComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)

  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
  const { data: engineTypeOptions } = useWebSearchEngineType()

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  useEffect(() => {
    form.setFieldsValue({
      ...targetData,
      inputParams: targetData?.inputParams?.[0]
    }) // assuming targetData fields match with form fields
    forceUpdate({})
  }, [targetData, form])

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      const session = formatSessionParams(globalData, values.sessions)
      console.log("Received values of form: ", values)
      const params = {
        ...values,
        inputParams: [values.inputParams],
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
            title={"Web搜索组件"}
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
                    <Form.Item
                      name="engine"
                      label="Web搜索类型"
                      rules={[{ required: true, message: "请选择Web搜索类型" }]}
                    >
                      <Select placeholder="请选择Web搜索类型">
                        {engineTypeOptions?.map((item) => (
                          <Select.Option key={item.code} value={item.code}>
                            {item.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <CustomDivider showTopLine={true}>输入参数</CustomDivider>
                    <GlobalVariableSelect
                      label={"输入"}
                      span={3}
                      formName="inputParams"
                      multiple={false}
                      layout="vertical"
                      disabled={isDisabled}
                    />
                  </Col>
                </Row>
                <CustomDivider showTopLine={true}>输出参数</CustomDivider>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="输出结果类型" className="mb-2">
                      <Input value="JSON数组" disabled={true} />
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
                <div className="bg-[#F5F7FA] p-2 rounded-md">
                  <div>
                    <span className="item-title">数组中每个元素包含的字段</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">搜索结果的标题：</span>
                    <span className="item-value">title</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">搜索结果的网址：</span>
                    <span className="item-value">url</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">搜索结果的摘要：</span>
                    <span className="item-value">snippet</span>
                  </div>
                </div>
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

export default WebSearchComponent
