import React, { useState, useEffect } from "react"
import { Form, Select, Row, Col, Button, Switch, Input, Dropdown, Tooltip } from "antd"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { AddIcon, DeleteIcon, InfoIcon, DragIcon } from "@/components/FormIcon"
import { PlusOutlined } from "@ant-design/icons"
import VariableTextArea from "./VariableTextArea"
import { PromptTips } from "@/constants/tips"
import AIOptimize from "@/components/AIOptimize"
import CustomDivider from "@/components/CustomDivider"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import JSONDiffModal from "@/components/JSONDiffModal"

const { TextArea } = Input

const ProfessionalMode = ({
  form,
  globalData,
  skillFlowData,
  onMouseBlur,
  isDisabled,
  multiModalTypeList = [],
  isOnlyMultiModal = false,
  multiModalWarning = "",
  targetData
}) => {
  const [diffModalVisible, setDiffModalVisible] = useState(false)
  const hasMultiModal = multiModalTypeList && multiModalTypeList.length > 0

  // 获取当前组件的bizNo
  const getCurrentBizNo = () => {
    if (!targetData?.id || !skillFlowData?.skillComponentDefinitions) {
      return undefined
    }
    const currentComponent = skillFlowData.skillComponentDefinitions.find(
      (comp) => comp.nodeId === targetData.id
    )
    return currentComponent?.componentNo
  }

  // 获取当前工作流数据用于对比
  const getCurrentSkillData = () => {
    const formValues = form.getFieldsValue()
    return {
      systemMessage: formValues.systemMessage || "",
      professionalContents: formValues.professionalContents || [],
      skillInfo: {
        skillNo: skillFlowData?.skillNo,
        ...skillFlowData
      }
    }
  }

  // SYSTEM 消息自动回显到 systemMessage
  useEffect(() => {
    const values = form.getFieldsValue()
    if (Array.isArray(values.professionalContents)) {
      // 1. SYSTEM
      const systemItem = values.professionalContents.find((item) => item.role === "system")
      if (systemItem) {
        form.setFieldsValue({
          systemMessage: systemItem.content
        })
      }
      // 2. 过滤并转换 user/assistant
      const list = values.professionalContents
        .filter((item) => item.role !== "system")
        .map((item) => ({
          type: item.role?.toUpperCase() || "USER",
          enableImage: !!item.enableMultiModal,
          imageInputs: item.modals
            ? item.modals.map((m) => ({
                modalType: m.type,
                variable: m.url // 这里按你表单结构调整
              }))
            : undefined,
          content: item.content
        }))
      form.setFieldsValue({
        professionalContents: list
      })
    }
  }, [])

  const messageTypes = [
    {
      value: "USER",
      label: "USER",
      color: "bg-blue-500"
    },
    {
      value: "ASSISTANT",
      label: "ASSISTANT",
      color: "bg-green-500"
    }
  ]

  return (
    <div>
      <CustomDivider showTopLine={false}>
        <span className="text-red-500 mr-1">*</span>
        提示词
      </CustomDivider>

      {/* 多模态警告提示 - 常驻显示 */}
      {multiModalWarning && (
        <div className="mb-[30px] -mt-[15px] p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <span className="text-red-500 text-sm font-medium">⚠️ {multiModalWarning}</span>
          </div>
          <div className="mt-2 text-xs text-red-400">
            注意：提交表单时，已禁用的多模态配置将不会被保存到后端
          </div>
        </div>
      )}

      {/* 固定的SYSTEM消息 */}
      <div className="p-2 pb-1 rounded-md bg-gray-100 -mt-4">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="font-medium text-gray-600 pl-2">SYSTEM</span>
            <InfoIcon className="ml-1" />
          </div>
          <Form.Item
            name="systemMessage"
            rules={[{ required: true, message: "请输入系统消息" }]}
            className="mb-0"
          >
            <VariableTextArea
              variables={globalData}
              disabled={isDisabled}
              onMouseBlur={onMouseBlur}
              onChange={onMouseBlur}
              placeholder="请输入系统提示词，这里定义AI的角色和基本规则..."
              miniInputStyle={{
                border: "none",
                boxShadow: "none",
                backgroundColor: "#f4f4f4"
              }}
            />
          </Form.Item>
        </div>
      </div>

      {/* 动态消息列表 */}
      <Form.List name="professionalContents" initialValue={[{ type: "USER", enableImage: false }]}>
        {(fields, { add, remove, move }) => (
          <div>
            <DragDropContext
              onDragEnd={({ source, destination }) => {
                if (!destination) return
                move(source.index, destination.index)
              }}
            >
              <Droppable droppableId="professionalContents">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <Draggable key={key} draggableId={key.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="mt-4 p-2 pb-1 rounded-md bg-gray-100 border border-gray-200"
                          >
                            <Row gutter={8}>
                              <Col span={1}>
                                <div {...provided.dragHandleProps} className="pt-1">
                                  <Tooltip title="拖动调整顺序">
                                    <DragIcon />
                                  </Tooltip>
                                </div>
                              </Col>
                              <Col span={5}>
                                <Form.Item
                                  {...restField}
                                  name={[name, "type"]}
                                  // rules={[{ required: true, message: "请选择消息类型" }]}
                                  className="mb-0"
                                >
                                  <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => {
                                      const prevType =
                                        prevValues.professionalContents?.[index]?.type
                                      const currentType =
                                        currentValues.professionalContents?.[index]?.type
                                      return prevType !== currentType
                                    }}
                                  >
                                    {({ getFieldValue, setFieldsValue }) => {
                                      const currentType =
                                        getFieldValue(["professionalContents", index, "type"]) ||
                                        "USER"
                                      const enableImage = getFieldValue([
                                        "professionalContents",
                                        index,
                                        "enableImage"
                                      ])
                                      const isMultiModalDisabled =
                                        !!multiModalWarning && enableImage
                                      const currentMessageType = messageTypes.find(
                                        (type) => type.value === currentType
                                      )

                                      return (
                                        <Dropdown
                                          disabled={isMultiModalDisabled}
                                          menu={{
                                            items: messageTypes.map((type) => ({
                                              key: type.value,
                                              label: (
                                                <div className="flex items-center">
                                                  <span
                                                    className={`w-2 h-2 rounded-full ${type.color} mr-2`}
                                                  ></span>
                                                  <span>{type.label}</span>
                                                </div>
                                              ),
                                              style:
                                                type.value === currentType
                                                  ? { backgroundColor: "#F9F5FF" }
                                                  : {}
                                            })),
                                            onClick: ({ key }) => {
                                              const newValues = { ...form.getFieldsValue() }
                                              if (!newValues.professionalContents)
                                                newValues.professionalContents = []
                                              if (!newValues.professionalContents[index])
                                                newValues.professionalContents[index] = {}
                                              newValues.professionalContents[index].type = key
                                              form.setFieldsValue(newValues)
                                            }
                                          }}
                                        >
                                          <div
                                            className={`cursor-pointer text-[14px] text-[#181B25] font-[400] hover:text-[#7f56d9] flex items-center group ${
                                              isMultiModalDisabled
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                            }`}
                                          >
                                            <span className="mr-1 flex items-center">
                                              <span
                                                className={`w-2 h-2 rounded-full ${currentMessageType?.color || "bg-blue-500"} mr-2`}
                                              ></span>
                                              {currentMessageType?.label || "USER"}
                                            </span>
                                            <span className="ml-[8px] flex flex-col">
                                              <i className="iconfont icon-Up text-[10px] text-[#475467] inline-block font-[600] mt-[1px] group-hover:text-[#7f56d9]"></i>
                                              <i className="iconfont icon-Down text-[10px] text-[#475467] inline-block font-[600] -mt-[9px] group-hover:text-[#7f56d9]"></i>
                                            </span>
                                          </div>
                                        </Dropdown>
                                      )
                                    }}
                                  </Form.Item>
                                </Form.Item>
                              </Col>
                              <Col span={18} className="text-right relative">
                                <i
                                  disabled={fields.length <= 1}
                                  className="iconfont icon-shanchu1 text-[14px] text-gray-500 inline-block absolute right-2 top-[6px] cursor-pointer hover:text-red-500"
                                  onClick={() => remove(name)}
                                />
                                <Form.Item
                                  noStyle
                                  shouldUpdate={(prevValues, currentValues) => {
                                    const prevEnable =
                                      prevValues.professionalContents?.[index]?.enableImage
                                    const currentEnable =
                                      currentValues.professionalContents?.[index]?.enableImage
                                    return prevEnable !== currentEnable
                                  }}
                                >
                                  {({ getFieldValue }) => {
                                    const enableImage = getFieldValue([
                                      "professionalContents",
                                      index,
                                      "enableImage"
                                    ])
                                    const isMultiModalDisabled = !!multiModalWarning && enableImage

                                    return (
                                      <div className="flex items-center justify-end mr-7">
                                        <span className="text-[12px] text-gray-500 font-[400]">
                                          图片 / 视频：
                                        </span>
                                        {isMultiModalDisabled && (
                                          <span className="text-[10px] text-red-500 mr-2">
                                            不可用
                                          </span>
                                        )}
                                        <Form.Item
                                          {...restField}
                                          name={[name, "enableImage"]}
                                          valuePropName="checked"
                                          className="mb-1"
                                        >
                                          <Switch
                                            size="small"
                                            checkedChildren="启用"
                                            unCheckedChildren="禁用"
                                            disabled={!hasMultiModal || isMultiModalDisabled}
                                          />
                                        </Form.Item>
                                      </div>
                                    )
                                  }}
                                </Form.Item>
                              </Col>
                            </Row>

                            {/* 条件渲染：根据图片开关状态显示不同内容 */}
                            <Form.Item
                              noStyle
                              shouldUpdate={(prevValues, currentValues) => {
                                const prevEnable =
                                  prevValues.professionalContents?.[index]?.enableImage
                                const currentEnable =
                                  currentValues.professionalContents?.[index]?.enableImage
                                return prevEnable !== currentEnable
                              }}
                            >
                              {({ getFieldValue }) => {
                                const enableImage = getFieldValue([
                                  "professionalContents",
                                  index,
                                  "enableImage"
                                ])
                                const isMultiModalDisabled = !!multiModalWarning && enableImage

                                return enableImage ? (
                                  // 启用图片时：显示模态配置
                                  <div className="mt-2 mb-2">
                                    {isMultiModalDisabled && (
                                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                                        <span>
                                          ⚠️ 当前模型不支持多模态，此配置已保留但提交时将被跳过
                                        </span>
                                      </div>
                                    )}
                                    <Form.List name={[name, "imageInputs"]} initialValue={[{}]}>
                                      {(imageFields, { add: addImage, remove: removeImage }) => (
                                        <>
                                          {imageFields.map(
                                            ({
                                              key: imageKey,
                                              name: imageName,
                                              ...imageRestField
                                            }) => (
                                              <Row key={imageKey} gutter={8} className="flex mb-2">
                                                <Col span={6}>
                                                  <Form.Item
                                                    {...imageRestField}
                                                    name={[imageName, "modalType"]}
                                                    rules={[
                                                      { required: true, message: "请选择模态类型" }
                                                    ]}
                                                    className="mb-0"
                                                  >
                                                    <Select
                                                      placeholder="模态类型"
                                                      onChange={onMouseBlur}
                                                      disabled={isMultiModalDisabled}
                                                    >
                                                      {multiModalTypeList
                                                        ?.filter((m) => m.code !== "TEXT")
                                                        .map((modalTypeItem) => (
                                                          <Select.Option
                                                            key={modalTypeItem.code}
                                                            value={modalTypeItem.code}
                                                          >
                                                            {modalTypeItem.name}
                                                          </Select.Option>
                                                        ))}
                                                    </Select>
                                                  </Form.Item>
                                                </Col>
                                                <Col className="flex-1">
                                                  <GlobalVariableSelect
                                                    formName={[imageName, "variable"]}
                                                    multiple={false}
                                                    required={true}
                                                    onChange={onMouseBlur}
                                                    placeholder="选择流程变量"
                                                    disabled={isMultiModalDisabled}
                                                  />
                                                </Col>
                                                <Col className="mt-1 text-red-500">
                                                  <DeleteIcon
                                                    disabled={
                                                      imageFields.length <= 1 ||
                                                      isMultiModalDisabled
                                                    }
                                                    onClick={() => {
                                                      removeImage(imageName)
                                                      onMouseBlur()
                                                    }}
                                                    size="small"
                                                  />
                                                </Col>
                                              </Row>
                                            )
                                          )}
                                          {!isMultiModalDisabled && (
                                            <Button
                                              type="link"
                                              onClick={() => addImage()}
                                              size="small"
                                              icon={<PlusOutlined />}
                                              className="-pl-1 -mt-1"
                                            >
                                              添加新模态
                                            </Button>
                                          )}
                                        </>
                                      )}
                                    </Form.List>
                                  </div>
                                ) : (
                                  // 禁用图片时：显示消息内容输入框
                                  <Form.Item
                                    {...restField}
                                    name={[name, "content"]}
                                    rules={[{ required: true, message: "请输入消息内容" }]}
                                    className="mt-1 mb-2"
                                  >
                                    <VariableTextArea
                                      variables={globalData}
                                      disabled={isDisabled}
                                      onMouseBlur={onMouseBlur}
                                      onChange={onMouseBlur}
                                      placeholder="请在这里写您的提示词，输入'$'插入变量"
                                      miniInputStyle={{
                                        height: 100,
                                        border: "none",
                                        boxShadow: "none",
                                        backgroundColor: "#f4f4f4"
                                      }}
                                    />
                                  </Form.Item>
                                )
                              }}
                            </Form.Item>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add({ type: "USER", enableImage: false })}
                icon={<PlusOutlined />}
                className="w-full mt-4"
              >
                添加消息
              </Button>
            </Form.Item>
          </div>
        )}
      </Form.List>

      {/* JSON 对比弹窗 */}
      <JSONDiffModal
        visible={diffModalVisible}
        onCancel={() => setDiffModalVisible(false)}
        currentSkill={getCurrentSkillData()}
        globalData={form.getFieldsValue()}
        skillNo={skillFlowData?.skillNo}
        bizNo={getCurrentBizNo()}
      />
    </div>
  )
}

export default ProfessionalMode
