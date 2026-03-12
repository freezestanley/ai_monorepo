import React, { useState, useEffect, useMemo } from "react"
import { Button, Tooltip, Modal, Input } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import MDEditor from "@uiw/react-md-editor"
import AIOptimize from "@/components/AIOptimize"
import { DragIcon } from "@/components/FormIcon"
import VoiceQuickMode from "./VoiceQuickMode"
import Iconfont from "@/components/Icon"
import VariableTextArea from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/VariableTextArea"

const VoiceDetailEditor = ({
  onOptimizeSubmit,
  agentPromptConfig,
  onEditorBlur,
  markdownContent,
  setMarkdownContent,
  agentNo,
  disabled,
  form,
  globalData,
  multiModalTypeList,
  initialStepInfos = [],
  onStepInfosChange
}) => {
  const [voiceQuickModes, setVoiceQuickModes] = useState([])
  const [stepInfos, setStepInfos] = useState(initialStepInfos || [])
  const [isModalVisible, setIsModalVisible] = useState(false)

  // 监听agentPromptConfig变化，处理回显逻辑
  useEffect(() => {
    if (agentPromptConfig) {
      // 回显prompt到MDEditor
      if (agentPromptConfig.prompt && setMarkdownContent) {
        setMarkdownContent(agentPromptConfig.prompt)
      }

      // 回显stepInfos到VoiceQuickMode组件
      if (agentPromptConfig.stepInfos && agentPromptConfig.stepInfos.length > 0) {
        const configStepInfos = agentPromptConfig.stepInfos
        setStepInfos(configStepInfos)

        // 根据stepInfos数量调整voiceQuickModes
        const newVoiceQuickModes = configStepInfos.map((_, index) => ({ id: index + 1 }))
        setVoiceQuickModes(newVoiceQuickModes)

        // 使用 setTimeout 确保组件渲染完成后再设置表单值
        setTimeout(() => {
          const formValues = {}
          configStepInfos.forEach((step, index) => {
            formValues[index] = {
              stepName: step.stepName || "",
              stepCode: step.stepCode || "",
              content: step.content || ""
            }
          })
          form.setFieldsValue(formValues)
        }, 0)

        // 通知父组件stepInfos变化
        onStepInfosChange?.(configStepInfos)
      } else {
        // 如果没有stepInfos，保持voiceQuickModes为空数组
        setVoiceQuickModes([])
        setStepInfos([])
      }
    }
  }, [agentPromptConfig, form, setMarkdownContent])

  // 监听initialStepInfos变化（保持原有逻辑作为备用）
  useEffect(() => {
    if (initialStepInfos && initialStepInfos.length > 0 && !agentPromptConfig?.stepInfos) {
      setStepInfos(initialStepInfos)
      // 根据stepInfos数量调整voiceQuickModes
      const newVoiceQuickModes = initialStepInfos.map((_, index) => ({ id: index + 1 }))
      setVoiceQuickModes(newVoiceQuickModes)

      // 设置表单初始值
      const formValues = {}
      initialStepInfos.forEach((step, index) => {
        formValues[index] = {
          stepName: step.stepName || "",
          stepCode: step.stepCode || "",
          content: step.content || ""
        }
      })
      form.setFieldsValue(formValues)
    }
  }, [initialStepInfos, form, agentPromptConfig])

  const handleStepInfoChange = (stepIndex, field, value) => {
    const newStepInfos = [...stepInfos]
    if (!newStepInfos[stepIndex]) {
      newStepInfos[stepIndex] = {}
    }
    newStepInfos[stepIndex][field] = value
    setStepInfos(newStepInfos)
    onStepInfosChange?.(newStepInfos)
  }

  const handleAddVoiceQuickMode = () => {
    const newId =
      voiceQuickModes.length > 0 ? Math.max(...voiceQuickModes.map((item) => item.id)) + 1 : 1
    setVoiceQuickModes([...voiceQuickModes, { id: newId }])

    // 添加新的stepInfo
    const newStepInfos = [...stepInfos, { stepName: "", stepCode: "", content: "" }]
    setStepInfos(newStepInfos)
    onStepInfosChange?.(newStepInfos)
  }

  const handleRemoveVoiceQuickMode = (id) => {
    const indexToRemove = voiceQuickModes.findIndex((item) => item.id === id)
    if (indexToRemove !== -1) {
      // 移除对应的voiceQuickMode
      const newVoiceQuickModes = voiceQuickModes.filter((item) => item.id !== id)
      setVoiceQuickModes(newVoiceQuickModes)

      // 移除对应的stepInfo
      const newStepInfos = stepInfos.filter((_, index) => index !== indexToRemove)
      setStepInfos(newStepInfos)
      onStepInfosChange?.(newStepInfos)

      // 清理表单中对应的字段值
      const currentFormValues = form.getFieldsValue()
      const newFormValues = {}
      newStepInfos.forEach((stepInfo, index) => {
        newFormValues[index] = {
          stepName: stepInfo.stepName || "",
          stepCode: stepInfo.stepCode || "",
          content: stepInfo.content || ""
        }
      })
      form.setFieldsValue(newFormValues)
    }
  }

  // 处理拖拽排序
  const handleDragEnd = (result) => {
    if (!result.destination) {
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) {
      return
    }

    // 重新排序 voiceQuickModes
    const newVoiceQuickModes = Array.from(voiceQuickModes)
    const [reorderedItem] = newVoiceQuickModes.splice(sourceIndex, 1)
    newVoiceQuickModes.splice(destinationIndex, 0, reorderedItem)
    setVoiceQuickModes(newVoiceQuickModes)

    // 重新排序 stepInfos
    const newStepInfos = Array.from(stepInfos)
    const [reorderedStepInfo] = newStepInfos.splice(sourceIndex, 1)
    newStepInfos.splice(destinationIndex, 0, reorderedStepInfo)
    setStepInfos(newStepInfos)
    onStepInfosChange?.(newStepInfos)

    // 重新排序表单数据
    const currentFormValues = form.getFieldsValue()
    const newFormValues = {}
    newStepInfos.forEach((stepInfo, index) => {
      newFormValues[index] = {
        stepName: stepInfo.stepName || "",
        stepCode: stepInfo.stepCode || "",
        content: stepInfo.content || ""
      }
    })
    form.setFieldsValue(newFormValues)
  }

  // 转换globalData为VariableTextArea需要的格式
  const transformedVariables = useMemo(() => {
    if (!globalData || !Array.isArray(globalData)) {
      return []
    }

    return globalData
      .filter((item) => item.enabled)
      .map((item) => ({
        ...item,
        valueExpression: item.varName || item.valueExpression,
        description: item.description || ""
      }))
  }, [globalData])
  return (
    <>
      <div className="w-[50%] max-w-[500px] min-w-[300px] pl-[10px]">
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-150px)] py-[20px] pr-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#475467] font-[500] pl-[8px]">人设与逻辑回复</span>
            <span className="text-[14px] text-[#475467] font-[400] flex items-center">
              <Tooltip title="放大编辑框">
                <Iconfont
                  className="text-[18px] text-gray-500 mr-2 cursor-pointer"
                  type={"icon-a-expand"}
                  onClick={() => setIsModalVisible(true)}
                />
              </Tooltip>
              <AIOptimize
                originalPrompt={markdownContent}
                intelligentAgentType="AGENT"
                intelligentAgentNo={agentNo}
                onSubmit={onOptimizeSubmit}
                disabled={disabled}
              />
            </span>
          </div>
          <div className="bg-[#fff] rounded-lg">
            {/* MDEditor */}
            {/* <Input.TextArea
              value={markdownContent}
              onChange={(e) => {
                setMarkdownContent(e.target.value)
              }}
              rows={16}
              placeholder="在这里输入语音Agentic下的角色与逻辑回复内容..."
              // id={Date.now()}
              // autoFocus={true}
              // onBlur={onEditorBlur}
              // preview={disabled ? "preview" : "edit"}
              // hideToolbar={true}
              // height={"calc(100vh - 200px)"}
              style={{
                backgroundColor: "#fff",
                border: "none",

                fontSize: "14px",
                color: "#475467",
                boxShadow: "none"
              }}
              // textareaProps={{
              //   placeholder: "在这里输入语音Agentic下的角色与逻辑回复内容...",
              //   style: {
              //     backgroundColor: "#fff",
              //     fontSize: "14px",
              //     color: "#475467"
              //   }
              // }}
            /> */}

            <VariableTextArea
              rows={16}
              variables={transformedVariables}
              value={markdownContent}
              onChange={(e) => {
                setMarkdownContent(e.target.value)
              }}
              style={{}}
              isLargeEdito={false}
              placeholder="在这里输入语音Agentic下的角色与逻辑回复内容..."
              miniInputStyle={{
                height: "40vh",
                backgroundColor: "#fff",
                border: "none",
                fontSize: "14px",
                color: "#475467",
                boxShadow: "none"
              }}
            />
            <div className="bg-gray-200 h-[1px] w-[100%] my-4"></div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="voice-quick-modes">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {voiceQuickModes.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative mb-4 ${snapshot.isDragging ? "shadow-lg rounded-md opacity-50" : ""}`}
                        >
                          <div className="flex items-start">
                            {/* 拖拽手柄 */}
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center w-5 h-5 mt-3 mr-1 cursor-move"
                              title="拖拽排序"
                            >
                              <DragIcon />
                            </div>

                            {/* VoiceQuickMode 组件 */}
                            <div className="flex-1 p-2 rounded-md bg-white border border-gray-200 relative">
                              <VoiceQuickMode
                                form={form}
                                globalData={globalData}
                                multiModalTypeList={multiModalTypeList}
                                contentValue={markdownContent}
                                onMouseBlur={onEditorBlur}
                                isDisabled={disabled}
                                stepIndex={index}
                                onStepInfoChange={handleStepInfoChange}
                              />

                              {/* 删除按钮 */}
                              {voiceQuickModes.length > 0 && (
                                <a
                                  className="flex absolute top-2 right-1 items-center justify-center w-6 h-6 ml-2 text-gray-400 hover:text-red-500"
                                  onClick={() => handleRemoveVoiceQuickMode(item.id)}
                                  title="删除"
                                >
                                  <i className="iconfont icon-shanchu text-[16px]"></i>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="flex justify-start mt-2">
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={handleAddVoiceQuickMode}
              disabled={disabled}
            >
              新增步骤
            </Button>
          </div>
        </div>
      </div>

      <div className="w-[1px] h-[calc(100vh-131px)] bg-[#E4E7EC]"></div>

      {/* 放大编辑 Modal */}
      <Modal
        title="人设与逻辑回复"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {/* MDEditor */}
        <Input.TextArea
          value={markdownContent}
          onChange={(e) => {
            setMarkdownContent(e.target.value)
          }}
          rows={30}
          // hideToolbar={true}
          // onBlur={onEditorBlur}
          // preview={disabled ? "preview" : "edit"}
          // height={1000}
          placeholder="在这里输入语音Agentic下的角色与逻辑回复内容..."
          style={{
            backgroundColor: "#fff",
            border: "none",
            fontSize: "14px",
            color: "#475467",
            boxShadow: "none"
          }}
          // textareaProps={{
          //   placeholder: "在这里输入语音Agentic下的角色与逻辑回复内容...",
          //   style: {
          //     backgroundColor: "#fff",
          //     fontSize: "14px",
          //     color: "#475467"
          //   }
          // }}
        />
      </Modal>
    </>
  )
}

export default VoiceDetailEditor
