import { useEffect, useState } from "react"
import {
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  Button,
  Divider,
  Tabs,
  TreeSelect,
  Radio
} from "antd"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable, useFetchEnableRerank } from "@/api/skill"
import { useFetchRerankModel } from "@/api/common"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useFetchCatalogList } from "@/api/knowledge"
import { useComponentAndDebugPanel, useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import DynamicFormList from "./DynamicFormList"
import { useCustomVariableType } from "../../hooks"
import { formatCatalogNos } from "@/utils"
import PreJudgment from "./components/PreJudgment"
import { formatSessionParams } from "./utils"
import { Slider } from "antd"
import { InputNumber } from "antd"
import CustomDivider from "@/components/CustomDivider"

const TabPane = Tabs.TabPane

const DocumentSearchComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
  const { data: queryRange } = useFetchCatalogList(skillFlowData?.botNo)

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  const { data: isEnableRerank = false } = useFetchEnableRerank({
    botNo: skillFlowData?.botNo,
    knowledgeType: "2"
  })
  const { data: rerankModelList = [] } = useFetchRerankModel()

  useEffect(() => {
    form.setFieldsValue({
      ...targetData,
      inputParams: targetData?.inputParams?.[0],
      catalogSetType: targetData?.catalogSetType || 0
    })
    forceUpdate({})
  }, [targetData, form])

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      const catalogNos = values.catalogSetType === 0 ? formatCatalogNos(values.catalogNos) : null
      const session = formatSessionParams(globalData, values.sessions)
      const params = {
        ...values,
        catalogNos,

        matchScore: values.matchScore,
        inputParams: [values.inputParams],
        session
      }

      console.log("Received values of form: ", params, values)
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
  const catalogSetType = Form.useWatch("catalogSetType", form)

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
            title={"查询文档组件"}
            containerClass="noPadding"
            showHeaderLine={true}
            onFinish={onFinish}
            disabled={isLocked}
            isLoading={isLoading}
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
                <Row gutter={16}>
                  <Col span={24}>
                    <CustomDivider showTopLine={true}>查询参数</CustomDivider>

                    <Form.Item
                      name="catalogSetType"
                      label="查询方式"
                      labelCol={{
                        span: 4
                      }}
                      initialValue={0}
                    >
                      <Radio.Group>
                        <Radio value={0}>通过目录查询</Radio>
                        <Radio value={1}>通过目录变量查询</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.catalogSetType !== currentValues.catalogSetType
                      }
                    >
                      {({ getFieldValue }) => {
                        const catalogSetType = getFieldValue("catalogSetType")
                        if (catalogSetType === 0) {
                          return (
                            <Form.Item
                              name="catalogNos"
                              label="查询范围"
                              labelCol={{
                                span: 4
                              }}
                              rules={[{ required: false, message: "请选择" }]}
                              tooltip="默认查询全部"
                            >
                              <TreeSelect
                                showSearch
                                style={{ width: "100%" }}
                                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                                placeholder="请选择查询范围"
                                allowClear
                                multiple
                                // treeDefaultExpandAll
                                treeData={queryRange}
                                treeCheckable={true}
                                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                                fieldNames={{
                                  label: "catalogName",
                                  value: "catalogNo",
                                  children: "children"
                                }}
                              />
                            </Form.Item>
                          )
                        } else {
                          return (
                            <GlobalVariableSelect
                              label={"查询目录变量"}
                              span={5}
                              required={true}
                              formName="appointCatalogNo"
                              multiple={false}
                              layout="vertical"
                              disabled={isDisabled}
                            />
                          )
                        }
                      }}
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      labelCol={{
                        span: 4
                      }}
                      name="size"
                      label="查询数量"
                      rules={[
                        { required: true, message: "请输入查询数量" },
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
                      <Input type="number" placeholder="请输入" min={1} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="matchScore"
                      label="匹配分值"
                      layout="horizontal"
                      labelCol={{
                        span: 4
                      }}
                      initialValue={0.85}
                      tooltip="分值越高匹配度越高"
                    >
                      <Row gutter={8}>
                        <Col span={18}>
                          <Form.Item noStyle name="matchScore">
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              marks={{
                                0: "0",
                                0.5: "0.5",
                                1: "1"
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item noStyle name="matchScore">
                            <InputNumber min={0} max={1} step={0.01} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form.Item>
                  </Col>
                  {!!isEnableRerank && (
                    <>
                      <Col span={24}>
                        <Form.Item
                          layout="horizontal"
                          label="启用Rerank"
                          name="enableRerank"
                          labelCol={{ span: 4 }}
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                          prevValues.enableRerank !== currentValues.enableRerank
                        }
                      >
                        {({ getFieldValue }) => {
                          return (
                            !!getFieldValue("enableRerank") && (
                              <Col span={24}>
                                <Form.Item
                                  name="rerankModel"
                                  initialValue={rerankModelList?.[0]?.code}
                                >
                                  <Select
                                    placeholder="请选择Rerank模型"
                                    options={rerankModelList}
                                    fieldNames={{ label: "name", value: "code" }}
                                  />
                                </Form.Item>
                              </Col>
                            )
                          )
                        }}
                      </Form.Item>
                    </>
                  )}
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
                  <span className="item-title">数组中每个元素包含的字段：</span>
                  <div className="mt-2">
                    <span className="item-title">知识库编号：</span>
                    <span className="item-value">knowledgeBaseNo</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">目录编号：</span>
                    <span className="item-value">catalogNo</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">文档标题：</span>
                    <span className="item-value">title</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">文档编号：</span>
                    <span className="item-value">documentNo</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">文档分块编号：</span>
                    <span className="item-value">shardingNo</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">文档分块内容：</span>
                    <span className="item-value">shardingContent</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">相似度匹配分数：</span>
                    <span className="item-value">score</span>
                  </div>
                </div>
              </TabPane>
              <TabPane tab="后置处理" key="2" forceRender>
                <DynamicFormList form={form} varOptions={varOptions} />
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

export default DocumentSearchComponent
