import { useEffect, useState } from "react"
import { Form, Input, Select, Row, Col, Button, Divider, Space, Tabs } from "antd"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useCustomTools } from "../../hooks"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable, useFetchTableFileType } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined
} from "@ant-design/icons"
import { uuidv4 } from "@antv/xflow"
import { useFetchPictureModelType } from "@/api/common"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { useCustomVariableType } from "../../hooks"
import { formatSessionParams } from "./utils"
import PreJudgment from "./components/PreJudgment"
import DynamicFormList from "./DynamicFormList"
import CustomDivider from "@/components/CustomDivider"
import { AddIcon, DeleteIcon, DragIcon } from "@/components/FormIcon"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

const TabPane = Tabs.TabPane

const ToolComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)

  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
  const { data: tableFileType = [] } = useFetchTableFileType()

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
          globalDataOptions: globalData,
          ext: values.toolCode === "table_doc_save" ? values.ext : undefined,
          headers: values.toolCode === "table_doc_save" ? values.headers : undefined,
          pictureModelType:
            values.toolCode === "pic_generator" ? values.pictureModelType : undefined
        },
        callbackFunc,
        noMessage
      )
      forceUpdate({})
    })
  }

  const handleSelectTool = (value) => {
    // 如果是pic_generatord的情况,则给输出变量名赋值为imageUrl
    if (form.getFieldValue("toolCode") === "pic_generator") {
      form.setFieldsValue({
        outputName: "imageUrl"
      })
    } else {
      form.setFieldsValue({
        outputName: ""
      })
    }
    forceUpdate({})
  }

  const { data: toolOptions = [] } = useCustomTools()
  const { data: pictureModelTypeList = [] } = useFetchPictureModelType()
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
            title={"Tool组件"}
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
                      name="toolCode"
                      label="工具类型"
                      rules={[{ required: true, message: "请选择工具类型" }]}
                    >
                      <Select placeholder="请选择工具类型" onChange={handleSelectTool}>
                        {toolOptions
                          // 隐藏图片生成选项，存量配置不错
                          .filter((item) =>
                            targetData?.toolCode === "pic_generator"
                              ? true
                              : item.code !== "pic_generator"
                          )
                          .map((type) => (
                            <Select.Option key={type.code} value={type.code}>
                              {type.name}
                            </Select.Option>
                          ))}
                      </Select>
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

                  {form.getFieldValue("toolCode") === "pic_generator" && (
                    <Col span={24}>
                      <Form.Item
                        name="pictureModelType"
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
                    </Col>
                  )}

                  {/* toolCode 为 table_doc_save 才展示输出格式以及表头 */}
                  {form.getFieldValue("toolCode") === "table_doc_save" && (
                    <>
                      <Col span={24}>
                        <Form.Item
                          name="ext"
                          label="输出格式"
                          rules={[{ required: true, message: "请选择输出格式" }]}
                        >
                          <Select placeholder="请选择输出格式">
                            {tableFileType.map((type) => (
                              <Select.Option key={type.code} value={type.code}>
                                {type.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item label={"表头"} rules={[{ required: true }]}>
                          <Form.List
                            name={["headers"]}
                            initialValue={[{ name: "", valueExpression: "" }]}
                          >
                            {(fields, { add, remove, move }) => (
                              <DragDropContext
                                onDragEnd={({ source, destination }) => {
                                  if (!destination) return
                                  move(source.index, destination.index)
                                }}
                              >
                                <Droppable droppableId="table-headers" isDropDisabled={isDisabled}>
                                  {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                      {fields.map((field, index) => (
                                        <Draggable
                                          key={field.key}
                                          draggableId={field.key.toString()}
                                          index={index}
                                        >
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                            >
                                              <Space align="start">
                                                <div {...provided.dragHandleProps} className="pt-1">
                                                  <DragIcon />
                                                </div>
                                                <Form.Item
                                                  {...field}
                                                  name={[field.name, "name"]}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message: "请输入表头"
                                                    }
                                                  ]}
                                                  style={{ width: "240px" }}
                                                >
                                                  <Input placeholder="请输入表头" />
                                                </Form.Item>
                                                <Form.Item
                                                  {...field}
                                                  name={[field.name, "valueExpression"]}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message: "请输入取值表达式"
                                                    }
                                                  ]}
                                                  style={{ width: "250px" }}
                                                >
                                                  <Input placeholder="取值表达式" />
                                                </Form.Item>
                                                <div className="pt-1">
                                                  {index !== 0 && !isDisabled && (
                                                    <DeleteIcon
                                                      onClick={() => remove(field.name)}
                                                    />
                                                  )}
                                                </div>
                                              </Space>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                      {!isDisabled && (
                                        <AddIcon text="添加表头" onClick={() => add()} />
                                      )}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>
                            )}
                          </Form.List>
                        </Form.Item>
                      </Col>
                    </>
                  )}
                </Row>
                <CustomDivider showTopLine={true}>输出变量</CustomDivider>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="outputName"
                      label="输出变量名"
                      rules={[{ required: true, message: "请输入" }]}
                    >
                      <Input
                        disabled={isDisabled || form.getFieldValue("toolCode") === "pic_generator"}
                        placeholder="输出变量名"
                      />
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

export default ToolComponent
