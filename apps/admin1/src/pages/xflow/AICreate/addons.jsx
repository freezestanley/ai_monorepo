import { useAddSkillOrPluginOrKnowledgeBase, useFetchAICreateTools } from "@/api/AICreate"
import { useFetchCatalogList } from "@/api/knowledge"
import { useFetchAvailablePluginTools } from "@/api/pluginTool"
import { useFetchAvailableSkills } from "@/api/skill"
import { useFetchStructureDatasetListByBotNo } from "@/api/structureKnowledge"
import { formatCatalogNos } from "@/utils"
import { MinusCircleOutlined, PlusCircleOutlined, PlusOutlined } from "@ant-design/icons"
import {
  Tooltip,
  Button,
  Modal,
  Form,
  Typography,
  Row,
  Col,
  Select,
  Switch,
  Popconfirm,
  Space,
  Divider,
  TreeSelect,
  Input,
  message
} from "antd"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
const { Text } = Typography
const defaultTypeList = [
  {
    code: "document",
    name: "文档知识库"
  },
  {
    code: "faq",
    name: "问答知识库"
  }
  // {
  //   code: "structure",
  //   name: "结构化知识库"
  // }
]
function Addons({ botNo, skillNo, versionNo, appData, currentSkillInfo }) {
  const [searchParams] = useSearchParams()
  const agentNo = searchParams.get("agentNo")

  const [isOpen, setIsOpen] = useState(false)
  const [knowledgeTypeList, setKnowledgeTypeList] = useState(defaultTypeList)

  const [_, forceUpdate] = useState({})
  const [form] = Form.useForm()
  const [filterText, setFilterText] = useState("")
  const handleSearch = (val) => {
    setFilterText(val)
  }

  /**
   * 拉取数据集列表
   */
  const { data: dataSetList = [] } = useFetchStructureDatasetListByBotNo({
    botNo
  })
  const { data: queryRange } = useFetchCatalogList(botNo)

  const { data: initData } = useFetchAICreateTools({ skillNo, versionNo }, { enabled: isOpen })

  useEffect(() => {
    if (initData && isOpen === true) {
      form.setFieldsValue(initData)
      forceUpdate({})

      form.setFieldsValue({
        skillList: initData.skillNos?.map((item) => ({ skillNo: item })) || [],
        pluginList: initData.pluginNos?.map((item) => ({ pluginNo: item })) || [],
        knowledgeList: mergeKnowledge(initData.knowledgeBases) || []
      })
    }
  }, [initData, isOpen])

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())

  const { mutate: saveTools } = useAddSkillOrPluginOrKnowledgeBase()
  const { data: availableSkills = [] } = useFetchAvailableSkills({
    botNo,
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

  const { data: availablePluginTools = {} } = useFetchAvailablePluginTools({
    botNo
  })
  const pluginTools = useMemo(() => {
    const selfPlugins =
      availablePluginTools?.selfPlugins?.map((plugin) => {
        return {
          ...plugin,
          title: (
            <Tooltip title="只能选中工具的工具">
              <Text disabled>{plugin.pluginName}</Text>
            </Tooltip>
          ),
          value: plugin.pluginCode,
          selectable: false,
          italic: true,
          children:
            plugin.tools?.map((tool) => {
              return { ...tool, title: tool.toolName, value: tool.toolCode }
            }) || []
        }
      }) || []
    const subscribedPlugins =
      availablePluginTools?.subscribedPlugins?.map((plugin) => {
        return {
          ...plugin,
          title: (
            <Tooltip title="只能选中工具的工具">
              <Text disabled>{plugin.pluginName}</Text>
            </Tooltip>
          ),
          value: plugin.pluginCode,
          selectable: false,
          children:
            plugin.tools?.map((tool) => {
              return { ...tool, title: tool.toolName, value: tool.toolCode }
            }) || []
        }
      }) || []
    return [
      {
        title: <Text type="secondary">来自本空间</Text>,
        value: "self",
        selectable: false,
        children: selfPlugins
      },
      {
        title: <Text type="secondary">来自其他空间</Text>,
        value: "other",
        selectable: false,
        children: subscribedPlugins
      }
    ]
  }, [availablePluginTools])

  const onOpen = () => {
    setIsOpen(true)
  }
  const onClose = () => {
    setIsOpen(false)
  }
  const onOk = () => {
    form.validateFields().then((values) => {
      console.log(values)
      const { skillEnable, pluginEnable, knowledgeEnable, skillList, pluginList, knowledgeList } =
        values

      const knowledgeBase = []
      if (knowledgeEnable === true) {
        knowledgeList?.forEach((item) => {
          if (item.type !== "structure") {
            const catalogNos = formatCatalogNos(item.knowledgeNo)
            catalogNos.forEach((catalogNo) => {
              queryRange.forEach((r) => {
                const catalog = r?.children?.find((catalog) => catalog.catalogNo === catalogNo)
                if (catalog) {
                  knowledgeBase.push({
                    type: item.type,
                    baseNo: catalog.catalogNo,
                    baseName: catalog.catalogName
                  })
                }
              })
            })
          } else {
            // 结构化数据
            item.knowledgeNo?.forEach((structureNo) => {
              const structure = dataSetList?.find((item) => item.structureNo === structureNo)
              if (structure) {
                knowledgeBase.push({
                  type: item.type,
                  baseNo: structure.structureNo,
                  baseName: structure.name
                })
              }
            })
          }
        })
      }

      const submitData = {
        skillEnable,
        pluginEnable,
        knowledgeEnable,
        skillNos: skillList?.map((item) => item.skillNo) || [],
        pluginNos: pluginList?.map((item) => item.pluginNo) || [],
        knowledgeBases: knowledgeBase
      }

      console.log(submitData)

      saveTools(
        { ...submitData, skillNo, versionNo },
        {
          onSuccess: (e) => {
            if (e.success) {
              onClose()
            }
            message.success(e.message)
          }
        }
      )
    })
  }

  const onKnowledgeChange = () => {
    const knowledgeList = form.getFieldValue("knowledgeList") || []
    // 析出类型
    const hasSelectedType = knowledgeList.map((item) => {
      return item?.type
    })

    setKnowledgeTypeList((prev) => {
      return [...prev].map((item) => {
        if (hasSelectedType.includes(item.code)) {
          item.disabled = true
        } else {
          item.disabled = false
        }
        return item
      })
    })
  }

  return (
    <div>
      <Tooltip title="添加各种附件">
        <Button
          shape="round"
          size="small"
          style={{ fontSize: 12 }}
          icon={<PlusOutlined />}
          onClick={onOpen}
        >
          添加工作流/工具/知识库
        </Button>
      </Tooltip>
      <Modal
        title="添加工作流 / 工具 / 知识库"
        open={isOpen}
        maskClosable={false}
        onCancel={onClose}
        onOk={onOk}
        width="700px"
        styles={{
          body: {
            padding: "24px"
          }
        }}
      >
        <Form form={form} labelCol={{ span: 10 }}>
          <>
            <Space align="start" className="w-full justify-between mb-2">
              <div>
                <code className="text-sm font-bold text-gray-900">添加工作流</code>
                <p className="text-sm font-light text-gray-400">允许工作流在需要时调用指定工作流</p>
              </div>
              <Form.Item name="skillEnable" valuePropName="checked" initialValue={false}>
                <Switch
                  defaultChecked={false}
                  onChange={() => {
                    const currentSkillList = form.getFieldValue("skillList")
                    if (!currentSkillList || currentSkillList?.length === 0) {
                      form.setFieldValue("skillList", [{}])
                    }
                    forceUpdate({})
                  }}
                />
              </Form.Item>
            </Space>
            {form.getFieldValue("skillEnable") === true && (
              <Form.List name="skillList">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row key={key} gutter={24}>
                        <Col span={20}>
                          <Form.Item
                            name={[name, "skillNo"]}
                            rules={[{ required: true, message: "请选择工作流" }]}
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
                        <Col>
                          {fields.length > 1 && (
                            <Popconfirm
                              title="【删除】后，对应工作流将停止调用"
                              onConfirm={(e) => remove(name)}
                              okText="确认"
                              cancelText="取消"
                            >
                              <MinusCircleOutlined className="mr-2" />
                            </Popconfirm>
                          )}
                          <PlusCircleOutlined
                            onClick={() => {
                              add()
                            }}
                          />
                        </Col>
                      </Row>
                    ))}
                  </>
                )}
              </Form.List>
            )}
            <Divider plain />
          </>

          <>
            <Space align="start" className="w-full justify-between mb-2">
              <div>
                <code className="text-sm font-bold text-gray-900">添加工具</code>
                <p className="text-sm font-light text-gray-400">允许工作流在需要时调用指定工具</p>
              </div>
              <Form.Item name="pluginEnable" valuePropName="checked" initialValue={false}>
                <Switch
                  defaultChecked={false}
                  onChange={() => {
                    const currentPluginList = form.getFieldValue("pluginList")
                    if (!currentPluginList || currentPluginList?.length === 0) {
                      form.setFieldValue("pluginList", [{}])
                    }
                    forceUpdate({})
                  }}
                />
              </Form.Item>
            </Space>
            {form.getFieldValue("pluginEnable") === true && (
              <Form.List name="pluginList">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row key={key} gutter={24}>
                        <Col span={20}>
                          <Form.Item
                            name={[name, "pluginNo"]}
                            rules={[{ required: true, message: "请选择工具" }]}
                          >
                            <TreeSelect placeholder="请选择工具" treeData={pluginTools} />
                          </Form.Item>
                        </Col>
                        <Col>
                          {fields.length > 1 && (
                            <Popconfirm
                              title="【删除】后，对应工具将停止调用"
                              onConfirm={(e) => remove(name)}
                              okText="确认"
                              cancelText="取消"
                            >
                              <MinusCircleOutlined className="mr-2" />
                            </Popconfirm>
                          )}
                          <PlusCircleOutlined
                            onClick={() => {
                              add()
                            }}
                          />
                        </Col>
                      </Row>
                    ))}
                  </>
                )}
              </Form.List>
            )}
            <Divider plain />
          </>

          <>
            <Space align="start" className="w-full justify-between mb-2">
              <div>
                <code className="text-sm font-bold text-gray-900">添加知识库</code>
                <p className="text-sm font-light text-gray-400">允许工作流在需要时调用指定知识库</p>
              </div>
              <Form.Item name="knowledgeEnable" valuePropName="checked" initialValue={false}>
                <Switch
                  defaultChecked={false}
                  onChange={() => {
                    const currentKnowledgeList = form.getFieldValue("knowledgeList")
                    if (!currentKnowledgeList || currentKnowledgeList?.length === 0) {
                      form.setFieldValue("knowledgeList", [{}])
                    }
                    forceUpdate({})
                  }}
                />
              </Form.Item>
            </Space>
            {form.getFieldValue("knowledgeEnable") === true && (
              <Form.List name="knowledgeList">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row key={key} gutter={[0, 24]}>
                        <Col span={8}>
                          <Form.Item
                            name={[name, "type"]}
                            rules={[{ required: true, message: "请选择知识库类型" }]}
                          >
                            <Select
                              placeholder="请选择知识库类型"
                              style={{ borderRight: "none" }}
                              onChange={(sk) => {
                                onKnowledgeChange()
                                const currentKnowledgeList = form.getFieldValue("knowledgeList")
                                currentKnowledgeList[name].knowledgeNo = null
                                form.setFieldsValue({
                                  knowledgeList: currentKnowledgeList
                                })
                                forceUpdate({})
                              }}
                            >
                              {knowledgeTypeList.map((modalTypeItem) => (
                                <Select.Option
                                  key={modalTypeItem.code}
                                  disabled={modalTypeItem.disabled}
                                  value={modalTypeItem.code}
                                >
                                  {modalTypeItem.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={[name, "knowledgeNo"]}
                            rules={[{ required: true, message: "请选择知识库" }]}
                          >
                            {form.getFieldValue("knowledgeList")[name]?.type === "structure" ? (
                              <Select
                                showSearch
                                optionFilterProp="children"
                                placeholder="请选择数据集"
                                filterOption={filterOption}
                                options={dataSetList}
                                mode="multiple"
                                fieldNames={{
                                  label: "name",
                                  value: "structureNo"
                                }}
                              />
                            ) : form.getFieldValue("knowledgeList")[name]?.type === "faq" ||
                              form.getFieldValue("knowledgeList")[name]?.type === "document" ? (
                              <TreeSelect
                                showSearch
                                style={{ width: "100%" }}
                                dropdownStyle={{
                                  maxHeight: 400,
                                  overflow: "auto"
                                }}
                                placeholder="请选择查询范围"
                                allowClear
                                multiple
                                // treeDefaultExpandAll
                                treeData={queryRange}
                                treeCheckable={true}
                                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                                fieldNames={{
                                  label: "catalogName",
                                  value: "catalogNo",
                                  children: "children"
                                }}
                              />
                            ) : (
                              <Select showSearch placeholder="请先选择知识库类型" options={[]} />
                            )}
                          </Form.Item>
                        </Col>
                        <Form.Item name={[name, "baseName"]} hidden={true}>
                          <Input />
                        </Form.Item>
                        <Col className=" ml-6">
                          {fields.length > 1 && (
                            <Popconfirm
                              title="【删除】后，对应知识库将停止调用"
                              onConfirm={(e) => {
                                remove(name)
                                onKnowledgeChange()
                              }}
                              okText="确认"
                              cancelText="取消"
                            >
                              <MinusCircleOutlined className="mr-2" />
                            </Popconfirm>
                          )}
                          {fields.length < 2 && (
                            <PlusCircleOutlined
                              onClick={() => {
                                add()
                                onKnowledgeChange()
                              }}
                            />
                          )}
                        </Col>
                      </Row>
                    ))}
                  </>
                )}
              </Form.List>
            )}
          </>
        </Form>
      </Modal>
    </div>
  )
}

export default Addons

function mergeKnowledge(data = []) {
  const result = {}

  data.forEach((item) => {
    const { type, baseNo } = item

    if (!result[type]) {
      result[type] = {
        type,
        knowledgeNo: []
      }
    }

    result[type].knowledgeNo.push(baseNo)
  })

  return Object.values(result)
}
