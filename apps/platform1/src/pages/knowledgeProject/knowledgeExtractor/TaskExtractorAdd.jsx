/*
 * @Author: Dyton
 * @Date: 2024-03-16 10:26:23
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-09 13:38:05
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/TaskExtractorAdd.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useEffect, useState } from "react"
import { Container, Header, SplitTitle } from "./components"
import {
  Table,
  Radio,
  Space,
  Form,
  Button,
  Row,
  Col,
  Select,
  Spin,
  Input,
  message,
  TreeSelect
} from "antd"
import "./styles/index.scss"

import { useFetchStructureDatasetCatalog } from "@/api/structureKnowledge"
import {
  useExtraSkillsApi,
  useTaskDetailsApi,
  useSaveTaskApi,
  useKnowledgeClassApi
} from "@/api/knowledgeExtractor"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
const { Option } = Select
const filterOption = (input, option) => {
  return (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
}
/**
 * @description: 落库方式
 * @return {*}
 */
const DropKnowledgeMode = () => {
  return (
    <Row gutter={24}>
      <Col span={24}>
        <Form.Item
          name="auditing"
          initialValue="1"
          rules={[{ required: true, message: "请选择落库方式" }]}
          label={"落库方式"}
        >
          <Radio.Group defaultValue={"1"}>
            <Radio value={"1"}>需人工审核</Radio>
            <Radio value={"0"}>自动添加到知识库</Radio>
          </Radio.Group>
        </Form.Item>
      </Col>
    </Row>
  )
}
/**
 * @description: 目标问答知识库
 * @return {*}
 */
const TargetKnowledge = ({ loading, knowledgeClassOptions = [] }) => {
  return (
    <Spin spinning={loading}>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item
            name="faqCatalogNo"
            rules={[
              {
                required: true,
                message: "请选择知识库分类"
              }
            ]}
            label={"目标问答知识库"}
          >
            <TreeSelect
              showSearch
              style={{ width: "100%" }}
              dropdownStyle={{ maxHeight: 600, overflow: "auto" }}
              placeholder="请选择查询范围"
              allowClear
              treeData={knowledgeClassOptions}
              fieldNames={{
                label: "catalogName",
                value: "catalogNo",
                children: "children"
              }}
            />
          </Form.Item>
        </Col>
      </Row>
    </Spin>
  )
}

/**
 * @description: 目标数据集
 * @param {*} formInstance
 * @return {*}
 */
const StructureDatas = ({ disabled, formInstance, list = [], strategies = [] }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState(
    [...strategies].filter((v) => v.selected).map((v) => v.key)
  )
  const [structureStrategies, setStructureStrategies] = useState([...strategies])
  const columns = [
    {
      title: "字段名",
      dataIndex: "name",
      key: "name"
    },

    {
      title: "数据类型",
      dataIndex: "type",
      key: "type"
    },

    {
      title: "向量搜索",
      dataIndex: "embeddingModel",
      key: "embeddingModel",
      render: (text) => (text == 0 ? "否" : "是")
    },

    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      with: 300
    }
  ]
  const onSelectChange = (newSelectedRowKeys, selectedRows) => {
    setSelectedRowKeys(newSelectedRowKeys)
    const strategies = selectedRows?.length
      ? [...selectedRows].map((v) => ({ ...v, selected: true }))
      : undefined
    formInstance.setFieldsValue({ strategies })
  }
  const getDefaultSelectKeys = () => {
    return disabled
      ? [...structureStrategies].filter((v) => v.selected).map((v) => v.key)
      : [...structureStrategies].map((v) => v.key)
  }

  const getDefaultSelectKeysNew = () => {
    return disabled
      ? [...structureStrategies].filter((v) => v.selected)
      : [...structureStrategies].map((v) => ({ ...v, selected: true }))
  }

  useEffect(() => {
    if (structureStrategies.length) {
      const selectKeys = getDefaultSelectKeys()
      setSelectedRowKeys(selectKeys)
      // const strategies = [...selectKeys].map((v) => ({ ...v, selected: true }))
      formInstance.setFieldsValue({ strategies: getDefaultSelectKeysNew() })
    }
  }, [structureStrategies])

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: () => ({ disabled })
  }
  const onStructureChange = (value) => {
    const data = list?.find((v) => v.structureNo === value)
    const structureStrategies = data?.strategies
    const structureCatalogNo = data?.catalogNo
    formInstance.setFieldsValue({ structureCatalogNo })
    setStructureStrategies([...structureStrategies])
  }
  return (
    <div>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item hidden name={"structureCatalogNo"}></Form.Item>
          <Form.Item
            name="structureNo"
            rules={[
              {
                required: true,
                message: "请选择数据集"
              }
            ]}
            label={"目标数据集"}
          >
            <Select
              placeholder="请选择数据集"
              onChange={onStructureChange}
              filterOption={filterOption}
              showSearch
              optionFilterProp="children"
            >
              {list.map((v, i) => (
                <Option key={v?.structureNo} value={v?.structureNo}>
                  {v?.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      {structureStrategies?.length > 0 && (
        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              name="strategies"
              rules={[
                {
                  required: true,
                  message: "请选择索引字段"
                }
              ]}
              label={"索引字段"}
            >
              <Table
                onChange={() => selectedRowKeys}
                columns={columns}
                key={"key"}
                rowSelection={rowSelection}
                dataSource={structureStrategies}
                pagination={false}
              />
            </Form.Item>
          </Col>
        </Row>
      )}
    </div>
  )
}

export const TaskExtractorAdd = () => {
  const cssPrefix = "add-task-extractor"
  const [form] = Form.useForm()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { knowledgeBaseNo, botNo, taskCode } = queryParams

  const [optimizeType, setOptimizeType] = useState("1")
  const [extractionSkillName, setExtractionSkillName] = useState("")
  const [saved, setSaved] = useState(false)
  const getParams = () => {
    const p = `botNo=${botNo}&knowledgeBaseNo=${knowledgeBaseNo}`
    return p
  }
  // 目标数据集 列表
  const fetchRes = useFetchStructureDatasetCatalog({ knowledgeBaseNo })
  const { isLoading: structureDatasLoading } = fetchRes
  const structureDatas = fetchRes?.data?.data ?? []
  // 萃取工作流
  const fetchExtraSkillsRes = useExtraSkillsApi(botNo)
  const allSkills = fetchExtraSkillsRes?.data?.data ?? []
  // 优化到知识库 类型切换
  const onChangeOptimize = (e) => {
    const optimizeType = e?.target?.value
    setOptimizeType(optimizeType)
    form.resetFields(["structureNo"])
  }
  // 工作流切换
  const onChangeSkill = (values, options) => {
    setExtractionSkillName(options?.children)
  }
  const optimizeShow = (key) => optimizeType === key
  // 保存
  const { mutate } = useSaveTaskApi()
  const handlerSave = async () => {
    await form.validateFields()
    const values = form.getFieldsValue()
    mutate(
      {
        knowledgeBaseNo,
        botNo,
        // 调用的工作流名称
        extractionSkillName,
        ...values
      },
      {
        onSuccess: (e) => {
          if (e?.success) {
            message.success(e.message)
            setSaved(true)
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  // 目标问答知识库
  const { data: knowledgeClassOptions = [], isLoading: knowledgeClassLoading } =
    useKnowledgeClassApi({ knowledgeBaseNo })
  // 获取任务详情
  const { data: details, isLoading: detailsLoading } = useTaskDetailsApi(taskCode)
  const [strategies, setStrategies] = useState([])
  // 回显
  useEffect(() => {
    if (details) {
      form.setFieldsValue({ ...details })
      setOptimizeType(details?.optimizeType)
      setStrategies(details?.structureStrategies || [])
      setExtractionSkillName(details?.extractionSkillName)
    }
  }, [details])
  const loading = taskCode ? detailsLoading : false
  // 是否禁用
  const disabled = !!taskCode || saved

  return (
    <div className={cssPrefix}>
      <Header
        title={`${disabled ? "查看" : "新增"}知识萃取任务`}
        extraChild={
          !disabled && (
            <Button type="primary" onClick={handlerSave}>
              保存
            </Button>
          )
        }
        backUrl={`/taskExtractor?${getParams()}`}
      ></Header>
      <Form form={form} disabled={disabled}>
        <Spin spinning={loading}>
          <Container>
            <div className={`${cssPrefix}-container`}>
              <div className={`${cssPrefix}-boxs`}>
                <SplitTitle title={"萃取任务设置"}></SplitTitle>
                <div className={`${cssPrefix}-main`}>
                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item
                        name="taskName"
                        rules={[{ required: true, message: "请输入萃取任务名称" }]}
                        label={"萃取任务名称"}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item
                        name="extractionSkill"
                        rules={[{ required: true, message: "请选择萃取工作流" }]}
                        label={"萃取工作流"}
                      >
                        <Select
                          placeholder="请选择萃取工作流"
                          filterOption={filterOption}
                          showSearch
                          optionFilterProp="children"
                          onChange={onChangeSkill}
                        >
                          {allSkills.map((v, i) => (
                            <Option key={v?.skillNo} value={v?.skillNo}>
                              {v?.skillName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </div>
              <div className={`${cssPrefix}-boxs`}>
                <SplitTitle title={"优化到知识库"}></SplitTitle>
                <div className={`${cssPrefix}-main`}>
                  <Form.Item name="optimizeType" initialValue={"1"}>
                    <Radio.Group
                      value={optimizeType}
                      defaultValue={optimizeType}
                      onChange={onChangeOptimize}
                    >
                      <Space direction="vertical">
                        <Radio value={"1"}>优化到-问答知识</Radio>
                        {optimizeShow("1") && (
                          <div className={`${cssPrefix}-type-item`}>
                            <DropKnowledgeMode />
                            <TargetKnowledge
                              loading={knowledgeClassLoading}
                              knowledgeClassOptions={knowledgeClassOptions}
                            />
                          </div>
                        )}

                        <Radio value={"2"}>优化到-结构化知识</Radio>
                        {optimizeShow("2") && (
                          <div className={`${cssPrefix}-type-item`}>
                            <DropKnowledgeMode />
                            <Spin spinning={structureDatasLoading}>
                              <StructureDatas
                                list={structureDatas ?? []}
                                formInstance={form}
                                strategies={strategies}
                                disabled={disabled}
                              />
                            </Spin>
                          </div>
                        )}
                        <Radio value={"3"}>优化到-问答+结构化知识</Radio>
                        {optimizeShow("3") && (
                          <div className={`${cssPrefix}-type-item`}>
                            <DropKnowledgeMode />
                            <TargetKnowledge
                              loading={knowledgeClassLoading}
                              knowledgeClassOptions={knowledgeClassOptions}
                            />
                            <Spin spinning={structureDatasLoading}>
                              <StructureDatas
                                list={structureDatas ?? []}
                                strategies={strategies}
                                formInstance={form}
                                disabled={disabled}
                              />
                            </Spin>
                          </div>
                        )}
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </div>
              </div>
            </div>
          </Container>
        </Spin>
      </Form>
    </div>
  )
}
