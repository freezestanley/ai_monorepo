import { useState, useEffect, useCallback, useRef } from "react"
import { Button, TreeSelect, Popover, message } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { fetchCatalogList } from "@/api/knowledge/api"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { ToolItem } from "../../../agent/components/ToolsTable"
import FaqListDrawer from "@/pages/voice/components/VoiceTemplateForm/FaqListDrawer"
import { fetchPersonalTimbreListV2 } from "@/api/timbre/api"

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

const KnowledgeBaseTab = ({
  form,
  botNo,
  voiceTaskId,
  agentDetail,
  onFormChange,
  onChangeFaqHandle,
  loading,
  disabled
}) => {
  // 知识库相关状态
  const [knowledgeBases, setKnowledgeBases] = useState([])
  const [selectedQAKnowledges, setSelectedQAKnowledges] = useState([])
  const [knowledgeTreeData, setKnowledgeTreeData] = useState([])
  const [knowledgeLoading, setKnowledgeLoading] = useState(false)
  const [knowledgeSearchKey, setKnowledgeSearchKey] = useState("")
  const [knowledgePopoverVisible, setKnowledgePopoverVisible] = useState(false)
  const [knowledgeCollapsedState, setKnowledgeCollapsedState] = useState(false)
  const [tempSelectedQAKnowledges, setTempSelectedQAKnowledges] = useState([])

  // FAQ抽屉相关状态
  const [faqDrawerVisible, setFaqDrawerVisible] = useState(false)
  const [currentViewKnowledge, setCurrentViewKnowledge] = useState(null)
  const [currentTaskId, setCurrentTaskId] = useState(null)

  // 音色选项状态
  const [timbreOptions, setTimbreOptions] = useState([])

  // 用于比较上一次faqList的值
  const prevFaqListRef = useRef([])

  // 知识库相关工具函数
  const getKnowledgeTreeData = useCallback(async () => {
    try {
      setKnowledgeLoading(true)
      const catalogsTreeList = await fetchCatalogList(botNo)

      if (catalogsTreeList && Array.isArray(catalogsTreeList)) {
        // 递归转换函数，处理任意层级的树形结构
        const convertToTreeData = (nodes) => {
          return nodes.map((node) => {
            // 对于顶层节点，使用 catalogType 作为标题
            // 对于子节点，使用 catalogName 作为标题
            const title = node.catalogName || node.catalogType || "未知知识库"

            return {
              title: title,
              value: node.catalogNo,
              key: node.catalogNo,
              type: "faq",
              knowledgeBaseNo: node.knowledgeBaseNo,
              children:
                node.children && node.children.length > 0 ? convertToTreeData(node.children) : []
            }
          })
        }

        const treeData = convertToTreeData(catalogsTreeList)
        setKnowledgeTreeData(treeData)
      }
    } catch (error) {
      console.error("获取知识库列表失败:", error)
    } finally {
      setKnowledgeLoading(false)
    }
  }, [botNo])

  const getKnowledgeName = useCallback(
    (baseNo) => {
      const findName = (data) => {
        // 确保 data 是数组且不为空
        if (!Array.isArray(data) || data.length === 0) {
          return baseNo
        }

        // 遍历所有项目
        for (const item of data) {
          // 直接匹配
          if (item.value === baseNo) {
            return item.title
          }

          // 如果 item.value 是复合字符串，检查是否包含 baseNo
          if (typeof item.value === "string" && item.value.includes(",")) {
            const itemBaseNos = item.value.split(",")
            if (itemBaseNos.includes(baseNo)) {
              return item.title
            }
          }

          // 递归检查子项
          if (item.children && item.children.length > 0) {
            const name = findName(item.children)
            if (name !== baseNo) {
              return name
            }
          }
        }
        return baseNo
      }

      return findName(knowledgeTreeData)
    },
    [knowledgeTreeData]
  )

  const getKnowledgeBaseNo = useCallback(() => {
    return selectedQAKnowledges?.length || 0
  }, [selectedQAKnowledges])

  // 初始化知识库数据
  useEffect(() => {
    if (agentDetail?.knowledgeBases) {
      const qaKnowledges = []

      agentDetail.knowledgeBases.forEach((kb) => {
        if (kb.type === "faq") {
          // 使用baseNo字段，这是接口返回的实际字段名
          qaKnowledges.push(kb.baseNo)
        }
      })

      setSelectedQAKnowledges(qaKnowledges)
      setTempSelectedQAKnowledges(qaKnowledges)
      setKnowledgeBases(agentDetail.knowledgeBases.filter((kb) => kb.type === "faq"))
    }
  }, [agentDetail?.knowledgeBases])

  // 监听知识库选中状态变化，更新折叠状态
  useEffect(() => {
    setKnowledgeCollapsedState(selectedQAKnowledges.length === 0)
  }, [selectedQAKnowledges])

  // 获取知识库树形数据
  useEffect(() => {
    getKnowledgeTreeData()
  }, [getKnowledgeTreeData])

  // 获取taskId
  useEffect(() => {
    const formValues = form.getFieldsValue()
    if (formValues.taskId) {
      setCurrentTaskId(formValues.taskId)
    }
  }, [form])

  // 获取音色列表
  useEffect(() => {
    const fetchTimbreList = async () => {
      try {
        const res = await fetchPersonalTimbreListV2({
          botNo: botNo
        })

        if (Array.isArray(res)) {
          const options = res?.map((item) => ({
            value: item.timbreCode && Number(item.timbreCode),
            label: item.timbreName + " - " + item.timbreModel
          }))
          setTimbreOptions(options)
        }
      } catch (error) {
        console.error("获取音色列表异常:", error)
      }
    }

    fetchTimbreList()
  }, [botNo])

  // 删除知识库
  const handleKnowledgeDelete = useCallback(
    (baseNo) => {
      setSelectedQAKnowledges((prev) => prev.filter((id) => id !== baseNo))

      // 重新构建knowledgeBases数组
      const newKnowledgeBases = knowledgeBases.filter((kb) => {
        if (kb.type !== "faq") return true

        // 检查 kb.baseNo 是否包含 baseNo
        if (kb.baseNo === baseNo) {
          return false
        }

        // 如果 kb.baseNo 是复合字符串，检查是否包含 baseNo
        if (typeof kb.baseNo === "string" && kb.baseNo.includes(",")) {
          const baseNos = kb.baseNo.split(",")
          return !baseNos.includes(baseNo)
        }

        return true
      })

      setKnowledgeBases(newKnowledgeBases)

      // 触发保存
      if (typeof onFormChange === "function") {
        const values = form.getFieldsValue()
        onFormChange({ ...values, knowledgeBases: newKnowledgeBases })
      }
    },
    [knowledgeBases, form, onFormChange]
  )

  // 查看知识库FAQ
  const handleKnowledgeView = useCallback(
    (item) => {
      // 根据baseNo从knowledgeTreeData中找到完整的知识库信息
      const findKnowledgeInfo = (nodes, baseNo) => {
        console.log("nodes=>>>", nodes, baseNo)
        if (nodes.length === 0) return null
        for (const node of nodes[0].children) {
          // 直接匹配
          if (node.value === baseNo) {
            return {
              baseNo: node.value,
              baseName: node.title,
              knowledgeBaseNo: node.knowledgeBaseNo
            }
          }

          // 如果 node.value 是复合字符串，检查是否包含 baseNo
          if (typeof node.value === "string" && node.value.includes(",")) {
            const nodeBaseNos = node.value.split(",")
            if (nodeBaseNos.includes(baseNo)) {
              return {
                baseNo: baseNo,
                baseName: node.title,
                knowledgeBaseNo: node.knowledgeBaseNo
              }
            }
          }

          if (node.children && node.children.length > 0) {
            const found = findKnowledgeInfo(node.children, baseNo)
            if (found) return found
          }
        }
        return null
      }

      // item.name现在是baseNo
      const knowledgeInfo = findKnowledgeInfo(knowledgeTreeData, item.name)
      if (knowledgeInfo) {
        setCurrentViewKnowledge(knowledgeInfo)
        setFaqDrawerVisible(true)
      } else {
        message.error("未找到知识库信息")
      }
    },
    [knowledgeTreeData]
  )

  // 知识库选择器组件
  const knowledgeSelector = () => {
    const filteredTreeData = knowledgeTreeData.filter((item) => item.type === "faq")

    return (
      <div className="w-80">
        <div className="mb-3 text-sm font-medium">问答知识库</div>
        <TreeSelect
          className="w-full mb-3"
          placeholder="请选择问答知识库"
          multiple
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          value={tempSelectedQAKnowledges}
          onChange={setTempSelectedQAKnowledges}
          treeData={filteredTreeData}
          maxTagCount="responsive"
          searchValue={knowledgeSearchKey}
          onSearch={setKnowledgeSearchKey}
          loading={knowledgeLoading}
          dropdownClassName="custom-tree-select-dropdown"
          treeNodeFilterProp="title"
          fieldNames={{
            label: "title",
            value: "value",
            children: "children"
          }}
          filterTreeNode={(inputValue, treeNode) => {
            const title = treeNode.title || ""
            return title.toLowerCase().includes(inputValue.toLowerCase())
          }}
        />
        <div className="flex justify-end gap-2">
          <Button
            size="small"
            onClick={() => {
              setKnowledgePopoverVisible(false)
              setTempSelectedQAKnowledges(selectedQAKnowledges)
            }}
          >
            取消
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedQAKnowledges(tempSelectedQAKnowledges)

              // 更新knowledgeBases数组
              const newKnowledgeBases = []

              // 添加新选择的知识库
              tempSelectedQAKnowledges.forEach((baseNo) => {
                // 递归查找匹配的知识库节点
                const findKnowledgeNode = (nodes, targetBaseNo) => {
                  if (nodes.length === 0) return null

                  for (const node of nodes[0].children) {
                    // 直接匹配
                    if (node.value === targetBaseNo) {
                      return {
                        baseNo: node.value,
                        baseName: node.title,
                        type: "faq",
                        knowledgeBaseNo: node.knowledgeBaseNo
                      }
                    }

                    // 如果 node.value 是复合字符串，检查是否包含 targetBaseNo
                    if (typeof node.value === "string" && node.value.includes(",")) {
                      const nodeBaseNos = node.value.split(",")
                      if (nodeBaseNos.includes(targetBaseNo)) {
                        return {
                          baseNo: targetBaseNo,
                          baseName: node.title,
                          type: "faq",
                          knowledgeBaseNo: node.knowledgeBaseNo
                        }
                      }
                    }

                    if (node.children && node.children.length > 0) {
                      const found = findKnowledgeNode(node.children, targetBaseNo)
                      if (found) return found
                    }
                  }
                  return null
                }

                const knowledge = findKnowledgeNode(knowledgeTreeData, baseNo)

                if (knowledge) {
                  newKnowledgeBases.push(knowledge)
                }
              })

              setKnowledgeBases(newKnowledgeBases)

              setKnowledgePopoverVisible(false)

              // 触发保存
              if (typeof onFormChange === "function") {
                const values = form.getFieldsValue()
                onFormChange({ ...values, knowledgeBases: newKnowledgeBases })
              }
            }}
          >
            确认
          </Button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    // 递归查找知识库信息的函数
    const findKnowledgeInfo = (nodes, catalogNo) => {
      if (nodes.length === 0) return null
      for (const node of nodes[0].children) {
        // 直接匹配
        if (node.value === catalogNo) {
          return {
            type: "faq",
            baseNo: node.value,
            baseName: node.title,
            knowledgeBaseNo: node.knowledgeBaseNo
          }
        }

        // 如果 node.value 是复合字符串，检查是否包含 catalogNo
        if (typeof node.value === "string" && node.value.includes(",")) {
          const nodeBaseNos = node.value.split(",")
          if (nodeBaseNos.includes(catalogNo)) {
            return {
              type: "faq",
              baseNo: catalogNo,
              baseName: node.title,
              knowledgeBaseNo: node.knowledgeBaseNo
            }
          }
        }

        if (node.children && node.children.length > 0) {
          const found = findKnowledgeInfo(node.children, catalogNo)
          if (found) return found
        }
      }
      return null
    }

    // 根据selectedQAKnowledges构建完整的知识库信息列表
    const faqList = selectedQAKnowledges
      .map((catalogNo) => {
        const knowledgeInfo = findKnowledgeInfo(knowledgeTreeData, catalogNo)
        return (
          knowledgeInfo || {
            type: "faq",
            baseNo: catalogNo,
            baseName: catalogNo, // 如果找不到名称，使用catalogNo作为fallback
            knowledgeBaseNo: catalogNo
          }
        )
      })
      .filter(Boolean) // 过滤掉null值

    // 只有当faqList实际发生变化时才调用onChangeFaqHandle
    if (onChangeFaqHandle) {
      const prevFaqList = prevFaqListRef.current
      const isSame =
        prevFaqList.length === faqList.length &&
        prevFaqList.every((item, index) => {
          const newItem = faqList[index]
          return (
            item.baseNo === newItem.baseNo &&
            item.baseName === newItem.baseName &&
            item.knowledgeBaseNo === newItem.knowledgeBaseNo
          )
        })

      if (!isSame) {
        prevFaqListRef.current = faqList
        onChangeFaqHandle(faqList)
      }
    }
  }, [selectedQAKnowledges, knowledgeTreeData, onChangeFaqHandle])

  return (
    <>
      {/* 注入自定义样式 */}
      <style dangerouslySetInnerHTML={{ __html: treeSelectStyles }} />
      <div className="p-0">
        <div className="my-3">
          {/* 问答知识库 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <i
                  className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 cursor-pointer hover:text-[#7f56d9] ${
                    knowledgeCollapsedState ? "rotate-90" : "rotate-180"
                  }`}
                  onClick={() => {
                    setKnowledgeCollapsedState(!knowledgeCollapsedState)
                  }}
                ></i>
                <span className="text-sm font-medium text-gray-700">问答知识库</span>
                <span className="text-xs text-gray-500">({getKnowledgeBaseNo()})</span>
              </div>
              <Popover
                content={knowledgeSelector()}
                title={null}
                trigger="click"
                open={knowledgePopoverVisible}
                onOpenChange={(visible) => {
                  setKnowledgePopoverVisible(visible)
                  if (visible) {
                    setTempSelectedQAKnowledges(selectedQAKnowledges)
                    getKnowledgeTreeData()
                  }
                }}
                placement="bottomLeft"
              >
                <Button type="text" size="small" icon={<PlusOutlined />} />
              </Popover>
            </div>
            {!knowledgeCollapsedState && (
              <div className="space-y-2">
                {selectedQAKnowledges.length === 0 ? (
                  <CustomEmpty description="暂无问答知识库" />
                ) : (
                  selectedQAKnowledges.map((baseNo) => (
                    <ToolItem
                      key={baseNo}
                      isVoice={true}
                      item={{
                        ...knowledgeBases?.find((kb) => kb.baseNo === baseNo),
                        name:
                          knowledgeBases?.find((kb) => kb.baseNo === baseNo)?.baseName ||
                          getKnowledgeName(baseNo),
                        description: "问答知识库",
                        type: "qa",
                        baseNo: baseNo
                      }}
                      idKey="baseNo"
                      onView={(item) => handleKnowledgeView({ name: item.baseNo })}
                      onDelete={disabled ? undefined : () => handleKnowledgeDelete(baseNo)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQ列表抽屉 */}
      <FaqListDrawer
        visible={faqDrawerVisible}
        onClose={() => {
          setFaqDrawerVisible(false)
          setCurrentViewKnowledge(null)
        }}
        knowledgeItem={currentViewKnowledge}
        botNo={botNo}
        taskId={voiceTaskId}
        timbreCode={form.getFieldValue("timbreCode")}
        timbreName={(() => {
          const selectedTimbreCode = form.getFieldValue("timbreCode")
          const selectedOption = timbreOptions.find((option) => option.value === selectedTimbreCode)
          return selectedOption ? selectedOption.label : null
        })()}
      />
    </>
  )
}

export default KnowledgeBaseTab
