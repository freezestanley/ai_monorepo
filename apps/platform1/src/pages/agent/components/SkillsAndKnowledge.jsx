import React, { useState, useEffect, useCallback, useMemo, forwardRef, useRef } from "react"
import { Input, Tabs, message, Button, Popover, Spin, Select, TreeSelect } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import "../detail.scss"
import { useFetchSkillListByPage, useFetchSubscribeSkillListByPage } from "@/api/skill"
import { fetchSourceTag } from "@/api/sourceTag/api"
import { fetchCatalogList } from "@/api/knowledge/api"
import { formatCatalogNos } from "@/utils"
import { useUpdateToolApprove, useSaveAgentVersion } from "@/api/agent"
import { convertAgentTypeForSave } from "@/utils/agentUtils"
import { useFetchStructureDatasetListByBotNo } from "@/api/structureKnowledge"
import VariableEditor from "./VariableEditor"
import ToolsTable, { ToolItem } from "./ToolsTable"

import VoiceSettingsPanel from "./VoiceSettingsPanel"

// 添加自定义样式
const treeSelectStyles = `
  .custom-tree-select-dropdown .ant-select-tree-node-content-wrapper {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
    display: inline-block;
  }
  
  .custom-tree-select-dropdown .ant-select-tree-checkbox + span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    display: inline-block;
    vertical-align: middle;
  }
  
  /* 确保title属性能正常工作，形成原生tooltip */
  .custom-tree-select-dropdown .ant-select-tree-node-content-wrapper[title],
  .custom-tree-select-dropdown .ant-select-tree-checkbox + span[title] {
    position: relative;
  }
`

const SkillsAndKnowledge = forwardRef(
  (
    {
      botNo,
      agentDetail,
      selectedTools,
      setSelectedTools,
      selectedSkills,
      setSelectedSkills,
      knowledgeBases,
      setKnowledgeBases,
      onSave,
      onToolApproveChange,
      prompt,
      type,
      model,
      agentMode,
      voiceTemplateNo,
      agentVars,
      setAgentVars,
      voiceConfig,
      onVoiceConfigChange,
      onVoiceConfigSave,
      isOnlyRead,
      voiceRefreshKey,
      stepInfos
    },
    ref
  ) => {
    // 内部状态管理
    const [isSkillCollapsed, setIsSkillCollapsed] = useState(true)
    const [debugState, setDebugState] = useState({
      qa: true,
      structured: true,
      document: true
    })
    const [popoverVisible, setPopoverVisible] = useState({
      skill: false,
      qa: false,
      structured: false,
      document: false
    })

    const [tempSelectedSkills, setTempSelectedSkills] = useState([])
    const [skillGroupList, setSkillGroupList] = useState([])
    const [skillFilterValue, setSkillFilterValue] = useState("全部")
    const [skillSearchKey, setSkillSearchKey] = useState("")
    const [isSkillComposing, setIsSkillComposing] = useState(false)
    const [skillTabValue, setSkillTabValue] = useState("1")

    // 知识库相关状态
    const [selectedDocKnowledges, setSelectedDocKnowledges] = useState([])
    const [selectedQAKnowledges, setSelectedQAKnowledges] = useState([])
    const [selectedStructKnowledges, setSelectedStructKnowledges] = useState([])
    const [tempSelectedDocKnowledges, setTempSelectedDocKnowledges] = useState([])
    const [tempSelectedQAKnowledges, setTempSelectedQAKnowledges] = useState([])
    const [tempSelectedStructKnowledges, setTempSelectedStructKnowledges] = useState([])
    const [knowledgeTreeData, setKnowledgeTreeData] = useState([])
    const [knowledgeLoading, setKnowledgeLoading] = useState(false)
    const [knowledgeSearchKey, setKnowledgeSearchKey] = useState("")

    // 工具和工作流的预授权状态
    const [skillApproveMap, setSkillApproveMap] = useState({})

    // 记忆相关状态
    const [isMemoryCollapsed, setIsMemoryCollapsed] = useState(true)
    const [memoryPopoverVisible, setMemoryPopoverVisible] = useState(false)
    const lastAgentVarsRef = useRef(null)

    // 结构化知识库平铺列表
    const { data: structureDatasetList = [] } = useFetchStructureDatasetListByBotNo({ botNo })
    const structureMapByNo = useMemo(() => {
      const m = {}
      ;(structureDatasetList || []).forEach((it) => {
        if (it && it.structureNo) m[it.structureNo] = it
      })
      return m
    }, [structureDatasetList])
    const structureOptions = useMemo(
      () =>
        (structureDatasetList || []).map((it) => ({
          label: it.name,
          value: it.structureNo
        })),
      [structureDatasetList]
    )
    const getStructureName = useCallback(
      (structureNo) => structureMapByNo?.[structureNo]?.name || structureNo,
      [structureMapByNo]
    )
    const getStructureKnowledgeBaseNo = useCallback(
      (structureNo) => structureMapByNo?.[structureNo]?.knowledgeBaseNo || structureNo,
      [structureMapByNo]
    )

    // 处理预授权变更
    const { mutate: updateToolApprove } = useUpdateToolApprove()
    const { mutate: saveAgentVersion } = useSaveAgentVersion()

    // API hooks
    const {
      data: skillData = {},
      isLoading: skillsLoading,
      refetch: fetchSkills
    } = useFetchSkillListByPage({
      disabledInit: true,
      botNo,
      pageSize: 500,
      pageNum: 1,
      orderField: "gmt_modified",
      asc: false,
      manual: true
    })

    const {
      data: subscribedSkillData = {},
      isLoading: subscribedSkillLoading,
      refetch: fetchSubSkills
    } = useFetchSubscribeSkillListByPage({
      disabledInit: true,
      botNo,
      bizType: "SKILL",
      pageSize: 100,
      pageNum: 1,
      manual: true
    })

    const availableSkills = useMemo(
      () => ({
        selfSkills: skillData.skillList || [],
        subscribedSkills: (subscribedSkillData.list || []).map((item) => ({
          ...item,
          skillName: item.name,
          skillNo: item.bizNo,
          type: "sub",
          skillType: item.skillType || 1
        }))
      }),
      [skillData, subscribedSkillData]
    )

    // 初始化数据和请求
    useEffect(() => {
      if (agentDetail) {
        // 设置选中的ID
        setSelectedTools(agentDetail.pluginNos || [])
        setSelectedSkills(agentDetail.skillNos || [])

        const incomingVars = Array.isArray(agentDetail.vars) ? agentDetail.vars : null
        if (incomingVars && incomingVars !== lastAgentVarsRef.current) {
          // 初始化变量数据，为每个变量添加varNo字段
          const vars = incomingVars.map((variable) => ({
            ...variable,
            varNo:
              variable.varNo || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // 确保每个变量都有varNo
          }))
          setAgentVars(vars)
          lastAgentVarsRef.current = incomingVars
        }

        // 请求数据
        if (agentDetail.skillNos?.length) {
          fetchSkills()
          fetchSubSkills()
        }
      }
    }, [agentDetail])

    // 渲染选中的工作流列表
    const selectedSkillsList = useMemo(() => {
      return [...availableSkills.selfSkills, ...availableSkills.subscribedSkills].filter((item) =>
        selectedSkills.some((skillId) => skillId === item.skillNo)
      )
    }, [availableSkills, selectedSkills])

    // 监听 selectedSkills 变化，更新折叠状态
    useEffect(() => {
      setIsSkillCollapsed(selectedSkills.length === 0)
    }, [selectedSkills])

    // 获取工作流分组列表
    const getSkillGroupList = useCallback(async () => {
      const res = await fetchSourceTag({ botNo, tagType: "skillGroupTag" })
      setSkillGroupList(res.data?.length ? res.data : [])
    }, [botNo])

    useEffect(() => {
      if (popoverVisible.skill) {
        getSkillGroupList()
      }
    }, [popoverVisible.skill])

    const skillSelector = (type) => {
      // 过滤和分组我的工作流
      const filterAndGroupSelfSkills = () => {
        // 过滤掉调试中和已关闭的工作流
        const filteredSkills = availableSkills.selfSkills.filter(
          (skill) => skill.status === 1 && !skill.statusDisplayName?.includes("调试中")
        )

        // 按分组组织工作流
        const skillsOfGroup = filteredSkills.reduce((acc, skill) => {
          const groupName = skill.groupTagName || "未分组"
          if (!acc[groupName]) {
            acc[groupName] = []
          }
          acc[groupName].push(skill)
          return acc
        }, {})

        return skillsOfGroup
      }

      // 过滤订阅的工作流
      const filterSubscribedSkills = () => {
        return availableSkills.subscribedSkills.filter((skill) => skill.status === true)
      }

      return (
        <div className="w-[300px]">
          <Tabs
            size="small"
            activeKey={skillTabValue}
            onChange={(key) => setSkillTabValue(key)}
            items={[
              {
                key: "1",
                label: "我的工作流",
                children: (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Select
                        value={skillFilterValue}
                        style={{ width: 120 }}
                        className="!-mt-[5px]"
                        onChange={(value) => setSkillFilterValue(value)}
                        options={[
                          { label: "全部", value: "全部" },
                          ...skillGroupList.map((group) => ({
                            label: group.tagDesc,
                            value: group.tagDesc
                          })),
                          { label: "未分组", value: "未分组" }
                        ]}
                      />
                      <Input
                        placeholder="搜索工作流"
                        value={skillSearchKey}
                        onChange={(e) => {
                          setSkillSearchKey(e.target.value)
                        }}
                        onCompositionStart={() => setIsSkillComposing(true)}
                        onCompositionEnd={() => setIsSkillComposing(false)}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[300px]">
                      {skillsLoading ? (
                        <div className="flex justify-center py-8">
                          <Spin title="加载中..." />
                        </div>
                      ) : Object.entries(filterAndGroupSelfSkills()).filter(([groupName]) => {
                          if (skillFilterValue === "全部") return true
                          return groupName === skillFilterValue
                        }).length === 0 ? (
                        <div className="w-full py-4">
                          <CustomEmpty description="暂无可用工作流" />
                        </div>
                      ) : (
                        Object.entries(filterAndGroupSelfSkills())
                          .filter(([groupName]) => {
                            if (skillFilterValue === "全部") return true
                            return groupName === skillFilterValue
                          })
                          .map(([groupName, skills]) => (
                            <div key={groupName} className="flex flex-col gap-2">
                              <div className="text-[12px] text-[#475467] mb-2">{groupName}</div>
                              {skills
                                .filter(
                                  (skill) =>
                                    !isSkillComposing &&
                                    (skill.skillName
                                      ?.toLowerCase()
                                      .includes(skillSearchKey.toLowerCase()) ||
                                      skill.description
                                        ?.toLowerCase()
                                        .includes(skillSearchKey.toLowerCase()))
                                )
                                .map((skill) => (
                                  <ToolItem
                                    key={skill.skillNo}
                                    item={{
                                      ...skill,
                                      name: skill.skillName,
                                      description: skill.description,
                                      type:
                                        skill.type === "sub"
                                          ? "subscribed_skill"
                                          : skill.skillType || skill.type || 1
                                    }}
                                    idKey="skillNo"
                                    checked={tempSelectedSkills.some(
                                      (skillId) => skillId == skill.skillNo
                                    )}
                                    onCheckChange={(checked, id) => {
                                      if (checked) {
                                        if (!tempSelectedSkills.some((skillId) => skillId == id)) {
                                          setTempSelectedSkills([...tempSelectedSkills, id])
                                        }
                                      } else {
                                        setTempSelectedSkills(
                                          tempSelectedSkills.filter((no) => no !== id)
                                        )
                                      }
                                    }}
                                  />
                                ))}
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )
              },
              {
                key: "2",
                label: "已订阅",
                children: (
                  <div className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[300px]">
                    {skillsLoading ? (
                      <div className="flex justify-center py-8">
                        <Spin title="加载中..." />
                      </div>
                    ) : filterSubscribedSkills().filter(
                        (skill) =>
                          !isSkillComposing &&
                          (skill.skillName?.toLowerCase().includes(skillSearchKey.toLowerCase()) ||
                            skill.description?.toLowerCase().includes(skillSearchKey.toLowerCase()))
                      ).length === 0 ? (
                      <div className="w-full py-4">
                        <CustomEmpty description="暂无订阅工作流" />
                      </div>
                    ) : (
                      filterSubscribedSkills()
                        .filter(
                          (skill) =>
                            !isSkillComposing &&
                            (skill.skillName
                              ?.toLowerCase()
                              .includes(skillSearchKey.toLowerCase()) ||
                              skill.description
                                ?.toLowerCase()
                                .includes(skillSearchKey.toLowerCase()))
                        )
                        .map((skill) => (
                          <ToolItem
                            key={skill.bizNo}
                            item={{
                              ...skill,
                              name: skill.skillName,
                              description: skill.description,
                              type: "subscribed_skill",
                              skillType: skill.skillType || 1
                            }}
                            idKey="bizNo"
                            avatarBgColor="#f66a3f"
                            checked={tempSelectedSkills.some((skillId) => skillId == skill.bizNo)}
                            onCheckChange={(checked, id) => {
                              if (checked) {
                                if (!tempSelectedSkills.some((skillId) => skillId == id)) {
                                  setTempSelectedSkills([...tempSelectedSkills, id])
                                }
                              } else {
                                setTempSelectedSkills(tempSelectedSkills.filter((no) => no !== id))
                              }
                            }}
                          />
                        ))
                    )}
                  </div>
                )
              }
            ]}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button
              size="small"
              onClick={() => setPopoverVisible({ ...popoverVisible, [type]: false })}
            >
              取消
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                // 计算新增和移除的工作流
                const addedSkills = tempSelectedSkills.filter((id) => !selectedSkills.includes(id))
                const removedSkills = selectedSkills.filter(
                  (id) => !tempSelectedSkills.includes(id)
                )

                // 重置移除的工作流的授权状态
                if (removedSkills.length > 0) {
                  setSkillApproveMap((prev) => {
                    const newMap = { ...prev }
                    removedSkills.forEach((id) => {
                      delete newMap[id]
                    })
                    return newMap
                  })
                }

                setSelectedSkills(tempSelectedSkills)
                setPopoverVisible({ ...popoverVisible, [type]: false })
                message.success("工作流选择已更新")
                onSave?.({
                  pluginNos: selectedTools.filter((toolId) => toolId),
                  skillNos: tempSelectedSkills,
                  knowledgeBases: knowledgeBases
                })
              }}
            >
              确认
            </Button>
          </div>
        </div>
      )
    }

    // 删除工作流时触发保存
    const handleSkillDelete = (id) => {
      const newSelectedSkills = selectedSkills.filter((no) => no != id)

      // 重置已删除工作流的授权状态
      setSkillApproveMap((prev) => {
        const newMap = { ...prev }
        delete newMap[id] // 从授权状态映射中移除
        return newMap
      })

      setSelectedSkills(newSelectedSkills)
      // 同时更新临时选中状态
      setTempSelectedSkills(newSelectedSkills)
      // 确保传递最新的数据给父组件，并过滤掉空值
      onSave?.({
        pluginNos: selectedTools.filter((toolId) => toolId),
        skillNos: newSelectedSkills.filter((skillId) => skillId),
        knowledgeBases: knowledgeBases
      })
    }

    // 获取知识库树形数据
    const getKnowledgeTreeData = useCallback(async () => {
      if (!botNo) return

      setKnowledgeLoading(true)
      try {
        const catalogsTreeList = await fetchCatalogList(botNo)
        if (catalogsTreeList && Array.isArray(catalogsTreeList)) {
          // 递归转换函数，处理任意层级的树形结构
          const convertToTreeData = (nodes) => {
            return nodes.map((node) => ({
              catalogName: node.catalogName,
              catalogNo: node.catalogNo,
              knowledgeBaseNo: node.knowledgeBaseNo,
              children:
                node.children && node.children.length > 0 ? convertToTreeData(node.children) : []
            }))
          }

          const treeData = convertToTreeData(catalogsTreeList)
          setKnowledgeTreeData(treeData)
        } else {
          setKnowledgeTreeData([])
        }
      } catch (error) {
        console.error("获取知识库目录失败:", error)
        message.error("获取知识库目录失败")
      } finally {
        setKnowledgeLoading(false)
      }
    }, [botNo])

    useEffect(() => {
      if (popoverVisible.document || popoverVisible.qa || popoverVisible.structured) {
        getKnowledgeTreeData()
      }
    }, [
      popoverVisible.document,
      popoverVisible.qa,
      popoverVisible.structured,
      getKnowledgeTreeData
    ])

    // 从外部传入的knowledgeBases初始化内部状态
    useEffect(() => {
      if (knowledgeBases && knowledgeBases.length > 0) {
        // 先获取知识库树形数据
        getKnowledgeTreeData().then(() => {
          // 将knowledgeBases按类型分类
          const docKnowledges = knowledgeBases
            .filter((kb) => kb.type === "document")
            .map((kb) => kb.baseNo)

          const qaKnowledges = knowledgeBases
            .filter((kb) => kb.type === "faq")
            .map((kb) => kb.baseNo)

          const structuredKnowledges = knowledgeBases
            .filter((kb) => kb.type === "structure")
            .map((kb) => kb.baseNo)

          // 设置内部状态

          setSelectedDocKnowledges(docKnowledges)
          setSelectedQAKnowledges(qaKnowledges)
          setSelectedStructKnowledges(structuredKnowledges)

          // 同时初始化临时选择状态
          setTempSelectedDocKnowledges(docKnowledges)
          setTempSelectedQAKnowledges(qaKnowledges)
          setTempSelectedStructKnowledges(structuredKnowledges)
        })
      }
    }, [knowledgeBases, getKnowledgeTreeData])

    // 监听选中的知识库变化，更新折叠状态
    useEffect(() => {
      setDebugState((prev) => ({
        ...prev,
        document: selectedDocKnowledges.length === 0
      }))
    }, [selectedDocKnowledges])

    useEffect(() => {
      setDebugState((prev) => ({
        ...prev,
        qa: selectedQAKnowledges.length === 0
      }))
    }, [selectedQAKnowledges])

    useEffect(() => {
      setDebugState((prev) => ({
        ...prev,
        structured: selectedStructKnowledges.length === 0
      }))
    }, [selectedStructKnowledges])

    // 监听选中的变量变化，更新折叠状态
    useEffect(() => {
      setIsMemoryCollapsed(agentVars.length === 0)
    }, [agentVars])

    // 结构化知识库选择器（使用拍平接口）
    const knowledgeSelectorStructured = () => (
      <div className="w-[300px]">
        <Select
          showSearch
          mode="multiple"
          allowClear
          placeholder="请选择结构化知识库"
          style={{ width: "100%" }}
          value={tempSelectedStructKnowledges}
          onChange={(vals) => setTempSelectedStructKnowledges(vals)}
          options={structureOptions}
          optionFilterProp="label"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button
            size="small"
            onClick={() => setPopoverVisible({ ...popoverVisible, structured: false })}
          >
            取消
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => {
              const typeMap = { document: "document", qa: "faq", structured: "structure" }
              const currentSelected = tempSelectedStructKnowledges

              setSelectedStructKnowledges(currentSelected)

              const newKnowledgeBases = [
                // 文档知识库（保持不变）
                ...selectedDocKnowledges.map((catalogNo) => ({
                  type: typeMap.document,
                  baseNo: catalogNo,
                  knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
                  baseName: getKnowledgeName(catalogNo)
                })),
                // 问答知识库（保持不变）
                ...selectedQAKnowledges.map((catalogNo) => ({
                  type: typeMap.qa,
                  baseNo: catalogNo,
                  knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
                  baseName: getKnowledgeName(catalogNo)
                })),
                // 结构化知识库（使用拍平数据映射）
                ...currentSelected.map((structureNo) => ({
                  type: typeMap.structured,
                  baseNo: structureNo,
                  knowledgeBaseNo: getStructureKnowledgeBaseNo(structureNo),
                  baseName: getStructureName(structureNo)
                }))
              ]

              setPopoverVisible({ ...popoverVisible, structured: false })
              message.success("结构化知识库选择已更新")
              setKnowledgeBases?.(newKnowledgeBases)
              onSave?.({
                pluginNos: selectedTools.filter((toolId) => toolId),
                skillNos: selectedSkills,
                knowledgeBases: newKnowledgeBases
              })
            }}
          >
            确认
          </Button>
        </div>
      </div>
    )

    // 知识库选择器（文档/问答）
    const knowledgeSelector = (type) => (
      <div className="w-[300px]">
        {knowledgeLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : (
          <TreeSelect
            showSearch
            style={{ width: "100%" }}
            dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
            placeholder={`请选择${type === "document" ? "文档" : type === "qa" ? "问答" : "结构化"}知识库`}
            allowClear
            multiple
            treeCheckable={true}
            showCheckedStrategy={TreeSelect.SHOW_CHILD}
            treeData={knowledgeTreeData}
            placement="topRight"
            value={type === "document" ? tempSelectedDocKnowledges : tempSelectedQAKnowledges}
            onChange={(value, label, extra) => {
              const formattedValue = formatCatalogNos(value)
              if (type === "document") {
                setTempSelectedDocKnowledges(formattedValue)
              } else {
                setTempSelectedQAKnowledges(formattedValue)
              }
            }}
            fieldNames={{ label: "catalogName", value: "catalogNo", children: "children" }}
            filterTreeNode={(inputValue, treeNode) => {
              const catalogName = treeNode.catalogName || ""
              return catalogName.toLowerCase().includes(inputValue.toLowerCase())
            }}
            treeNodeFilterProp="catalogName"
            searchValue={knowledgeSearchKey}
            onSearch={(value) => setKnowledgeSearchKey(value)}
            dropdownClassName="custom-tree-select-dropdown"
          />
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            size="small"
            onClick={() => setPopoverVisible({ ...popoverVisible, [type]: false })}
          >
            取消
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => {
              const typeMap = { document: "document", qa: "faq", structured: "structure" }
              const currentSelected =
                type === "document" ? tempSelectedDocKnowledges : tempSelectedQAKnowledges

              if (type === "document") {
                setSelectedDocKnowledges(currentSelected)
              } else {
                setSelectedQAKnowledges(currentSelected)
              }

              const newKnowledgeBases = [
                ...(type === "document"
                  ? currentSelected.map((catalogNo) => ({
                      type: typeMap.document,
                      baseNo: catalogNo,
                      knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
                      baseName: getKnowledgeName(catalogNo)
                    }))
                  : selectedDocKnowledges.map((catalogNo) => ({
                      type: typeMap.document,
                      baseNo: catalogNo,
                      knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
                      baseName: getKnowledgeName(catalogNo)
                    }))),
                ...(type === "qa"
                  ? currentSelected.map((catalogNo) => ({
                      type: typeMap.qa,
                      baseNo: catalogNo,
                      knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
                      baseName: getKnowledgeName(catalogNo)
                    }))
                  : selectedQAKnowledges.map((catalogNo) => ({
                      type: typeMap.qa,
                      baseNo: catalogNo,
                      knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
                      baseName: getKnowledgeName(catalogNo)
                    }))),
                // 结构化保持原选择
                ...selectedStructKnowledges.map((structureNo) => ({
                  type: typeMap.structured,
                  baseNo: structureNo,
                  knowledgeBaseNo: getStructureKnowledgeBaseNo(structureNo),
                  baseName: getStructureName(structureNo)
                }))
              ]

              setPopoverVisible({ ...popoverVisible, [type]: false })
              message.success(`${type === "document" ? "文档" : "问答"}知识库选择已更新`)

              setKnowledgeBases?.(newKnowledgeBases)
              onSave?.({
                pluginNos: selectedTools.filter((toolId) => toolId),
                skillNos: selectedSkills,
                knowledgeBases: newKnowledgeBases
              })
            }}
          >
            确认
          </Button>
        </div>
      </div>
    )

    // 删除知识库
    const handleKnowledgeDelete = (id, type) => {
      let newSelected = []
      const typeMap = {
        document: "document",
        qa: "faq",
        structured: "structure"
      }

      if (type === "document") {
        newSelected = selectedDocKnowledges.filter((item) => item !== id)
        setSelectedDocKnowledges(newSelected)
      } else if (type === "qa") {
        newSelected = selectedQAKnowledges.filter((item) => item !== id)
        setSelectedQAKnowledges(newSelected)
      } else {
        newSelected = selectedStructKnowledges.filter((item) => item !== id)
        setSelectedStructKnowledges(newSelected)
      }

      // 构建新的知识库数组，包含所有类型的知识库
      const newKnowledgeBases = [
        // 文档知识库
        ...(type === "document"
          ? newSelected.map((catalogNo) => ({
              type: typeMap.document,
              baseNo: catalogNo,
              knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
              baseName: getKnowledgeName(catalogNo)
            }))
          : selectedDocKnowledges.map((catalogNo) => ({
              type: typeMap.document,
              baseNo: catalogNo,
              knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
              baseName: getKnowledgeName(catalogNo)
            }))),
        // 问答知识库
        ...(type === "qa"
          ? newSelected.map((catalogNo) => ({
              type: typeMap.qa,
              baseNo: catalogNo,
              knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
              baseName: getKnowledgeName(catalogNo)
            }))
          : selectedQAKnowledges.map((catalogNo) => ({
              type: typeMap.qa,
              baseNo: catalogNo,
              knowledgeBaseNo: getKnowledgeBaseNo(catalogNo),
              baseName: getKnowledgeName(catalogNo)
            }))),
        // 结构化知识库
        ...(type === "structured"
          ? newSelected.map((structureNo) => ({
              type: typeMap.structured,
              baseNo: structureNo,
              knowledgeBaseNo: getStructureKnowledgeBaseNo(structureNo),
              baseName: getStructureName(structureNo)
            }))
          : selectedStructKnowledges.map((structureNo) => ({
              type: typeMap.structured,
              baseNo: structureNo,
              knowledgeBaseNo: getStructureKnowledgeBaseNo(structureNo),
              baseName: getStructureName(structureNo)
            })))
      ]

      // 更新外部知识库状态
      setKnowledgeBases?.(newKnowledgeBases)

      // 保存知识库选择
      onSave?.({
        pluginNos: selectedTools.filter((toolId) => toolId),
        skillNos: selectedSkills,
        knowledgeBases: newKnowledgeBases
      })
    }

    // 获取知识库名称
    const getKnowledgeName = (id) => {
      const findName = (data) => {
        // 确保 data 是数组且不为空
        if (!Array.isArray(data) || data.length === 0) {
          return id
        }

        // 遍历所有节点
        for (const node of data) {
          // 检查当前节点
          if (node.catalogNo === id) {
            return node.catalogName
          }

          // 递归检查子节点
          if (node.children && node.children.length > 0) {
            const name = findName(node.children)
            if (name !== id) {
              return name
            }
          }
        }

        return id
      }

      return findName(knowledgeTreeData)
    }

    // 获取知识库的knowledgeBaseNo
    const getKnowledgeBaseNo = (catalogNo) => {
      const findKnowledgeBaseNo = (data) => {
        // 确保 data 是数组且不为空
        if (!Array.isArray(data) || data.length === 0) {
          return catalogNo
        }

        // 遍历所有节点
        for (const node of data) {
          // 检查当前节点
          if (node.catalogNo === catalogNo) {
            return node.knowledgeBaseNo || catalogNo
          }

          // 递归检查子节点
          if (node.children && node.children.length > 0) {
            const no = findKnowledgeBaseNo(node.children)
            if (no !== catalogNo) {
              return no
            }
          }
        }

        return catalogNo
      }

      return findKnowledgeBaseNo(knowledgeTreeData)
    }

    // 处理工作流预授权状态变更
    const handleSkillApproveChange = (isApproved, skillNo, skillName) => {
      if (!agentDetail || !agentDetail.agentNo || !agentDetail.versionNo) {
        message.error("Agent 信息不完整，无法更新授权状态")
        return
      }

      updateToolApprove(
        {
          agentNo: agentDetail.agentNo,
          versionNo: agentDetail.versionNo,
          pluginToolNo: "",
          skillNo: skillNo,
          preApprove: isApproved
        },
        {
          onSuccess: (res) => {
            if (res.success) {
              // 直接更新本地状态，不通知父组件刷新
              setSkillApproveMap((prev) => ({
                ...prev,
                [skillNo]: isApproved
              }))
              message.success(`工作流【${skillName}】${isApproved ? "已设置授权" : "已取消授权"}`)
            }
          }
        }
      )
    }

    // 处理从 agentDetail 中初始化预授权配置
    useEffect(() => {
      if (agentDetail) {
        // 初始化工作流预授权状态
        const skillApproves = {}
        if (agentDetail.skillConfigs && agentDetail.skillConfigs.length > 0) {
          agentDetail.skillConfigs.forEach((config) => {
            if (config.toolType === "skill") {
              skillApproves[config.toolNo] = config.preApprove
            }
          })
        }
        setSkillApproveMap(skillApproves)
      }
    }, [agentDetail])

    // 变量相关操作函数
    const handleDeleteVar = (varNo) => {
      const newVars = agentVars.filter((v) => v.varNo !== varNo)
      setAgentVars(newVars)

      // 更新agentVars并保存
      saveVarsToAgent(newVars)
    }

    const handleVarToggle = (varNo, enabled) => {
      const newVars = agentVars.map((v) => (v.varNo === varNo ? { ...v, enabled } : v))
      setAgentVars(newVars)

      // 更新agentVars并保存
      saveVarsToAgent(newVars)
    }

    const saveVarsToAgent = (vars) => {
      if (!agentDetail || !agentDetail.agentNo || !agentDetail.versionNo) {
        message.error("Agent 信息不完整，无法保存变量")
        return
      }

      // 过滤掉varNo字段，只保留后端需要的字段
      const backendVars = (vars || []).map(({ varNo, isNew, ...rest }) => rest)

      // 处理type转换：voice_intelligent_mode 需要转换为 single_agent_llm_mode
      const convertedType = convertAgentTypeForSave(type)

      const payload = {
        agentNo: agentDetail.agentNo,
        versionNo: agentDetail.versionNo,
        pluginNos: selectedTools.filter((toolId) => toolId),
        skillNos: selectedSkills.filter((skillId) => skillId),
        knowledgeBases: knowledgeBases,
        vars: backendVars,
        model: model,
        prompt: prompt,
        type: convertedType
      }

      // 如果是语音模式，添加相应参数
      if (agentMode == 2) {
        payload.agentMode = agentMode
        if (voiceTemplateNo) {
          payload.voiceTemplateNo = voiceTemplateNo
        }
      }

      //TODO 取消 记忆-变量自动保存功能
      // saveAgentVersion(payload, {
      //   onSuccess: (res) => {
      //     if (res.success) {
      //       message.success("变量保存成功")
      //     } else {
      //       message.error(res.message || "变量保存失败")
      //     }
      //   },
      //   onError: (error) => {
      //     message.error(error.message || "变量保存失败")
      //   }
      // })
    }

    const handleConfirmVars = (vars) => {
      setAgentVars([...vars])
      setMemoryPopoverVisible(false)
      saveVarsToAgent(vars)
    }

    return (
      <div className="space-y-6 -mt-[20px]">
        {/* 注入自定义样式 */}
        <style dangerouslySetInnerHTML={{ __html: treeSelectStyles }} />
        {/* 语音设置 - 只在语音Agentic下显示 */}
        {type === "voice_intelligent_mode" && (
          <VoiceSettingsPanel
            ref={ref}
            voiceConfig={voiceConfig}
            onConfigChange={onVoiceConfigChange}
            onSave={onVoiceConfigSave}
            botNo={botNo}
            agentDetail={agentDetail}
            refreshKey={voiceRefreshKey}
            content={prompt}
            stepInfos={stepInfos}
            agentVars={agentVars}
            setAgentVars={setAgentVars}
            isOnlyRead={isOnlyRead}
          />
        )}

        {/* 技能-在语音 - Agentic不显示 */}
        {type !== "voice_intelligent_mode" && (
          <div>
            <div className="text-[14px] text-[#181B25] font-[500] mb-[10px]">工作流</div>

            {/* 工具部分 */}
            <ToolsTable
              isOnlyRead={isOnlyRead}
              agentDetail={agentDetail}
              setSelectedTools={setSelectedTools}
              selectedTools={selectedTools}
              selectedSkills={selectedSkills}
              knowledgeBases={knowledgeBases}
              onSave={onSave}
              botNo={botNo}
            />

            {/* 工作流部分 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() => setIsSkillCollapsed(!isSkillCollapsed)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          isSkillCollapsed ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        工作流
                      </span>
                    </div>
                  </div>
                </div>
                {!isOnlyRead && (
                  <Popover
                    content={skillSelector("skill")}
                    title="选择工作流"
                    trigger="click"
                    open={popoverVisible.skill}
                    onOpenChange={(visible) => {
                      setPopoverVisible({ ...popoverVisible, skill: visible })
                      if (visible) {
                        setTempSelectedSkills(selectedSkills)
                        fetchSkills()
                        fetchSubSkills()
                      }
                    }}
                    placement="right"
                  >
                    <Button type="text" icon={<PlusOutlined />} />
                  </Popover>
                )}
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  isSkillCollapsed
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  {selectedSkillsList.length > 0 ? (
                    selectedSkillsList.map((skill) => (
                      <ToolItem
                        key={skill.skillNo}
                        item={{
                          ...skill,
                          name: skill.skillName,
                          description: skill.description,
                          type:
                            skill.type === "sub"
                              ? "subscribed_skill"
                              : skill.skillType || skill.type || 1
                        }}
                        idKey="skillNo"
                        avatarBgColor={skill.type === "sub" ? "#f66a3f" : "#7F56D9"}
                        onDelete={!isOnlyRead && handleSkillDelete}
                        onApproveChange={!isOnlyRead && handleSkillApproveChange}
                        isApproved={skillApproveMap[skill.skillNo]}
                      />
                    ))
                  ) : (
                    <div className="w-full">
                      <CustomEmpty description="请添加工作流" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-[#E4E7EC]"></div>

            {/* 知识库部分 */}
            <div className="mt-6">
              <div className="text-[14px] text-[#181B25] font-[500] mb-[10px]">知识库</div>

              {/* 文档知识库 */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-[4px] cursor-pointer group w-full"
                    onClick={() => setDebugState((prev) => ({ ...prev, document: !prev.document }))}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-[6px]">
                        <i
                          className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                            debugState.document ? "rotate-90" : "rotate-180"
                          }`}
                        ></i>
                        <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                          文档知识库
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isOnlyRead && (
                    <Popover
                      content={knowledgeSelector("document")}
                      title="选择文档知识库"
                      trigger="click"
                      open={popoverVisible.document}
                      onOpenChange={(visible) => {
                        setPopoverVisible({ ...popoverVisible, document: visible })
                        if (visible) {
                          setTempSelectedDocKnowledges(selectedDocKnowledges)
                        }
                      }}
                      placement="right"
                    >
                      <Button type="text" icon={<PlusOutlined />} />
                    </Popover>
                  )}
                </div>
                <div
                  className={`transition-all duration-300 origin-top ${
                    debugState.document
                      ? "transform scale-y-0 h-0 opacity-0"
                      : "transform scale-y-100 opacity-100"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedDocKnowledges.length > 0 ? (
                      selectedDocKnowledges.map((id) => (
                        <ToolItem
                          key={id}
                          item={{
                            name: getKnowledgeName(id),
                            description: "文档知识库",
                            id: id
                          }}
                          idKey="id"
                          avatarBgColor="#7F56D9"
                          onDelete={
                            !isOnlyRead ? () => handleKnowledgeDelete(id, "document") : null
                          }
                        />
                      ))
                    ) : (
                      <div className="w-full">
                        <CustomEmpty description="请添加文档知识库" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* QA知识库 */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-[4px] cursor-pointer group w-full"
                    onClick={() => setDebugState((prev) => ({ ...prev, qa: !prev.qa }))}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-[6px]">
                        <i
                          className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                            debugState.qa ? "rotate-90" : "rotate-180"
                          }`}
                        ></i>
                        <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                          问答知识库
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isOnlyRead && (
                    <Popover
                      content={knowledgeSelector("qa")}
                      title="选择问答知识库"
                      trigger="click"
                      open={popoverVisible.qa}
                      onOpenChange={(visible) => {
                        setPopoverVisible({ ...popoverVisible, qa: visible })
                        if (visible) {
                          setTempSelectedQAKnowledges(selectedQAKnowledges)
                        }
                      }}
                      placement="right"
                    >
                      <Button type="text" icon={<PlusOutlined />} />
                    </Popover>
                  )}
                </div>
                <div
                  className={`transition-all duration-300 origin-top ${
                    debugState.qa
                      ? "transform scale-y-0 h-0 opacity-0"
                      : "transform scale-y-100 opacity-100"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedQAKnowledges.length > 0 ? (
                      selectedQAKnowledges.map((id) => (
                        <ToolItem
                          key={id}
                          item={{
                            name: getKnowledgeName(id),
                            description: "问答知识库",
                            id: id
                          }}
                          idKey="id"
                          avatarBgColor="#7F56D9"
                          onDelete={!isOnlyRead ? () => handleKnowledgeDelete(id, "qa") : null}
                        />
                      ))
                    ) : (
                      <div className="w-full">
                        <CustomEmpty description="请添加问答知识库" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 结构化知识库 */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-[4px] cursor-pointer group w-full"
                    onClick={() =>
                      setDebugState((prev) => ({ ...prev, structured: !prev.structured }))
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-[6px]">
                        <i
                          className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                            debugState.structured ? "rotate-90" : "rotate-180"
                          }`}
                        ></i>
                        <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                          结构化知识库
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isOnlyRead && (
                    <Popover
                      content={knowledgeSelectorStructured()}
                      title="选择结构化知识库"
                      trigger="click"
                      open={popoverVisible.structured}
                      onOpenChange={(visible) => {
                        setPopoverVisible({ ...popoverVisible, structured: visible })
                        if (visible) {
                          setTempSelectedStructKnowledges(selectedStructKnowledges)
                        }
                      }}
                      placement="right"
                    >
                      <Button type="text" icon={<PlusOutlined />} />
                    </Popover>
                  )}
                </div>
                <div
                  className={`transition-all duration-300 origin-top ${
                    debugState.structured
                      ? "transform scale-y-0 h-0 opacity-0"
                      : "transform scale-y-100 opacity-100"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedStructKnowledges.length > 0 ? (
                      selectedStructKnowledges.map((id) => (
                        <ToolItem
                          key={id}
                          item={{
                            name: getStructureName(id),
                            description: "结构化知识库",
                            id: id
                          }}
                          idKey="id"
                          avatarBgColor="#7F56D9"
                          onDelete={
                            !isOnlyRead ? () => handleKnowledgeDelete(id, "structured") : null
                          }
                        />
                      ))
                    ) : (
                      <div className="w-full">
                        <CustomEmpty description="请添加结构化知识库" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 记忆 */}
            <div className="mt-6">
              <div className="text-[14px] text-[#181B25] font-[500] mb-[10px]">记忆</div>

              {/* 变量部分 */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-[4px] cursor-pointer group w-full"
                    onClick={() => setIsMemoryCollapsed(!isMemoryCollapsed)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-[6px]">
                        <i
                          className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                            isMemoryCollapsed ? "rotate-90" : "rotate-180"
                          }`}
                        ></i>
                        <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                          变量
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isOnlyRead && (
                    <Popover
                      content={
                        <VariableEditor
                          visible={memoryPopoverVisible}
                          onClose={() => setMemoryPopoverVisible(false)}
                          initialVars={agentVars}
                          onConfirm={handleConfirmVars}
                        />
                      }
                      title="编辑变量"
                      trigger="click"
                      open={memoryPopoverVisible}
                      onOpenChange={(visible) => {
                        setMemoryPopoverVisible(visible)
                      }}
                      placement="top"
                    >
                      <Button type="text" icon={<PlusOutlined />} />
                    </Popover>
                  )}
                </div>
                <div
                  className={`transition-all duration-300 origin-top ${
                    isMemoryCollapsed
                      ? "transform scale-y-0 h-0 opacity-0"
                      : "transform scale-y-100 opacity-100"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {agentVars.length > 0 ? (
                      agentVars.map((variable) => (
                        <ToolItem
                          key={variable.varNo}
                          item={{
                            name: variable.varName,
                            enabled: variable.enabled,
                            description: variable.description || "暂无变量",
                            id: variable.varNo
                          }}
                          idKey="id"
                          avatarBgColor="#555bfb"
                          onDelete={!isOnlyRead ? () => handleDeleteVar(variable.varNo) : null}
                          isVar={true}
                        />
                      ))
                    ) : (
                      <div className="w-full">
                        <CustomEmpty description="请添加变量，用于保存变量信息，使Agent应答更加个性化" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

SkillsAndKnowledge.displayName = "SkillsAndKnowledge"

export default SkillsAndKnowledge
