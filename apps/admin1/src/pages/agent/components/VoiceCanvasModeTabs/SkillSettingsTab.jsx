import { useState, useEffect, useCallback, useMemo } from "react"
import { Form, Select, InputNumber, Button, Row, Col, Popconfirm, Tooltip } from "antd"
import { useFetchAvailableSkills } from "@/api/skill"
import { createTemplateSkill } from "@/api/voiceAgent/api"
import { message } from "antd"
import { useNavigate } from "react-router-dom"
import { MessageType } from "@/constants/postMessageType"

const { Option } = Select

const SkillSettingsTab = ({ form, botNo, agentDetail, onFormChange, loading }) => {
  // 工作流搜索状态
  const [filterText, setFilterText] = useState("")
  const navigate = useNavigate()

  // 监听表单字段变化
  const reflectAigcSkillNo = Form.useWatch("reflectAigcSkillNo", form)
  const reflectAigcEventSkillNo = Form.useWatch("reflectAigcEventSkillNo", form)
  const intentTagCallSkillNo = Form.useWatch("intentTagCallSkillNo", form)

  // 创建工作流loading状态
  const [createEventSkillLoading, setCreateEventSkillLoading] = useState(false)
  const [createTagSkillLoading, setCreateTagSkillLoading] = useState(false)

  // 获取工作流列表
  const { data: availableSkills = {}, refetch: refetchSkills } = useFetchAvailableSkills({
    botNo: botNo,
    pageSize: 1000,
    pageNum: 1
  })

  // 工作流搜索处理
  const handleSearch = (value) => {
    setFilterText(value)
  }

  // 处理工作流选项
  const skills = useMemo(() => {
    const selfSkills =
      availableSkills.selfSkills?.map((skill) => {
        return {
          ...skill,
          label: skill.skillName,
          value: skill.skillNo
        }
      }) || []
    const subscribedSkills =
      availableSkills.subscribedSkills?.map((skill) => {
        return {
          ...skill,
          label: skill.skillName,
          value: skill.skillNo
        }
      }) || []
    return [
      {
        label: "来自本空间",
        options: selfSkills.filter((o) => o.label.includes(filterText))
      },
      {
        label: "来自其他空间",
        options: subscribedSkills.filter((o) => o.label.includes(filterText))
      }
    ]
  }, [availableSkills, filterText])

  // 创建事件处理工作流
  const handleCreateEventSkill = async () => {
    try {
      if (!agentDetail?.agentNo) {
        message.warning("缺少agentNo，无法创建工作流")
        return
      }

      setCreateEventSkillLoading(true)
      const res = await createTemplateSkill({
        botNo: botNo,
        agentNo: agentDetail.agentNo,
        templateNo: "eventHandler"
      })

      if (res && res.status === 200) {
        message.success("事件处理工作流创建成功")
        if (res.data) {
          // 自动选择到Select中
          form.setFieldsValue({ reflectAigcEventSkillNo: res.data })
          // 触发表单变化
          if (onFormChange) {
            onFormChange({ reflectAigcEventSkillNo: res.data }, form.getFieldsValue())
          }
        }
        // 重新获取工作流列表
        refetchSkills()
      } else {
        message.error(res?.message || "创建工作流失败")
      }
    } catch (error) {
      console.error("创建事件处理工作流失败:", error)
      message.error("创建工作流失败")
    } finally {
      setCreateEventSkillLoading(false)
    }
  }

  // 创建通话打标工作流
  const handleCreateTagSkill = async () => {
    try {
      if (!agentDetail?.agentNo) {
        message.warning("缺少agentNo，无法创建工作流")
        return
      }

      setCreateTagSkillLoading(true)
      const res = await createTemplateSkill({
        botNo: botNo,
        agentNo: agentDetail.agentNo,
        templateNo: "intentTagHandler"
      })

      if (res && res.status === 200) {
        message.success("通话打标工作流创建成功")
        if (res.data) {
          // 自动选择到Select中
          form.setFieldsValue({ intentTagCallSkillNo: res.data })
          // 触发表单变化
          if (onFormChange) {
            onFormChange({ intentTagCallSkillNo: res.data }, form.getFieldsValue())
          }
        }
        // 重新获取工作流列表
        refetchSkills()
      } else {
        message.error(res?.message || "创建工作流失败")
      }
    } catch (error) {
      console.error("创建通话打标工作流失败:", error)
      message.error("创建工作流失败")
    } finally {
      setCreateTagSkillLoading(false)
    }
  }

  // 表单验证规则
  const rules = {
    required: [{ required: true, message: "此项为必填项" }],
    positiveInteger: [
      {
        pattern: /^[1-9]\d*$/,
        message: "请输入正整数"
      }
    ]
  }

  // 跳转
  const reTodoUrlHandel = (skillNo) => {
    window.parent.postMessage(
      {
        type: MessageType.NAVIGATE_TO_PROMPT,
        payload: {
          skillNo: skillNo,
          _blank: true,
          isTools: true
        }
      },
      "*"
    )
  }

  return (
    <div className="p-0">
      <div className="my-5">
        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              name="reflectAigcSkillNo"
              label={
                <div className="flex items-center justify-between w-[650px]">
                  <span className="flex items-center">意图识别工作流</span>
                  {reflectAigcSkillNo && (
                    <Tooltip title="点击跳转工作流详情">
                      <i
                        className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9]"
                        onClick={() => {
                          reTodoUrlHandel(reflectAigcSkillNo)
                        }}
                      ></i>
                    </Tooltip>
                  )}
                </div>
              }
              rules={rules.required}
            >
              <Select
                showSearch
                placeholder="请选择工作流"
                onSearch={handleSearch}
                filterOption={false}
                options={skills}
                allowClear
                loading={loading}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              name="reflectAigcEventSkillNo"
              label={
                <div className="flex items-center justify-between w-[670px]">
                  <span className="flex items-center">
                    事件处理工作流
                    <Popconfirm
                      title="确认创建"
                      description="是否智能创建新工作流并应用？"
                      onConfirm={handleCreateEventSkill}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        size="small"
                        type="link"
                        className="ml-2"
                        loading={createEventSkillLoading}
                      >
                        智能创建
                      </Button>
                    </Popconfirm>
                  </span>
                  {reflectAigcEventSkillNo && (
                    <Tooltip title="点击跳转工作流详情">
                      <i
                        className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9]"
                        onClick={() => {
                          reTodoUrlHandel(reflectAigcEventSkillNo)
                        }}
                      ></i>
                    </Tooltip>
                  )}
                </div>
              }
            >
              <Select
                showSearch
                placeholder="请选择工作流"
                onSearch={handleSearch}
                filterOption={false}
                options={skills}
                allowClear
                loading={loading}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="intentTagCallSkillNo"
              label={
                <div className="flex items-center justify-between w-[670px]">
                  <span className="flex items-center">
                    通话打标工作流
                    <Popconfirm
                      title="确认创建"
                      description="是否智能创建新工作流并应用？"
                      onConfirm={handleCreateTagSkill}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        size="small"
                        type="link"
                        className="ml-2"
                        loading={createTagSkillLoading}
                      >
                        智能创建
                      </Button>
                    </Popconfirm>
                  </span>
                  {intentTagCallSkillNo && (
                    <Tooltip title="点击跳转工作流详情">
                      <i
                        className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9]"
                        onClick={() => {
                          reTodoUrlHandel(intentTagCallSkillNo)
                        }}
                      ></i>
                    </Tooltip>
                  )}
                </div>
              }
            >
              <Select
                showSearch
                placeholder="请选择工作流"
                onSearch={handleSearch}
                filterOption={false}
                options={skills}
                allowClear
                loading={loading}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="reflectErrOverNum"
              label="报错兜底次数"
              tooltip="调用灵犀工作流超时或者报错，外呼兜底工作流处理次数，超过这个次数就会直接挂机"
              rules={[...rules.required, ...rules.positiveInteger]}
            >
              <InputNumber placeholder="请输入" className="w-full" addonAfter="次" allowClear />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default SkillSettingsTab
