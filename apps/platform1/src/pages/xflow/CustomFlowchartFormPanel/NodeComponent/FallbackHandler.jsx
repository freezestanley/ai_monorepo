import { useExtraSkillsApi } from "@/api/knowledgeExtractor"
import { useFetchAvailableSkills, useFetchBottomOption } from "@/api/skill"
import CustomDivider from "@/components/CustomDivider"
import { AddIcon, DeleteIcon, DragIcon, InfoIcon } from "@/components/FormIcon"
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons"
import { Form, Switch, Input, Space, Button, Select, Card, Alert, Radio, Tag } from "antd"
import { useState, useEffect } from "react"
import "./index.scss"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import { useMemo } from "react"
import { useFetchLlmFilterModelType } from "@/api/common"
import { parseModalTypeTagColor } from "@/constants"
import { useSearchParams } from "react-router-dom"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"

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

const toggleLogicalOperator = (value) => {
  return value === "AND" ? "OR" : "AND"
}

function FallbackHandler({ form, varOptions, botNo, skillNo, nodeType }) {
  const [searchParams] = useSearchParams()
  const [isDisabled] = useFormDisabled()
  const agentNo = searchParams.get("agentNo")

  const [_, forceUpdate] = useState({})
  const bottomConfigEnable = form?.getFieldValue("bottomConfigEnable")
  const [operatorValue, setOperatorValue] = useState(() => {
    // 初始化时从表单中获取保存的值
    const savedRules = form.getFieldValue("rules")
    if (savedRules && savedRules[0]?.logicalOperator) {
      return savedRules[0].logicalOperator
    }
    return "AND"
  })

  const { data: modelOptions } = useFetchLlmFilterModelType(botNo)

  // const fetchExtraSkillsRes = useExtraSkillsApi(botNo)
  // const allSkills = fetchExtraSkillsRes?.data?.data ?? []

  const [filterText, setFilterText] = useState("")
  const handleSearch = (val) => {
    setFilterText(val)
  }
  const { data: availableSkills } = useFetchAvailableSkills({
    botNo: botNo,
    agentNo: agentNo
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

  const { data: bottomOptions = [] } = useFetchBottomOption()

  const isTrue = true

  const onDragEnd = (result, move) => {
    if (!result.destination) return
    const { source, destination } = result
    move(source.index, destination.index)
  }

  return (
    <>
      <Form.Item
        labelCol={{
          span: 6
        }}
        layout="horizontal"
        label="是否启用兜底处理"
        name="bottomConfigEnable"
        valuePropName="checked"
        initialValue={false}
        className="mb-1"
        tooltip={{
          icon: <InfoIcon />,
          title: "启用后，通过判断条件执行兜底处理"
        }}
      >
        <Switch
          checked={bottomConfigEnable}
          className="ml-2"
          checkedChildren="开"
          unCheckedChildren="关"
          size="small"
          onChange={(value) => {
            form?.setFieldsValue({
              bottomConfigEnable: value,
              bottomConfig: [{}]
            })
            forceUpdate({})
          }}
        />
      </Form.Item>
      {bottomConfigEnable && (
        <CustomDivider showTopLine={true} style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            兜底方案
            <Alert
              className="ml-2 pt-2 pb-2 pl-3 pr-3 border-none"
              style={{
                lineHeight: "20px",
                fontWeight: 400
              }}
              message="注意：请确认兜底工作流输入/输出项与当前节点数据结构一致"
              type="warning"
              showIcon
            />
          </div>
        </CustomDivider>
      )}
      {bottomConfigEnable && (
        <Form.List name="rules" initialValue={[{ logicalOperator: "AND", executedMode: "NORMAL" }]}>
          {(fields, { add, remove, move }) => (
            <>
              <DragDropContext
                onDragEnd={(result) => {
                  onDragEnd(result, move)
                }}
              >
                <Droppable droppableId="rules-list">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {fields.map(({ key, name }, index) => {
                        const currentLogicalOperator =
                          form.getFieldValue(["rules", name, "logicalOperator"]) || "AND"
                        const currentConditions =
                          form.getFieldValue(["rules", name, "conditions"]) || []

                        return (
                          <Draggable key={key} draggableId={key.toString()} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}>
                                <Card
                                  size="small"
                                  title={
                                    <div
                                      {...provided.dragHandleProps}
                                      className="fallback-title flex items-center"
                                    >
                                      <DragIcon />
                                      <span className="ml-2">兜底方案 {name + 1}</span>
                                    </div>
                                  }
                                  key={key}
                                  className="mb-3"
                                  styles={{
                                    header: {
                                      borderBottom: "none"
                                    }
                                  }}
                                  extra={
                                    <Space>
                                      {fields.length > 1 && (
                                        <Button
                                          type="link"
                                          color="default"
                                          variant="link"
                                          onClick={() => remove(name)}
                                        >
                                          删除
                                        </Button>
                                      )}
                                    </Space>
                                  }
                                >
                                  <Space className="relative">
                                    <Space
                                      direction="vertical"
                                      align="baseline"
                                      style={{ width: 60, rowGap: 3 }}
                                      className={
                                        currentConditions.length > 1 ? "vertical-line" : ""
                                      }
                                    >
                                      {currentConditions.length > 1 && (
                                        <>
                                          <Form.Item
                                            name={[name, "logicalOperator"]}
                                            rules={[{ required: true, message: "请选择逻辑" }]}
                                            hidden={true}
                                          >
                                            <Select
                                              style={{ width: "60px" }}
                                              placeholder="请选择逻辑"
                                            >
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
                                              const newValue =
                                                toggleLogicalOperator(currentLogicalOperator)
                                              const currentRules = form.getFieldValue("rules") || []
                                              const updatedRules = currentRules.map(
                                                (rule, index) => {
                                                  if (index === name) {
                                                    return {
                                                      ...rule,
                                                      logicalOperator: newValue
                                                    }
                                                  }
                                                  return rule
                                                }
                                              )
                                              form.setFieldsValue({
                                                rules: updatedRules
                                              })
                                              setOperatorValue(newValue)
                                              forceUpdate({})
                                            }}
                                          >
                                            {/* {logicalOperatorMap[operatorValue] || "且"}
                                             */}
                                            {logicalOperatorMap[currentLogicalOperator] || "且"}
                                          </a>
                                        </>
                                      )}
                                    </Space>
                                    <Form.List name={[name, "conditions"]} initialValue={[{}]}>
                                      {(fieldsItem, { add, remove }) => (
                                        <>
                                          {fieldsItem.map(({ key: cKey, name: cName }) => (
                                            <Space
                                              key={cKey}
                                              style={{ display: "flex", flex: 1 }}
                                              align="start"
                                            >
                                              <div className="condition-label">
                                                {String.fromCharCode(65 + (cName % 26))}
                                              </div>

                                              {isTrue && (
                                                <>
                                                  <Form.Item
                                                    name={[cName, "failReason"]}
                                                    rules={[
                                                      {
                                                        required: true,
                                                        message: "请选择兜底项目"
                                                      }
                                                    ]}
                                                    className="mb-2"
                                                  >
                                                    <Select
                                                      style={{ width: "136px" }}
                                                      placeholder="选择兜底项目"
                                                      onChange={(value) => {
                                                        form.setFieldValue(
                                                          [
                                                            "rules",
                                                            name,
                                                            "conditions",
                                                            cName,
                                                            "operator"
                                                          ],
                                                          null
                                                        )
                                                        forceUpdate({})
                                                      }}
                                                    >
                                                      {bottomOptions.map((option) => (
                                                        <Select.Option
                                                          key={option.failReason}
                                                          value={option.failReason}
                                                        >
                                                          {option.desc}
                                                        </Select.Option>
                                                      ))}
                                                    </Select>
                                                  </Form.Item>
                                                  <Form.Item
                                                    name={[cName, "operator"]}
                                                    rules={[
                                                      { required: true, message: "请选择操作符" }
                                                    ]}
                                                    className="mb-2"
                                                  >
                                                    <Select
                                                      style={{ width: "84px" }}
                                                      placeholder="操作符"
                                                      onChange={(value) => {
                                                        forceUpdate({})
                                                      }}
                                                    >
                                                      {bottomOptions.map((option) => {
                                                        const failReason = form.getFieldValue([
                                                          "rules",
                                                          name,
                                                          "conditions",
                                                          cName,
                                                          "failReason"
                                                        ])
                                                        if (option.failReason === failReason) {
                                                          return option.operators?.map(
                                                            (operator) => {
                                                              return (
                                                                <Select.Option
                                                                  key={operator.code}
                                                                  value={operator.code}
                                                                >
                                                                  {operator.desc}
                                                                </Select.Option>
                                                              )
                                                            }
                                                          )
                                                        }
                                                      })}
                                                    </Select>
                                                  </Form.Item>
                                                </>
                                              )}
                                              {
                                                bottomOptions
                                                  .map((option) => {
                                                    const failReason = form.getFieldValue([
                                                      "rules",
                                                      name,
                                                      "conditions",
                                                      cName,
                                                      "failReason"
                                                    ])
                                                    const formOperator = form.getFieldValue([
                                                      "rules",
                                                      name,
                                                      "conditions",
                                                      cName,
                                                      "operator"
                                                    ])
                                                    if (
                                                      !failReason ||
                                                      (option.failReason === failReason &&
                                                        !formOperator)
                                                    ) {
                                                      return (
                                                        <Form.Item
                                                          name={[cName, "value"]}
                                                          rules={[
                                                            {
                                                              required: true,
                                                              message: "请输入内容"
                                                            }
                                                          ]}
                                                          className="mb-2"
                                                        >
                                                          <Input
                                                            style={{ width: "150px" }}
                                                            placeholder="请输入内容"
                                                          />
                                                        </Form.Item>
                                                      )
                                                    }
                                                    if (option.failReason === failReason) {
                                                      return option.operators?.map((operator) => {
                                                        if (
                                                          formOperator &&
                                                          operator.code === formOperator
                                                        ) {
                                                          return (
                                                            <Form.Item
                                                              name={[cName, "value"]}
                                                              className="mb-2"
                                                              rules={[
                                                                {
                                                                  required: operator.haveValue,
                                                                  message: "请输入内容"
                                                                }
                                                              ]}
                                                            >
                                                              <Input
                                                                addonAfter={option.unit}
                                                                disabled={
                                                                  !operator.haveValue || isDisabled
                                                                }
                                                                style={{ width: "150px" }}
                                                                placeholder={
                                                                  operator.haveValue === false
                                                                    ? "仅占位，无需输入"
                                                                    : "请输入内容"
                                                                }
                                                              />
                                                            </Form.Item>
                                                          )
                                                        }
                                                      })
                                                    }
                                                  })
                                                  .filter((el) => Boolean(el))[0]
                                              }
                                              {fieldsItem.length > 1 && (
                                                <div style={{ marginTop: 6 }}>
                                                  <DeleteIcon
                                                    onClick={() => {
                                                      remove(cName)
                                                      forceUpdate({})
                                                    }}
                                                  />
                                                </div>
                                              )}
                                            </Space>
                                          ))}
                                          <AddIcon
                                            className="mb-3"
                                            onClick={() => {
                                              add()
                                              forceUpdate({})
                                            }}
                                            text="增加表达式"
                                          />
                                        </>
                                      )}
                                    </Form.List>
                                  </Space>
                                  <Form.Item
                                    label="兜底动作"
                                    name={[name, "executedMode"]}
                                    initialValue="NORMAL"
                                    rules={[{ required: true, message: "请选择兜底动作" }]}
                                  >
                                    <Radio.Group
                                      onChange={() => {
                                        forceUpdate({})
                                      }}
                                    >
                                      <Radio value="SKIP">跳过本节点</Radio>
                                      <Radio value="NORMAL">执行兜底动作</Radio>
                                      {nodeType === "prompt-node" && (
                                        <Radio value="LLM_FALLBACK">模型降级</Radio>
                                      )}
                                    </Radio.Group>
                                  </Form.Item>
                                  {form.getFieldValue(["rules", name, "executedMode"]) ===
                                    "NORMAL" && (
                                    <Form.Item
                                      label="兜底工作流"
                                      labelCol={{
                                        span: 5
                                      }}
                                      name={[name, "skillNo"]}
                                      rules={[{ required: true, message: "请选择兜底工作流" }]}
                                      tooltip={{
                                        icon: <InfoIcon />,
                                        title:
                                          "强烈建议创建独立的兜底工作流，并注意输入和输出的数据结构，且需避免工作流死循环"
                                      }}
                                    >
                                      <Select
                                        showSearch
                                        placeholder="请选择兜底工作流"
                                        onSearch={handleSearch}
                                        filterOption={false}
                                        options={skills}
                                      />
                                    </Form.Item>
                                  )}
                                  {form.getFieldValue(["rules", name, "executedMode"]) ===
                                    "LLM_FALLBACK" && (
                                    <Form.Item
                                      label="降级模型类型"
                                      labelCol={{
                                        span: 5
                                      }}
                                      name={[name, "modelCode"]}
                                      rules={[{ required: true, message: "请选择降级模型类型" }]}
                                    >
                                      <Select showSearch placeholder="请选择降级模型类型">
                                        {modelOptions?.map((opt) => (
                                          <Select.Option
                                            key={opt.code}
                                            value={opt.code}
                                            disabled={opt.status === 0}
                                          >
                                            {opt.name}{" "}
                                            {opt.modalType?.map((m) => (
                                              <Tag
                                                bordered={false}
                                                color={parseModalTypeTagColor(m.code)}
                                              >
                                                {m.name}
                                              </Tag>
                                            ))}
                                          </Select.Option>
                                        ))}
                                      </Select>
                                    </Form.Item>
                                  )}
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <Form.Item>
                <AddIcon
                  onClick={() => {
                    add()
                    forceUpdate({})
                  }}
                  text="添加兜底方案"
                />
              </Form.Item>
            </>
          )}
        </Form.List>
      )}
    </>
  )
}

export default FallbackHandler
