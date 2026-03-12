import React, { useState, useEffect } from "react"
import { Modal, Form, Input, Select, Button, Row, Col, Tooltip, message } from "antd"
const { TextArea } = Input
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { DragIcon } from "@/components/FormIcon"
import { useFetchSkillListByPage } from "@/api/skill"
import { useFetchAgentList } from "@/api/agent"
import { getFunnelConfigDetail, createOrUpdateFunnelConfig } from "@/api/voiceAgent/api"

const FunnelEditModal = ({ visible, onCancel, onOk, taskId, botNo }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [agentOptions, setAgentOptions] = useState([])
  const [skillOptions, setSkillOptions] = useState([])
  const [searchText, setSearchText] = useState("")
  const [selectedType, setSelectedType] = useState("agent") // agent, skill
  const [listSearchText, setListSearchText] = useState("")
  const [selectedValue, setSelectedValue] = useState("")
  const selectRef = React.createRef()

  // 获取工作流列表
  const { data: skillData, isLoading: skillLoading } = useFetchSkillListByPage({
    botNo: botNo,
    pageSize: 1000,
    pageNum: 1
  })

  // 获取 Agent 列表
  const { data: agentData, isLoading: agentLoading } = useFetchAgentList({
    botNo: botNo
  })

  // 根据选择的类型过滤选项
  const getFilteredOptions = () => {
    if (selectedType === "agent") {
      return filterOptions(agentOptions)
    } else if (selectedType === "skill") {
      return filterOptions(skillOptions)
    } else {
      return [...filterOptions(agentOptions), ...filterOptions(skillOptions)]
    }
  }

  // 初始化表单数据
  useEffect(() => {
    if (visible && taskId && botNo) {
      // 调用新接口获取配置详情
      getFunnelConfigDetail({
        taskId: taskId,
        analysisCode: "onHookBusinessStage",
        botNo: botNo
      })
        .then((response) => {
          if (response?.data) {
            const { analysisToolsType, botNo: responseBotNo, skillNo, extraInfos } = response.data

            // 设置分析目标
            let analysisTarget = undefined
            if (analysisToolsType === 1 && skillNo) {
              // 工作流
              analysisTarget = `skill_${skillNo}`
              setSelectedType("skill")
            } else if (analysisToolsType === 2 && responseBotNo) {
              // Agent
              analysisTarget = `agent_${responseBotNo}`
              setSelectedType("agent")
            }

            // 设置显示字段
            let displayFields = [{ name: "", description: "" }] // 默认显示一个空字段

            if (extraInfos && extraInfos.length > 0) {
              displayFields = extraInfos.map((item) => ({
                name: item.stage,
                description: item.stageDesc
              }))
            }

            form.setFieldsValue({
              analysisName: response.data.analysisName || "",
              analysisTarget: analysisTarget || undefined,
              displayFields: displayFields
            })

            // 设置选中的值
            if (analysisTarget) {
              setSelectedValue(analysisTarget)
            }
          } else {
            // 如果没有数据，显示空值
            form.setFieldsValue({
              analysisName: "",
              analysisTarget: undefined,
              displayFields: [{ name: "", description: "" }] // 默认显示一个空字段
            })
          }
        })
        .catch((error) => {
          console.error("获取漏斗配置详情失败:", error)
          message.error("获取配置详情失败")
          // 显示空值
          form.setFieldsValue({
            analysisName: "",
            analysisTarget: "",
            displayFields: [{ name: "", description: "" }] // 默认显示一个空字段
          })
        })
    } else if (visible) {
      // 没有 taskId 或 botNo，使用默认值
      form.setFieldsValue({
        analysisName: "通话转化率",
        analysisTarget: "",
        displayFields: [
          { name: "总拨打", description: "总拨打次数" },
          { name: "接通", description: "成功接通次数" },
          { name: "有效沟通", description: "有效沟通次数" },
          { name: "意向客户", description: "意向客户数量" },
          { name: "成交", description: "成交客户数量" }
        ]
      })
    }
  }, [visible, taskId, botNo, form])

  // 处理工作流列表数据
  useEffect(() => {
    if (skillData?.skillList) {
      const options = skillData.skillList.map((skill) => ({
        value: `skill_${skill.skillNo}`,
        label: skill.skillName
      }))
      setSkillOptions(options)
    }
  }, [skillData])

  // 处理 Agent 列表数据
  useEffect(() => {
    if (agentData) {
      const options = agentData.map((agent) => ({
        value: `agent_${agent.agentNo}`,
        label: agent.agentName
      }))
      setAgentOptions(options)
    }
  }, [agentData])

  // 处理搜索
  const handleSearch = (value) => {
    setSearchText(value)
  }

  // 筛选选项
  const filterOptions = (options) => {
    if (!searchText) return options
    return options.filter((option) => option.label.toLowerCase().includes(searchText.toLowerCase()))
  }

  // 处理拖拽排序
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const { source, destination } = result
    const displayFields = form.getFieldValue("displayFields")
    const newFields = Array.from(displayFields)
    const [reorderedItem] = newFields.splice(source.index, 1)
    newFields.splice(destination.index, 0, reorderedItem)

    form.setFieldsValue({ displayFields: newFields })
  }

  // 添加新字段
  const addField = () => {
    const displayFields = form.getFieldValue("displayFields") || []
    const newFields = [...displayFields, { name: "", description: "" }]
    form.setFieldsValue({ displayFields: newFields })
  }

  // 删除字段
  const removeField = (index) => {
    const displayFields = form.getFieldValue("displayFields")
    const newFields = displayFields.filter((_, i) => i !== index)
    form.setFieldsValue({ displayFields: newFields })
  }

  // 处理确认
  const handleOk = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // 验证字段名称是否完整
      const hasEmptyNames = values.displayFields.some((field) => !field.name.trim())

      if (hasEmptyNames) {
        message.error("请完善所有字段的名称")
        return
      }

      // 构造保存接口参数
      const { analysisName, analysisTarget, displayFields } = values

      // 解析分析目标类型
      let analysisToolsType = 0
      let skillNo = ""
      let botNoValue = botNo || ""

      if (analysisTarget.startsWith("skill_")) {
        analysisToolsType = 1
        skillNo = analysisTarget.replace("skill_", "")
        // botNoValue 保持传入的 botNo 值
      } else if (analysisTarget.startsWith("agent_")) {
        analysisToolsType = 2
        botNoValue = analysisTarget.replace("agent_", "")
        // skillNo 也应该设置为选中的 Agent 编号（根据用户反馈）
        skillNo = analysisTarget.replace("agent_", "")
      }

      // 构造 extraInfos 参数
      const extraInfos = displayFields.map((field, index) => ({
        stage: field.name,
        stageDesc: field.description,
        seq: index + 1
      }))

      // 调用保存接口
      const saveParams = {
        taskId: taskId,
        analysisToolsType: analysisToolsType,
        analysisCode: "onHookBusinessStage",
        analysisName: analysisName,
        botNo: botNo,
        skillNo: skillNo,
        extraInfos: extraInfos
      }

      const res = await createOrUpdateFunnelConfig(saveParams)
      console.log("res", res)

      if (res?.status == 200) {
        await onOk({ ...values, refreshBoardType: "ON_HOOK_STAGE" })
        message.success("保存成功")
        onCancel()
      } else {
        message.error(res?.data || res?.message || "保存失败，请重试")
      }
    } catch (error) {
      console.error("保存失败:", error)
      message.error("保存失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="编辑漏斗看板"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="ok" type="primary" loading={loading} onClick={handleOk}>
          保存
        </Button>
      ]}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          analysisName: "",
          displayFields: [{ name: "", description: "" }]
        }}
      >
        {/* 看板名称 */}
        <Form.Item
          name="analysisName"
          label="看板名称"
          rules={[{ required: true, message: "请输入看板名称" }]}
        >
          <Input placeholder="请输入看板名称" />
        </Form.Item>

        {/* 分析目标选择 */}
        <Form.Item
          name="analysisTarget"
          label="分析Agent/工作流"
          rules={[{ required: true, message: "请选择分析目标" }]}
        >
          <Select
            placeholder="请选择Agent/工作流完成通话数据分析"
            onSearch={handleSearch}
            allowClear
            filterOption={false}
            loading={agentLoading || skillLoading}
            notFoundContent={agentLoading || skillLoading ? "加载中..." : "暂无数据"}
            dropdownRender={() => (
              <div className="flex" style={{ minWidth: 400, minHeight: 200 }}>
                {/* 左侧类型选择 */}
                <div className="w-24 p-2" style={{ borderRight: "1px solid #d9d9d" }}>
                  <div
                    className={`p-2 cursor-pointer rounded mb-1 text-sm ${
                      selectedType === "agent" ? "bg-gray-100" : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedType("agent")}
                  >
                    Agent
                  </div>
                  <div
                    className={`p-2 cursor-pointer rounded text-sm ${
                      selectedType === "skill" ? "bg-gray-100" : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedType("skill")}
                  >
                    工作流
                  </div>
                </div>
                {/* 右侧选项列表 */}
                <div className="flex-1 max-h-60 overflow-y-auto">
                  {/* 搜索框 */}
                  <div className="p-2 border-b-1 border-gray-200">
                    <Input
                      placeholder="搜索..."
                      value={listSearchText}
                      onChange={(e) => setListSearchText(e.target.value)}
                    />
                  </div>
                  {/* 选项列表 */}
                  <div>
                    {selectedType === "agent" && (
                      <div>
                        {agentOptions
                          .filter((option) =>
                            option.label.toLowerCase().includes(listSearchText.toLowerCase())
                          )
                          .map((option) => (
                            <div
                              key={option.value}
                              className={`px-3 py-2 cursor-pointer text-sm ${
                                selectedValue === option.value ? "bg-gray-100" : "hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                form.setFieldsValue({ analysisTarget: option.value })
                                setSelectedValue(option.value)
                                // 使用 antd 的方式关闭下拉菜单
                                setTimeout(() => {
                                  const event = new MouseEvent("mousedown", {
                                    view: window,
                                    bubbles: true,
                                    cancelable: true
                                  })
                                  document.dispatchEvent(event)
                                }, 100)
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                      </div>
                    )}
                    {selectedType === "skill" && (
                      <div>
                        {skillOptions
                          .filter((option) =>
                            option.label.toLowerCase().includes(listSearchText.toLowerCase())
                          )
                          .map((option) => (
                            <div
                              key={option.value}
                              className={`px-3 py-2 cursor-pointer text-sm ${
                                selectedValue === option.value ? "bg-gray-100" : "hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                form.setFieldsValue({ analysisTarget: option.value })
                                setSelectedValue(option.value)
                                // 使用 antd 的方式关闭下拉菜单
                                setTimeout(() => {
                                  const event = new MouseEvent("mousedown", {
                                    view: window,
                                    bubbles: true,
                                    cancelable: true
                                  })
                                  document.dispatchEvent(event)
                                }, 100)
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                      </div>
                    )}
                    {((selectedType === "agent" &&
                      agentOptions.filter((option) =>
                        option.label.toLowerCase().includes(listSearchText.toLowerCase())
                      ).length === 0) ||
                      (selectedType === "skill" &&
                        skillOptions.filter((option) =>
                          option.label.toLowerCase().includes(listSearchText.toLowerCase())
                        ).length === 0)) && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {agentLoading || skillLoading ? "加载中..." : "暂无数据"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          >
            <Select.OptGroup label="Agent">
              {filterOptions(agentOptions).map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select.OptGroup>
            <Select.OptGroup label="工作流">
              {filterOptions(skillOptions).map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select.OptGroup>
          </Select>
        </Form.Item>

        {/* 展示字段 */}
        <Form.Item label="展示字段" tooltip="字段描述用于Agent/工作流理解字段含义，分析通话数据">
          <Form.Item name="displayFields" noStyle>
            <Form.List name="displayFields">
              {(fields, { add, remove, move }) => (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="displayFields">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <Draggable key={key} draggableId={key.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="mb-3 mt-3"
                                size="small"
                                style={provided.draggableProps.style}
                              >
                                <Row gutter={16} align="top">
                                  <Col flex="none">
                                    <div {...provided.dragHandleProps}>
                                      <Tooltip title="拖动调整顺序">
                                        <DragIcon style={{ cursor: "grab", marginTop: "4px" }} />
                                      </Tooltip>
                                    </div>
                                  </Col>
                                  <div className="flex w-[95%] border border-gray-200 rounded-[6px] bg-gray-50 py-2">
                                    <Col flex="1">
                                      <Row gutter={10}>
                                        <Col span={8}>
                                          <Form.Item
                                            {...restField}
                                            name={[name, "name"]}
                                            rules={[{ required: true, message: "请输入字段名称" }]}
                                            className="mb-0"
                                          >
                                            <Input placeholder="字段名称" />
                                          </Form.Item>
                                        </Col>
                                        <Col span={16}>
                                          <Form.Item
                                            {...restField}
                                            name={[name, "description"]}
                                            className="mb-0"
                                          >
                                            <TextArea
                                              placeholder="字段描述"
                                              rows={2}
                                              autoSize={{ minRows: 2, maxRows: 4 }}
                                            />
                                          </Form.Item>
                                        </Col>
                                      </Row>
                                    </Col>
                                    <Col flex="none">
                                      <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeField(index)}
                                        disabled={fields.length <= 1}
                                        className="mt-3"
                                      />
                                    </Col>
                                  </div>
                                </Row>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        <div className="mt-3">
                          <Button type="link" onClick={addField} icon={<PlusOutlined />}>
                            添加字段
                          </Button>
                        </div>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </Form.List>
          </Form.Item>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default FunnelEditModal
