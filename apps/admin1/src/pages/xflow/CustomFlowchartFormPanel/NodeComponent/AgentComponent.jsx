import { Button, Col, Divider, Flex, Form, Input, Row, Select, Tabs } from "antd"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { useFormData } from "../../hooks/useInputFormData"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import { useCurrentSkillLockInfo } from "@/store"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import AgentDebugComponent from "@/pages/agentWorkbench/components/AgentDebugComponent"
import { useFetchAgentListForReleased } from "@/api/agent"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import { useFetchGlobalVariable } from "@/api/skill"
import { useEffect, useRef, useState } from "react"
import { ClearOutlined } from "@ant-design/icons"
import { useCustomVariableType } from "../../hooks"
import { formatSessionParams } from "./utils"
import PreJudgment from "./components/PreJudgment"
import DynamicFormList from "./DynamicFormList"

const TabPane = Tabs.TabPane

function AgentComponent({ targetData, appData, commandService }) {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})
  const [agentData, setAgentData] = useState({})
  const debugRef = useRef(null)

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  const { data: agentList = [] } = useFetchAgentListForReleased({
    botNo: skillFlowData.botNo,
    pageSize: 100,
    pageNum: 1
  })

  useEffect(() => {
    form.setFieldsValue({
      ...targetData,
      inputParams: targetData?.inputParams?.[0]
    })
    if (targetData.agentNo && agentList.length > 0) {
      const agent = agentList.find((item) => item.agentNo === targetData.agentNo)
      setAgentData({
        agentNo: targetData.agentNo,
        versionNo: agent?.currentVersionNo
      })
    }
  }, [targetData, form, agentList])

  const onAgentSelectChange = (agentNo) => {
    const agent = agentList.find((item) => item.agentNo === agentNo)
    setAgentData({
      agentNo,
      versionNo: agent?.currentVersionNo
    })
  }

  const onResetSession = () => {
    if (debugRef.current && debugRef.current.resetSession) {
      debugRef.current.resetSession()
    }
  }

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
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
    })
  }
  useSaveShortcut(onFinish, isLoading)
  const { data: varOptions = [] } = useCustomVariableType()

  return (
    <div className="search-node-wrapper">
      <div className="base-node-comp">
        <Form form={form} onFinish={onFinish} labelCol={{ span: 10 }} disabled={isDisabled}>
          <CommonContent
            title={"Agent组件"}
            containerClass="noPadding"
            extraRender={() => (
              <Button type="primary" htmlType="submit" loading={isLoading} disabled={isLocked}>
                保存
              </Button>
            )}
          >
            <Tabs defaultActiveKey="1" type="card">
              <TabPane tab="组件设置" key="1" forceRender>
                <PreJudgment form={form} />
                <Divider>基础设置</Divider>
                {/* <Divider>选择Agent</Divider> */}
                <Row className="mt-3">
                  <Col span={24}>
                    <Form.Item
                      labelCol={{
                        span: 3
                      }}
                      name="agentNo"
                      label="Agent"
                      rules={[{ required: true, message: "请选择Agent" }]}
                    >
                      <Select placeholder="请选择Agent" onChange={onAgentSelectChange}>
                        {agentList?.map((item) => (
                          <Select.Option key={item.agentNo} value={item.agentNo}>
                            {item.agentName}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Divider>输入参数</Divider>
                <Col span={24}>
                  <GlobalVariableSelect
                    label={"输入"}
                    span={3}
                    formName="inputParams"
                    multiple={false}
                    disabled={isDisabled}
                  />
                </Col>
                <Divider>输出参数</Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="输出变量名类型"
                      labelCol={{
                        span: 12
                      }}
                    >
                      <span>String</span>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      labelCol={{
                        span: 8
                      }}
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
        </Form>
        <div className="absolute debug-panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="header w-full">
            <Flex justify="space-between" className="w-full" align="center">
              <div>组件调试</div>
              <Button onClick={onResetSession} type="text" icon={<ClearOutlined />}>
                清空会话
              </Button>
            </Flex>
          </div>
          <AgentDebugComponent
            botNo={skillFlowData?.botNo}
            agentNo={agentData.agentNo}
            versionNo={agentData.versionNo}
            ref={debugRef}
          />
        </div>
      </div>
    </div>
  )
}

export default AgentComponent
