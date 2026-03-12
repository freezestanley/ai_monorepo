import { useEffect, useState } from "react"
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
  Alert
} from "antd"
import { MinusCircleOutlined } from "@ant-design/icons"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useCustomVariableType } from "../../hooks"
import { useFormData } from "../../hooks/useInputFormData"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import { useFetchGlobalVariable } from "@/api/skill"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction, omit } from "lodash"
import { CommonContent } from "../CommonContent"
import RecursiveInputList from "@/components/RecursiveInputList"
import { useFetchOutputType } from "@/api/common"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import DynamicFormList from "./DynamicFormList"
import PreJudgment from "./components/PreJudgment"
import { formatSessionParams } from "./utils"
import FallbackHandler from "./FallbackHandler"
import CustomDivider from "@/components/CustomDivider"
import { AddIcon, DeleteIcon } from "@/components/FormIcon"
import { QuestionCircleOutlined } from "@ant-design/icons"
const TabPane = Tabs.TabPane

const WebhookComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})

  useEffect(() => {
    console.log(targetData)
    form.setFieldsValue({
      ...targetData,
      // 1109版本Webhook处理数据兼容
      inputItems: targetData?.inputItems?.map((item) => ({
        ...item,
        variableValueType: item.variableValueType || item.variableType
      }))
    })
    forceUpdate({})
  }, [targetData, form])

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
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
          inputParams,
          outputType: "JSON",
          label: values.componentName,
          isAsync: values.isAsync,
          session,
          sessions
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
            title={
              <div>
                Webhook组件
                <span className="text-red-600">【注意：组件已计划下线】</span>
              </div>
            }
            containerClass="noPadding"
            onFinish={onFinish}
            isLoading={isLoading}
            disabled={isLocked}
          >
            <div className="p-2">
              <Alert
                message="Webhook组件已计划下线，请在【工具】模块配置后，通过【调用工具】组件来完成工作流配置；【工具】支持请求头及路径变量"
                type="error"
              />
            </div>
            <Tabs defaultActiveKey="1" type="line">
              <TabPane tab="组件设置" key="1">
                <PreJudgment form={form} />
                <CustomDivider showTopLine={true}>基础设置</CustomDivider>
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
                <Row className="mt-3" gutter={8}>
                  <Col span={12}>
                    <Form.Item
                      name="callUrl"
                      label="调用地址"
                      rules={[{ required: true, message: "请输入调用地址" }]}
                    >
                      <Input placeholder="请输入调用地址" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="protocol"
                      label="协议"
                      rules={[{ required: true, message: "请选择协议" }]}
                    >
                      <Select placeholder="请选择协议">
                        {["http", "https"].map((method) => (
                          <Select.Option key={method} value={method}>
                            {method}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="httpMethodName"
                      label="调用方式"
                      rules={[{ required: true, message: "请选择调用方式" }]}
                    >
                      <Select placeholder="请选择调用方式">
                        {["get", "post", "put", "delete"].map((method) => (
                          <Select.Option key={method} value={method}>
                            {method}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="retryCount"
                      label="重试次数"
                      rules={[
                        { required: true, message: "请输入重试次数" },
                        {
                          validator: (_, value) =>
                            !value || value <= 5
                              ? Promise.resolve()
                              : Promise.reject(new Error("重试次数不得超过5次"))
                        }
                      ]}
                    >
                      <InputNumber placeholder="请输入重试次数" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="retryInterval"
                      label="重试间隔(秒)"
                      rules={[
                        { required: true, message: "请输入重试间隔" },
                        {
                          validator: (_, value) =>
                            !value || value <= 5
                              ? Promise.resolve()
                              : Promise.reject(new Error("重试间隔不得超过5秒"))
                        }
                      ]}
                    >
                      <InputNumber placeholder="请输入重试间隔" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="readTimeout"
                      label="接口超时时间(秒)"
                      rules={[
                        { required: true, message: "请输入接口超时时间" },
                        {
                          validator: (_, value) =>
                            !value || value <= 60
                              ? Promise.resolve()
                              : Promise.reject(new Error("接口超时时间不得超过60秒"))
                        }
                      ]}
                    >
                      <InputNumber placeholder="请输入" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      // name="parseMode"
                      label="解析方式"
                    >
                      <Input value="JSON" disabled={true} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="isAsync"
                      labelCol={{ span: 11 }}
                      wrapperCol={{ span: 13 }}
                      layout="horizontal"
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

                <CustomDivider showTopLine={true}>请求头配置</CustomDivider>
                <Form.List name="headers">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field) => (
                        <Row key={field.key} gutter={8}>
                          <Col style={{ width: 258 }}>
                            <Form.Item
                              name={[field.name, "key"]}
                              rules={[{ required: false, message: "请输入Key" }]}
                            >
                              <Input placeholder="Key" />
                            </Form.Item>
                          </Col>
                          <Col style={{ width: 258 }}>
                            <Form.Item
                              name={[field.name, "value"]}
                              rules={[{ required: false, message: "请输入Value" }]}
                            >
                              <Input placeholder="Value" />
                            </Form.Item>
                          </Col>
                          {!isDisabled && (
                            <Col style={{ width: 20, paddingTop: 6 }}>
                              <DeleteIcon onClick={() => remove(field.name)} />
                            </Col>
                          )}
                        </Row>
                      ))}
                      <Form.Item>
                        <AddIcon text="添加请求头" onClick={() => add()} />
                      </Form.Item>
                    </>
                  )}
                </Form.List>

                <CustomDivider showTopLine={true}>输入项配置</CustomDivider>
                <Form.Item name="inputItems">
                  <RecursiveInputList form={form} varOptions={varOptions} name="inputItems" />
                </Form.Item>
                <CustomDivider showTopLine={true}>输出项配置</CustomDivider>

                <Row gutter={8}>
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
                      initialValue={"JSON"}
                    >
                      <Select placeholder="请选择解析方式">
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
                      labelCol={{
                        span: 8
                      }}
                      name="outputName"
                      label="输出变量名"
                      rules={[
                        {
                          required: false,
                          message: "请输入"
                        }
                      ]}
                    >
                      <Input placeholder="请输入" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="outputParams">
                  <RecursiveInputList varOptions={varOptions} name="outputParams" />
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
            isProcess={false}
            isJSONDebug={true}
          />
        </div>
      </div>
    </div>
  )
}

export default WebhookComponent
