import React, { useState } from "react"
import { Form, Select, Row, Col, Tooltip, Button } from "antd"
import { AddIcon, DeleteIcon, InfoIcon } from "@/components/FormIcon"
import { PlusOutlined } from "@ant-design/icons"
import VariableTextArea from "./VariableTextArea"
import { PromptTips } from "@/constants/tips"
import AIOptimize from "@/components/AIOptimize"
import CustomDivider from "@/components/CustomDivider"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import JSONDiffModal from "@/components/JSONDiffModal"

const QuickMode = ({
  form,
  globalData,
  skillFlowData,
  contentValue,
  onMouseBlur,
  isDisabled,
  multiModalTypeList = [],
  isOnlyMultiModal = false,
  targetData
}) => {
  const [diffModalVisible, setDiffModalVisible] = useState(false)
  const hasMultiModal = multiModalTypeList && multiModalTypeList.length > 0

  // 处理历史记录图标点击
  const handleHistoryClick = () => {
    setDiffModalVisible(true)
  }

  // 获取当前组件的bizNo
  const getCurrentBizNo = () => {
    if (!targetData?.id || !skillFlowData?.skillComponentDefinitions) {
      return undefined
    }
    const currentComponent = skillFlowData.skillComponentDefinitions.find(
      (comp) => comp.nodeId === targetData.id
    )
    return currentComponent?.bizNo
  }

  // 获取当前工作流数据用于对比
  const getCurrentSkillData = () => {
    const formValues = form.getFieldsValue()
    return {
      prompt: formValues.content || "",
      inputs: formValues.quickModeInputs || [],
      skillInfo: {
        skillNo: skillFlowData?.skillNo,
        ...skillFlowData
      }
    }
  }

  return (
    <div>
      {/* 只有多模态模型才显示输入配置项 */}
      {hasMultiModal && (
        <>
          <CustomDivider showTopLine={false}>输入项配置</CustomDivider>
          <Form.List name="quickModeInputs" initialValue={[{}]} className="!-mt-2">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} className="flex mb-2">
                    <Col span={5}>
                      <Form.Item {...restField} name={[name, "modalType"]}>
                        <Select placeholder="模态类型" onChange={onMouseBlur}>
                          {multiModalTypeList
                            ?.filter((m) => m.code !== "TEXT")
                            .map((modalTypeItem) => (
                              <Select.Option key={modalTypeItem.code} value={modalTypeItem.code}>
                                {modalTypeItem.name}
                              </Select.Option>
                            ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col className="flex-1">
                      <GlobalVariableSelect
                        formName={[name, "variable"]}
                        multiple={false}
                        required={false}
                        onChange={onMouseBlur}
                        placeholder="选择变量"
                      />
                    </Col>
                    <Col className="mt-[5px]">
                      <DeleteIcon
                        onClick={() => {
                          remove(name)
                          onMouseBlur()
                        }}
                      />
                    </Col>
                  </Row>
                ))}
                <Form.Item className="">
                  <AddIcon text="添加新模态" onClick={() => add()} />
                </Form.Item>
              </>
            )}
          </Form.List>
        </>
      )}

      {/* 提示词部分 */}
      <div className="p-2 pb-1 rounded-md bg-gray-100 mt-0">
        <Form.Item
          className="global-tips"
          name="content"
          label={
            <div className="flex items-center justify-between w-[500px]">
              <div className="flex items-center">
                <span className="mr-2">提示词</span>
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

              <div className="flex items-center">
                <Tooltip title={"支持历史版本对比"} placement="top">
                  <div
                    className=" hover:text-gray-300 mr-4 cursor-pointer"
                    onClick={handleHistoryClick}
                  >
                    <i className="iconfont icon-lishijilu text-gray-500 text-[18px]"></i>
                  </div>
                </Tooltip>

                <Tooltip title={PromptTips} placement="left">
                  <div className=" hover:text-gray-300 -mr-1">
                    <i className="iconfont icon-Warning text-gray-500 text-[18px] cursor-pointer"></i>
                  </div>
                </Tooltip>
              </div>
            </div>
          }
          rules={[
            {
              required: true,
              message: "请输入提示词"
            }
          ]}
          help={"输入$调用过程变量或快捷指令"}
          labelCol={{
            span: 24,
            offset: 0.3
          }}
        >
          <VariableTextArea
            variables={globalData}
            disabled={isDisabled}
            onMouseBlur={onMouseBlur}
            onChange={onMouseBlur}
            placeholder="请输入提示词内容..."
            miniInputStyle={{
              border: "none",
              boxShadow: "none",
              backgroundColor: "#f4f4f4"
            }}
          />
        </Form.Item>
      </div>

      {/* JSON 对比弹窗 */}
      <JSONDiffModal
        visible={diffModalVisible}
        onCancel={() => setDiffModalVisible(false)}
        currentSkill={getCurrentSkillData()}
        globalData={contentValue}
        variables={globalData}
        skillNo={skillFlowData?.skillNo}
        bizNo={getCurrentBizNo()}
        onEnableVersion={(versionContent) => {
          // 将历史版本内容替换到form的content字段
          form.setFieldsValue({ content: versionContent })
          // 关闭弹窗
          setDiffModalVisible(false)
        }}
      />
    </div>
  )
}

export default QuickMode
