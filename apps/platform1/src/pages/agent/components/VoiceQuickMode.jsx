import React from "react"
import { Form, Select, Row, Col, Input } from "antd"
import { DeleteIcon } from "@/components/FormIcon"
import VariableTextArea from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/VariableTextArea"
import AIOptimize from "@/components/AIOptimize"
import CustomDivider from "@/components/CustomDivider"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import { useState, useMemo } from "react"

const VoiceQuickMode = ({
  form,
  globalData,
  skillFlowData,
  contentValue,
  onMouseBlur,
  isDisabled,
  multiModalTypeList = [],
  isOnlyMultiModal = false,
  targetData,
  stepIndex,
  onStepInfoChange
}) => {
  // 获取当前步骤的内容值
  const currentStepContent = form.getFieldValue([stepIndex, "content"]) || ""
  const stepCode = form.getFieldValue([stepIndex, "stepCode"]) || ""
  const stepName = form.getFieldValue([stepIndex, "stepName"]) || ""

  const [content, setContent] = useState(currentStepContent)

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
    <div>
      {/* 提示词部分 */}
      <div className=" mt-0">
        {/* 步骤名称和编号 */}
        <div className="flex items-center gap-2 mb-2 w-[80%]">
          <span className="mb-0 flex-1">
            <Input
              size="small"
              defaultValue={stepName}
              placeholder="请输入步骤名称"
              onChange={(e) => onStepInfoChange?.(stepIndex, "stepName", e.target.value)}
            />
          </span>
          <span className="mb-0 flex-1">
            <Input
              size="small"
              defaultValue={stepCode}
              placeholder="请输入编号"
              onChange={(e) => onStepInfoChange?.(stepIndex, "stepCode", e.target.value)}
            />
          </span>
          {skillFlowData?.skillNo && (
            <AIOptimize
              originalPrompt={contentValue}
              intelligentAgentType="SKILL"
              intelligentAgentNo={skillFlowData.skillNo}
              onSubmit={({ type, content }) => {
                if (type === "agent") {
                  form.setFieldsValue({ content })
                }
              }}
            />
          )}
        </div>

        <Form.Item
          className="global-tips"
          name={[stepIndex, "content"]}
          help={<div className="text-[12px] ml-2 text-gray-400">输入 $ 调用变量</div>}
          labelCol={{
            span: 24,
            offset: 0.3
          }}
        >
          <div className="w-[100%] h-[1px] bg-gray-100"></div>
          <VariableTextArea
            variables={transformedVariables}
            disabled={isDisabled}
            onMouseBlur={onMouseBlur}
            value={content}
            onChange={(e) => {
              // onMouseBlur()
              setContent(e.target.value)
              onStepInfoChange?.(stepIndex, "content", e.target.value)
            }}
            style={{}}
            placeholder="请输入提示词内容..."
            miniInputStyle={{
              border: "none",
              boxShadow: "none",
              backgroundColor: "#fff",
              height: "120px"
            }}
          />
        </Form.Item>
      </div>
    </div>
  )
}

export default VoiceQuickMode
