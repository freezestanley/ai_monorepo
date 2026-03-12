import React, { useCallback, useState } from "react"
import { Form, Row, Col, Button } from "antd"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { OutputParameter } from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/OutputParameter"
import { useNodeInput } from "../hooks/useNodeInput"
import { CodeEditor } from "@/components/CodeEditor"
import CustomDivider from "@/components/CustomDivider"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import JSONDiffModal from "@/components/JSONDiffModal"
import { PlusOutlined } from "@ant-design/icons"

const CodeMode = ({
  form,
  globalData,
  skillFlowData,
  contentValue,
  onMouseBlur,
  isDisabled,
  targetData
}) => {
  const [diffModalVisible, setDiffModalVisible] = useState(false)
  const { inputs, addInput, deleteInput } = useNodeInput(form, targetData, "codeInputParams")
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
      script: formValues.script || "",
      codeInputParams: formValues.codeInputParams || [],
      skillInfo: {
        skillNo: skillFlowData?.skillNo,
        ...skillFlowData
      }
    }
  }

  const handleGlobalVariableChange = () => {
    // 触发重新渲染或其他需要的操作
  }

  // 代码变化处理函数
  const onCodeChange = useCallback(
    (codeContent) => {
      form.setFieldValue("script", codeContent)
      // 触发onMouseBlur以便更新调试数据
      if (onMouseBlur) {
        onMouseBlur()
      }
    },
    [form, onMouseBlur]
  )

  // 确保 inputs 是数组，如果不是则使用空数组
  const safeInputs = Array.isArray(inputs) ? inputs : []

  return (
    <div>
      <CustomDivider showTopLine={false}>
        <span className="text-red-500 mr-1">*</span>
        输入配置项
      </CustomDivider>

      <DndProvider backend={HTML5Backend} className="-mt-2">
        <>
          {safeInputs.map((input, index) => (
            <React.Fragment key={index}>
              <OutputParameter
                inputParamsOrOutputParams="codeInputParams"
                allowDelete={safeInputs.length > 1}
                index={index}
                id={input.id}
                parseMethod="JSON"
                deleteOutput={deleteInput}
                addOutput={addInput}
                parseTypes=""
                isFirst={index === 0}
                isLast={index === safeInputs.length - 1}
                form={form}
                required={true}
                suffixChildren={
                  <GlobalVariableSelect
                    isTag={true}
                    span={3}
                    formName={["codeInputParams", index, "valueExpression"]}
                    multiple={false}
                    label={""}
                    onChange={handleGlobalVariableChange}
                    style={{ marginBottom: 0 }}
                    placeholder="请选择取值（必填）"
                    message="请选择取值（必填）"
                    required={true}
                  />
                }
              />
            </React.Fragment>
          ))}
          {safeInputs.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
              暂无输入参数，点击下方【添加】按钮创建参数
            </div>
          )}
          <Row>
            <Col span={24}>
              {!isDisabled && (
                <Button
                  type="link"
                  onClick={addInput}
                  style={{
                    paddingLeft: 24,
                    marginTop: 8
                  }}
                  icon={<PlusOutlined />}
                >
                  添加
                </Button>
              )}
            </Col>
          </Row>
        </>
      </DndProvider>

      <div className="p-2 pb-1 rounded-md bg-gray-100 mt-4">
        <Form.Item
          className="global-tips"
          name="script"
          rules={[{ required: true, message: "请输入脚本内容" }]}
          labelCol={{
            span: 24,
            offset: 0.3
          }}
        >
          <CodeEditor
            miniTitle={
              <>
                <div className="flex items-center text-[14px] font-[500]">
                  <span>脚本代码</span>
                </div>
              </>
            }
            scriptType="python"
            codeContent={contentValue || ""}
            onCodeChange={onCodeChange}
            editable={!isDisabled}
            height="300px"
            placeholder="请在这里编写您的Python代码..."
            variables={globalData}
            miniStyle={{
              util: { justifyContent: "space-between" }
            }}
          />
        </Form.Item>
      </div>

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

export default CodeMode
