import { useEffect, useMemo, useState } from "react"
import { Drawer, Form, Input, Switch, message, Space, Button, Col, Row, Select, Radio } from "antd"
import { getStudyTaskDetail, saveStudyTask } from "./request"
import CustomDivider from "@/components/CustomDivider"
import { DeleteIcon, AddIcon, InfoIcon } from "@/components/FormIcon"
import "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/index.scss"
import { useFetchAvailableSkills } from "@/api/skill"
const logicalOperator = [
  {
    label: "且",
    value: "AND"
  },
  {
    label: "或",
    value: "OR"
  }
]

const logicalOperatorMap = {
  AND: "且",
  OR: "或"
}

const conditionTypeList = [
  {
    label: "触发动作",
    value: "ACTION"
  },
  {
    label: "工作流判断",
    value: "SKILL"
  }
]

const actionTypeList = [
  {
    label: "坐席撤回",
    value: "SEATS_WITHDRAWAL"
  },
  {
    label: "客户点踩",
    value: "USER_DOWN_VOTE"
  }
]

const operatorTypeList = [
  {
    label: "等于",
    value: "TERM"
  },
  {
    label: "不等于",
    value: "NOT_TERM"
  },
  // {
  //   label: "大于",
  //   value: "GREATER_THAN"
  // },
  // {
  //   label: "小于",
  //   value: "LESS_THAN"
  // },
  // {
  //   label: "匹配",
  //   value: "MATCH"
  // },
  // {
  //   label: "不匹配",
  //   value: "NOT_MATCH"
  // },
  {
    label: "包含",
    value: "IN"
  },
  {
    label: "不包含",
    value: "NOT_IN"
  }
]

const toggleLogicalOperator = (value) => {
  return value === "AND" ? "OR" : "AND"
}
const isTrue = true
export default ({ visible, setVisible, record, botNo, refreshTableData }) => {
  const [form] = Form.useForm()
  const [_, forceUpdate] = useState({})
  const [filterText, setFilterText] = useState("")

  useEffect(() => {
    if (visible && record?.taskNo) {
      getStudyTaskDetail(botNo, record.taskNo).then((res) => {
        if (res.success) {
          form.setFieldsValue({
            ...res.data,
            status: res.data.status === 1,
            autoOptimizeEnabled: res.data.autoOptimizeEnabled === 1,
            intelligentOptimizeEnabled: res.data.intelligentOptimizeEnabled === 1,
            optimizeRange: res.data.optimizeRange || 0,
            autoFillBizSourcesEnabled: res.data.autoFillBizSourcesEnabled === 1,
            autoFillReasonsEnabled: res.data.autoFillReasonsEnabled === 1
          })
          forceUpdate({})
        }
      })
    } else {
      form.resetFields()
      form.setFieldValue(["autoOptimizeEnabled"], true)
      form.setFieldValue(["optimizeRange"], 0)
    }
  }, [visible, record, form, botNo])

  const taskNo = useMemo(() => {
    return record?.taskNo || form.getFieldValue(["taskNo"])
  }, [record, form])

  const handleSearch = (val) => {
    setFilterText(val)
  }

  const { data: availableSkills = [] } = useFetchAvailableSkills({
    botNo: botNo
  })
  const skills = useMemo(() => {
    const selfSkills =
      availableSkills?.selfSkills?.map((skill) => {
        return {
          ...skill,
          label: skill.skillName,
          value: skill.skillNo
        }
      }) || []
    const subscribedSkills =
      availableSkills?.subscribedSkills?.map((skill) => {
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

  const handleSubmit = async () => {
    form.validateFields().then(async (values) => {
      try {
        await saveStudyTask(botNo, {
          ...values,
          taskNo: record?.taskNo,
          status: values.status ? 1 : 0,
          autoOptimizeEnabled: values.autoOptimizeEnabled ? 1 : 0,
          intelligentOptimizeEnabled: values.intelligentOptimizeEnabled ? 1 : 0,
          optimizeRange: values.optimizeRange || 0,
          autoFillBizSourcesEnabled: values.autoFillBizSourcesEnabled ? 1 : 0,
          autoFillReasonsEnabled: values.autoFillReasonsEnabled ? 1 : 0
        })
        message.success("保存成功")
        setVisible(false)
        refreshTableData()
      } catch (error) {
        message.error("保存失败")
      }
    })
  }
  const autoOptimizeEnabled = form.getFieldValue(["autoOptimizeEnabled"])
  const currentLogicalOperator = form.getFieldValue(["autoOptimizeConfig", "logicalOperator"])
  const currentConditions = form.getFieldValue(["autoOptimizeConfig", "conditions"]) || []
  const intelligentOptimizeEnabled = form.getFieldValue(["intelligentOptimizeEnabled"])
  const optimizeRange = form.getFieldValue(["optimizeRange"])

  return (
    <Drawer
      title={record ? "编辑任务" : "创建任务"}
      open={visible}
      width={600}
      onClose={() => setVisible(false)}
      destroyOnClose={false}
      footer={
        <div className="flex justify-end">
          <Space>
            <Button onClick={() => setVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          autoOptimizeEnabled: false,
          intelligentOptimizeEnabled: false,
          optimizeRange: 0,
          autoFillBizSourcesEnabled: false,
          autoFillReasonsEnabled: false
        }}
      >
        <CustomDivider>基础设置</CustomDivider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="任务名称"
              rules={[{ required: true, message: "在线学习任务名称" }]}
            >
              <Input placeholder="请输入在线学习任务名称" />
            </Form.Item>
          </Col>
          {taskNo && (
            <Col span={12}>
              <Form.Item name="taskNo" label="在线学习任务编号">
                <Input disabled />
              </Form.Item>
            </Col>
          )}
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              layout="horizontal"
              name="status"
              label="任务状态"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <CustomDivider showTopLine>挖掘范围</CustomDivider>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="optimizeRange" initialValue={0}>
              <Radio.Group
                onChange={() => {
                  forceUpdate({})
                }}
              >
                <Radio value={0}>全部</Radio>
                <Radio value={1}>指定工作流</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          {optimizeRange === 1 && (
            <Col span={24}>
              <Form.Item
                layout="horizontal"
                label="指定工作流范围"
                name="optimizeAppointSkillNos"
                rules={[
                  {
                    required: true,
                    message: "请选择工作流"
                  }
                ]}
              >
                <Select
                  showSearch
                  placeholder="请选择工作流"
                  onSearch={handleSearch}
                  filterOption={false}
                  options={skills}
                  mode="multiple"
                />
              </Form.Item>
            </Col>
          )}
        </Row>
        <CustomDivider showTopLine>优化挖掘</CustomDivider>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              layout="horizontal"
              name="autoOptimizeEnabled"
              label="优化机会判断条件"
              valuePropName="checked"
              initialValue={true}
              tooltip={{
                icon: <InfoIcon />,
                title: "开启后，针对符合条件的优化机会生成【待审核】优化单"
              }}
            >
              <Switch
                onChange={(value) => {
                  forceUpdate({})
                }}
              />
            </Form.Item>
          </Col>
          {autoOptimizeEnabled && (
            <Col span={24} className="flex flex-1 !pl-0 !pr-0">
              <div
                style={{ width: 50, rowGap: 3 }}
                className={currentConditions.length > 1 ? "vertical-line" : ""}
              >
                {currentConditions.length > 1 && (
                  <>
                    <Form.Item
                      name={["autoOptimizeConfig", "logicalOperator"]}
                      rules={[{ required: true, message: "请选择逻辑" }]}
                      hidden={true}
                      initialValue={"AND"}
                    >
                      <Select style={{ width: "60px" }} placeholder="请选择逻辑">
                        {logicalOperator.map((type) => (
                          <Select.Option key={type.value} value={type.value}>
                            {type.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <a
                      className="operator-text"
                      onClick={() => {
                        form.setFieldValue(
                          ["autoOptimizeConfig", "logicalOperator"],
                          toggleLogicalOperator(currentLogicalOperator)
                        )
                        forceUpdate({})
                      }}
                    >
                      {logicalOperatorMap[currentLogicalOperator] || "且"}
                    </a>
                  </>
                )}
              </div>
              <div className="flex-1">
                <Form.List
                  name={["autoOptimizeConfig", "conditions"]}
                  initialValue={[
                    {
                      conditionType: "ACTION"
                    }
                  ]}
                >
                  {(fieldsItem, { add, remove }) => (
                    <>
                      {fieldsItem.map(({ key: cKey, name: cName }) => {
                        const conditionType = form.getFieldValue([
                          "autoOptimizeConfig",
                          "conditions",
                          cName,
                          "conditionType"
                        ])
                        return (
                          <div key={cKey} style={{ display: "flex", flex: 1 }}>
                            {isTrue && (
                              <>
                                <div
                                  className="condition-label"
                                  style={{
                                    height: 20,
                                    width: 20,
                                    padding: 2,
                                    textAlign: "center",
                                    lineHeight: 1
                                  }}
                                >
                                  {String.fromCharCode(65 + (cName % 26))}
                                </div>
                                {conditionType === "ACTION" && (
                                  <div className="mb-4 flex-1 flex">
                                    <Form.Item
                                      name={[cName, "conditionType"]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "判断方式"
                                        }
                                      ]}
                                      className="mb-2 ml-2"
                                      style={{ width: "120px" }}
                                      initialValue={"ACTION"}
                                    >
                                      <Select
                                        options={conditionTypeList}
                                        placeholder="判断方式"
                                        onChange={(value) => {
                                          forceUpdate({})
                                        }}
                                      />
                                    </Form.Item>
                                    <Form.Item
                                      name={[cName, "action"]}
                                      rules={[{ required: true, message: "请选择动作" }]}
                                      className="mb-2 ml-2 flex-1"
                                      style={{ width: "100%" }}
                                    >
                                      <Select options={actionTypeList} placeholder="选择动作" />
                                    </Form.Item>
                                  </div>
                                )}

                                {conditionType === "SKILL" && (
                                  <>
                                    <div className="flex-1 flex flex-col ml-2 mb-4">
                                      <div className="flex">
                                        <Form.Item
                                          name={[cName, "conditionType"]}
                                          rules={[
                                            {
                                              required: true,
                                              message: "判断方式"
                                            }
                                          ]}
                                          className="mb-2"
                                          style={{ width: "120px" }}
                                          initialValue={"ACTION"}
                                        >
                                          <Select
                                            options={conditionTypeList}
                                            placeholder="判断方式"
                                            onChange={(value) => {
                                              form.setFieldValue(
                                                ["rules", "conditions", cName, "operator"],
                                                null
                                              )
                                              forceUpdate({})
                                            }}
                                          />
                                        </Form.Item>
                                        <Form.Item
                                          name={[cName, "key"]}
                                          className="mb-2 ml-2 flex-1"
                                          rules={[
                                            {
                                              required: true,
                                              message: "请选择工作流"
                                            }
                                          ]}
                                        >
                                          <Select
                                            showSearch
                                            placeholder="请选择工作流"
                                            onSearch={handleSearch}
                                            filterOption={false}
                                            options={skills}
                                          />
                                        </Form.Item>
                                        <Form.Item
                                          name={[cName, "operator"]}
                                          rules={[{ required: true, message: "请选择操作符" }]}
                                          className="mb-2 ml-2"
                                        >
                                          <Select
                                            options={operatorTypeList}
                                            style={{ width: "84px" }}
                                            placeholder="操作符"
                                            onChange={(value) => {
                                              forceUpdate({})
                                            }}
                                          />
                                        </Form.Item>
                                      </div>
                                      <div className="mt-2">
                                        <Form.Item
                                          name={[cName, "value"]}
                                          className="mb-2"
                                          style={{ width: "100%" }}
                                          rules={[
                                            {
                                              required: true,
                                              message: "请输入输出结论"
                                            }
                                          ]}
                                        >
                                          <Input.TextArea
                                            autoSize={{ minRows: 2, maxRows: 4 }}
                                            placeholder="输出结论"
                                          />
                                        </Form.Item>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </>
                            )}

                            {fieldsItem.length > 1 && (
                              <div className="ml-2" style={{ marginTop: 6 }}>
                                <DeleteIcon
                                  onClick={() => {
                                    remove(cName)
                                    forceUpdate({})
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {isTrue && (
                        <AddIcon
                          className="mb-3"
                          onClick={() => {
                            add({
                              conditionType: "ACTION"
                            })
                            forceUpdate({})
                          }}
                          text="增加表达式"
                        />
                      )}
                    </>
                  )}
                </Form.List>
              </div>
            </Col>
          )}
        </Row>
        <CustomDivider showTopLine>优化建议</CustomDivider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              layout="horizontal"
              name="intelligentOptimizeEnabled"
              label="自动提供优化建议"
              valuePropName="checked"
              initialValue={false}
              tooltip={{
                icon: <InfoIcon />,
                title: "开启后，优化单中显示智能优化建议"
              }}
            >
              <Switch
                onChange={(value) => {
                  forceUpdate({})
                }}
              />
            </Form.Item>
          </Col>
          {intelligentOptimizeEnabled && (
            <Col span={24}>
              <Form.Item
                layout="horizontal"
                label="选择工作流"
                name={["intelligentOptimizeConfig", "skillNo"]}
                rules={[
                  {
                    required: true,
                    message: "请选择工作流"
                  }
                ]}
              >
                <Select
                  showSearch
                  placeholder="请选择工作流"
                  onSearch={handleSearch}
                  filterOption={false}
                  options={skills}
                />
              </Form.Item>
            </Col>
          )}
          {intelligentOptimizeEnabled && (
            <>
              <Col span={24}>
                <Form.Item
                  layout="horizontal"
                  name="autoFillBizSourcesEnabled"
                  label="是否自动回填业务来源"
                  valuePropName="checked"
                  initialValue={false}
                  tooltip={{
                    icon: <InfoIcon />,
                    title: "开启后，将自动回填优化建议内容至响应字段"
                  }}
                >
                  <Switch
                    onChange={(value) => {
                      forceUpdate({})
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  layout="horizontal"
                  name="autoFillReasonsEnabled"
                  label="是否自动回填错误类型"
                  valuePropName="checked"
                  initialValue={false}
                  tooltip={{
                    icon: <InfoIcon />,
                    title: "开启后，将自动回填优化建议内容至响应字段"
                  }}
                >
                  <Switch
                    onChange={(value) => {
                      forceUpdate({})
                    }}
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
      </Form>
    </Drawer>
  )
}
