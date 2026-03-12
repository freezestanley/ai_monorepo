import { useRef, useState, useMemo } from "react"
import { Form, Input, Button, Row, Col, Switch, Select, Popover, Tooltip, message } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { useFetchAvailableSkills } from "@/api/skill"
import { MessageType } from "@/constants/postMessageType"

const PropertyConfigTab = ({ form, botNo, agentDetail, onFormChange, loading }) => {
  const formListBottomRef = useRef(null)

  // 工作流搜索状态
  const [filterText, setFilterText] = useState("")

  // 获取工作流列表
  const { data: availableSkills = {} } = useFetchAvailableSkills({
    botNo,
    pageSize: 1000,
    pageNum: 1
  })

  // 处理工作流选项分组
  const skills = useMemo(() => {
    const selfSkills =
      availableSkills.selfSkills?.map((skill) => ({
        ...skill,
        label: skill.skillName,
        value: skill.skillNo
      })) || []
    const subscribedSkills =
      availableSkills.subscribedSkills?.map((skill) => ({
        ...skill,
        label: skill.skillName,
        value: skill.skillNo
      })) || []
    return [
      { label: "来自本空间", options: selfSkills.filter((o) => o.label.includes(filterText)) },
      {
        label: "来自其他空间",
        options: subscribedSkills.filter((o) => o.label.includes(filterText))
      }
    ]
  }, [availableSkills, filterText])

  const handleSearch = (value) => setFilterText(value)

  // Popover 控制
  const [propertyAddPopoverVisible, setPropertyAddPopoverVisible] = useState(false)

  // 表单验证规则
  const rules = {
    required: [{ required: true, message: "此项为必填项" }]
  }

  // 跳转到工作流详情
  const reTodoUrlHandel = (skillNo) => {
    window.parent.postMessage(
      {
        type: MessageType.NAVIGATE_TO_PROMPT,
        payload: {
          skillNo,
          _blank: true,
          isTools: true
        }
      },
      "*"
    )
  }

  return (
    <div className="p-0">
      <div className="text-xs text-gray-500 p-2 bg-white rounded border border-gray-200 mt-2 -mb-2">
        相同名单属性生效优先级：工作流名单属性 &gt; 脚本名单属性 &gt; 原始名单属性
      </div>
      <div className="my-5">
        <Form.List name="variableConfigs">
          {(fields, { add, remove }) => (
            <>
              {[...fields]
                .sort((a, b) => {
                  const ta = form.getFieldValue(["variableConfigs", a.name, "type"]) // 2优先
                  const tb = form.getFieldValue(["variableConfigs", b.name, "type"]) // 2优先
                  if (ta === 2 && tb !== 2) return -1
                  if (ta !== 2 && tb === 2) return 1
                  return a.name - b.name
                })
                .map((field, index) => {
                  const fieldType = form.getFieldValue(["variableConfigs", field.name, "type"]) || 1
                  const isSkillType = fieldType === 2
                  return (
                    <div
                      key={field.key}
                      className={`mb-4 p-3 border border-solid rounded-md relative ${
                        isSkillType ? "border-purple-200 bg-purple-50" : "border-gray-200"
                      }`}
                    >
                      <h4 className="text-sm font-medium mb-3">
                        {isSkillType ? "工作流名单属性" : "脚本名单属性"}
                        {/* {index + 1} */}
                      </h4>
                      <Button
                        type="link"
                        danger
                        onClick={() => remove(field.name)}
                        className="absolute right-2 top-2 text-xs"
                        icon={<PlusOutlined className="text-gray-500" rotate={45} />}
                      />
                      <div className="space-y-2">
                        {isSkillType ? (
                          <>
                            <Form.Item
                              {...field}
                              name={[field.name, "skillNo"]}
                              label={
                                <div className="flex items-center justify-between w-[100%] mr-1">
                                  <span className="flex items-center">名单工作流获取属性</span>
                                  {!!form.getFieldValue([
                                    "variableConfigs",
                                    field.name,
                                    "skillNo"
                                  ]) && (
                                    <Tooltip title="点击跳转工作流详情">
                                      <i
                                        className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9]"
                                        onClick={() => {
                                          reTodoUrlHandel(
                                            form.getFieldValue([
                                              "variableConfigs",
                                              field.name,
                                              "skillNo"
                                            ])
                                          )
                                        }}
                                      ></i>
                                    </Tooltip>
                                  )}
                                </div>
                              }
                              className="mb-2"
                              tooltip="该工作流必须返回单层字典，属性将会作为实际外呼参数的一部分"
                              rules={[{ required: true, message: "请选择工作流" }]}
                            >
                              <Select
                                placeholder="请选择工作流"
                                optionLabelProp="label"
                                showSearch
                                filterOption={false}
                                onSearch={handleSearch}
                              >
                                {skills.map((group) => (
                                  <Select.OptGroup key={group.label} label={group.label}>
                                    {group.options.map((skill) => (
                                      <Select.Option
                                        key={skill.value}
                                        value={skill.value}
                                        label={skill.label}
                                      >
                                        {skill.label}
                                      </Select.Option>
                                    ))}
                                  </Select.OptGroup>
                                ))}
                              </Select>
                            </Form.Item>
                          </>
                        ) : (
                          <>
                            <Form.Item
                              {...field}
                              name={[field.name, "name"]}
                              label="字段中文名称"
                              rules={rules.required}
                              className="mb-2"
                            >
                              <Input placeholder="请输入字段中文名称" allowClear />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, "fieldName"]}
                              label="字段Key"
                              rules={rules.required}
                              className="mb-2"
                            >
                              <Input placeholder="请输入字段Key" allowClear />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, "expression"]}
                              label="字段取值表达式"
                              tooltip="通过 EL表达式构建字段的值"
                              className="mb-2"
                            >
                              <Input.TextArea
                                placeholder="请输入字段取值表达式"
                                rows={3}
                                allowClear
                              />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, "isShow"]}
                              label="在通话记录中展示"
                              className="mb-2"
                              getValueFromEvent={(checked) => (checked ? 1 : 0)}
                              getValueProps={(value) => ({ checked: value === 1 })}
                            >
                              <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
                            </Form.Item>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              {fields.length === 0 && (
                <CustomEmpty description="暂无自定义字段，请点击下方按钮添加" />
              )}
              <Form.Item className="mt-4">
                {(() => {
                  const listValues = form.getFieldValue("variableConfigs") || []
                  const hasSkillProperty =
                    listValues.some((item) => Number(item?.type) === 2) ||
                    fields.some(
                      (field) =>
                        Number(form.getFieldValue(["variableConfigs", field.name, "type"])) === 2
                    )
                  return (
                    <Popover
                      content={
                        <div className="flex flex-col gap-2">
                          <a
                            disabled={hasSkillProperty}
                            title={hasSkillProperty ? "只能添加一个按工作流属性" : ""}
                            onClick={() => {
                              if (!hasSkillProperty) {
                                setPropertyAddPopoverVisible(false)
                                const cur = form.getFieldValue("variableConfigs") || []
                                form.setFieldValue("variableConfigs", [
                                  ...cur,
                                  {
                                    name: "",
                                    fieldName: "",
                                    expression: "",
                                    isShow: 0,
                                    type: 2,
                                    skillNo: undefined
                                  }
                                ])
                              } else {
                                message.error("只能添加一个按工作流属性")
                              }
                            }}
                            className="text-left"
                          >
                            按工作流添加
                          </a>
                          <a
                            type="link"
                            onClick={() => {
                              setPropertyAddPopoverVisible(false)
                              add({ name: "", fieldName: "", expression: "", isShow: 0, type: 1 })
                            }}
                            className="text-left !text-purple-600"
                          >
                            按脚本添加
                          </a>
                        </div>
                      }
                      title="选择添加方式"
                      trigger="hover"
                      open={propertyAddPopoverVisible}
                      styles={{
                        body: {
                          width: "150px"
                        }
                      }}
                      onOpenChange={setPropertyAddPopoverVisible}
                    >
                      <Button type="link" icon={<PlusOutlined />} className="!text-purple-600 !p-0">
                        名单属性
                      </Button>
                    </Popover>
                  )
                })()}
              </Form.Item>
              <div ref={formListBottomRef} />
            </>
          )}
        </Form.List>
      </div>
    </div>
  )
}

export default PropertyConfigTab
