import { useEffect, useState } from "react"
import { Form, Input, Button, Divider, Tooltip, Space } from "antd"
import "./index.scss"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useFormModified from "../../hooks/useFormModified"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { CommonContent } from "../CommonContent"
import { useComponentAndDebugPanel, useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { useFetchGlobalVariable } from "@/api/skill"

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { MenuOutlined } from "@ant-design/icons"
import { DragIcon } from "@/components/FormIcon"
import CustomDivider from "@/components/CustomDivider"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import VariableInput from "./components/VariableInput"

export default function ConditionNode({ targetData, commandService, appData }) {
  const [form] = Form.useForm()
  const location = useLocation()
  const { skillNo } = queryString.parse(location.search)
  const graphData = JSON.parse(localStorage.getItem(`graphData_${skillNo}`)) || {
    nodes: [],
    edges: []
  }

  const [isModified, handleValuesChange, currentValuesRef] = useFormModified()

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  const [fields, setFields] = useState([])

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  const genParams = (values) => {
    const { label, ...res } = values
    const params = {
      label,
      expressions: fields.map(({ id }) => ({
        nextNodeId: id,
        expression: res[id]
      }))
    }

    return params
  }

  const onFinish = () => {
    return form.validateFields().then((values) => {
      console.log("Received values of form: ", values)
      const params = genParams(values)
      console.log(params, values)
      updateNodeComp({ ...targetData, ...values, ...params })
    })
  }

  const onDragEnd = (result) => {
    if (!result.destination) return
    const newFields = Array.from(fields)
    const [reorderedField] = newFields.splice(result.source.index, 1)
    newFields.splice(result.destination.index, 0, reorderedField)
    setFields(newFields)
  }

  useEffect(() => {
    return () => {
      console.log("卸载的时候打印一下modified", isModified)
      if (isModified) {
        // @ts-ignore
        const values = currentValuesRef.current
        const params = genParams(values)
        // updateNodeComp({ ...targetData, ...values, ...params })
      }
    }
  }, [isModified])

  useSaveShortcut(onFinish, isLoading)

  const getFormField = () => {
    const { outgoingEdges = [], expressions = [] } = targetData
    const { nodes, edges } = graphData
    const orderEdges = outgoingEdges?.sort((a, b) => {
      const indexA = expressions.findIndex((item) => item.nextNodeId === a.target.cell)
      const indexB = expressions.findIndex((item) => item.nextNodeId === b.target.cell)

      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    })

    const fieldData = orderEdges
      ?.map((item) => {
        const { target } = item
        const { cell } = target
        return nodes.find((node) => node.id === cell)
      })
      .filter(Boolean)
      .filter((item) => edges?.some((edge) => edge?.target?.cell === item.id))

    setFields(fieldData)
  }

  useEffect(() => {
    getFormField()
    form.setFieldsValue(targetData)
  }, [targetData, form])

  return (
    <div className="common-node-wrapper">
      <div className="base-node-comp">
        <DragDropContext onDragEnd={onDragEnd}>
          <Form
            onFinish={onFinish}
            form={form}
            disabled={isDisabled}
            // @ts-ignore
            onValuesChange={handleValuesChange}
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
            className="h-full"
            layout="vertical"
          >
            <CommonContent
              title={"条件节点"}
              showDebuggerButton={false}
              showHeaderLine={true}
              onFinish={onFinish}
              isLoading={isLoading}
              disabled={isLocked}
            >
              <Form.Item
                label="节点名"
                name="label"
                tooltip={"需要先定义后续节点,才能配置判断条件"}
                rules={[{ required: true, message: "请输入节点名!" }]}
              >
                <Input placeholder="请输入节点名" />
              </Form.Item>
              <CustomDivider showTopLine={true}>
                后续节点
                <Tooltip
                  title={
                    <>
                      条件组件表达式语法：
                      <br />
                      1. 判断对象、字符串、数组/集合非空: &quot;obj&quot;，如&quot;${"{"}
                      input_language{"}"}&quot;。
                      <br />
                      2. 非逻辑操作前加&quot;!&quot;: 判断空，如&quot;!${"{"}input_language{"}"}
                      &quot;。
                      <br />
                      3. 判断等值: &quot;==&quot;，不等: &quot;!=&quot;，如&quot;${"{"}
                      input_language{"}"} == &apos;en&apos;&quot;。
                      <br />
                      4. 多逻辑同时满足: &quot;&&&quot;，至少一逻辑满足: &quot;||&quot;，如&quot;$
                      {"{"}
                      input_language{"}"} == &apos;en&apos; && ${"{"}aaa{"}"} == 1&quot;。
                      <br />
                      5. 安全访问对象属性/方法: &quot;?.&quot;，如&quot;${"{"}user{"}"}
                      ?.name&quot;。
                      <br />
                      6. 判断元素是否在集合/范围中: &quot;xxx in list/map/range&quot;，如&quot;1 in
                      [1,2,3,4]&quot;或&quot;&apos;a&apos; in [a: 1, b: 2, c: 3]&quot;。
                    </>
                  }
                  className="ml-2"
                  overlayStyle={{ maxWidth: "none" }}
                >
                  <QuestionCircleOutlined />
                </Tooltip>
              </CustomDivider>

              <Droppable droppableId="formFields" isDropDisabled={isDisabled}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {fields?.map((data, index) => (
                      <Draggable key={data.id} draggableId={data.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center w-full"
                          >
                            <div {...provided.dragHandleProps} className="mr-2 pt-1">
                              <DragIcon />
                            </div>

                            <Form.Item
                              className="flex-1"
                              key={index}
                              label={`${data?.label}`}
                              name={`${data?.id}`}
                              rules={[
                                {
                                  required: true,
                                  message: `请输入${data?.label}的判断条件!`
                                }
                              ]}
                            >
                              <VariableInput
                                variables={globalData}
                                disabled={isDisabled}
                                placeholder="请输入表达式"
                              />
                            </Form.Item>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CommonContent>
          </Form>
        </DragDropContext>
      </div>
    </div>
  )
}
