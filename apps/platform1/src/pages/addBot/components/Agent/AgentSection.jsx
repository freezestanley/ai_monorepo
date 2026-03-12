import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Row, Empty } from "antd"
import DeleteModal from "@/components/DeleteModal/DeleteModal"
import { useDeleteAgentByNo } from "@/api/agent"
import AgentItem from "./AgentItem"
import AgentTable from "./AgentTable"
import { AGENT_FILTER_STATE_KEY } from "./index"
import { voiceModeList } from "@/components/CreateAgent/BasicSetup"

export const getVoiceMode = (agent) => {
  return agent.agentMode === 2 && agent.flowType
    ? voiceModeList
        ?.map((v) => (v.value === "3" ? { ...v, label: "Agentic" } : v))
        ?.find((v) => v.value === agent.flowType?.toString())
        ?.label?.replace("模式", "")
    : ""
}

const AgentSection = ({
  agentModeList,
  agents,
  tabValue,
  isComposing,
  filterInputValue,
  selectedAgentType,
  agentTypeOptions,
  currentBotNo,
  workbenchNo,
  iframeStyle,
  parentOrigin,
  token,
  searchExpand,
  setEditingAgent,
  setCreateAgentVisible,
  viewMode = "card"
}) => {
  const [currentItem, setCurrentItem] = useState({ agentName: "", agentNo: "" })
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [renderLimit, setRenderLimit] = useState(20)
  const loadMoreRef = useRef(null)
  const renderBatchSize = 20
  const { mutate: deleteAgent } = useDeleteAgentByNo()

  const confirmCallback = useCallback(async () => {
    deleteAgent({ botNo: currentBotNo, agentNo: currentItem.agentNo })
  }, [currentItem, currentBotNo, deleteAgent])

  // 保存筛选状态到 sessionStorage
  const saveFilterState = useCallback(() => {
    const filterState = {
      filterInputValue,
      selectedAgentType,
      searchExpand,
      tabValue,
      viewMode,
      botNo: currentBotNo,
      timestamp: Date.now()
    }
    sessionStorage.setItem(AGENT_FILTER_STATE_KEY, JSON.stringify(filterState))
  }, [filterInputValue, selectedAgentType, searchExpand, tabValue, viewMode, currentBotNo])

  // 监听筛选条件变化，自动保存状态（延迟保存，避免初始化时立即覆盖）
  useEffect(() => {
    const timer = setTimeout(() => {
      saveFilterState()
    }, 1000) // 1秒延迟，确保状态恢复完成后再开始自动保存

    return () => clearTimeout(timer)
  }, [saveFilterState])

  if (!agents?.length) return null

  let agentsList = agents.filter((agent) => {
    if (tabValue === "2") return true
    // 文本筛选
    if (
      !isComposing &&
      filterInputValue &&
      !agent.agentName?.includes(filterInputValue) &&
      !agent.description?.includes(filterInputValue) &&
      !agent.agentNo?.includes(filterInputValue)
    ) {
      return false
    }

    // 类型筛选
    if (selectedAgentType !== "all" && agent.agentMode !== selectedAgentType) {
      return false
    }

    return true
  })

  const filteredAgents = agentsList.filter(
    (agent) =>
      (agent?.isCanEditByCurrentUser && !agent?.subscribeSettings) || agent?.subscribeSettings
  )

  const shouldLimitRender = useMemo(() => {
    return viewMode === "card" && tabValue === "1" && filteredAgents.length > 50
  }, [viewMode, tabValue, filteredAgents.length])

  const renderAgents = useMemo(() => {
    if (!shouldLimitRender) return filteredAgents
    return filteredAgents.slice(0, renderLimit)
  }, [filteredAgents, renderLimit, shouldLimitRender])

  useEffect(() => {
    setRenderLimit(20)
  }, [tabValue, filterInputValue, selectedAgentType, viewMode])

  useEffect(() => {
    if (!shouldLimitRender) return
    const target = loadMoreRef.current
    if (!target) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setRenderLimit((prev) => {
          const next = Math.min(prev + renderBatchSize, filteredAgents.length)
          return next === prev ? prev : next
        })
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0
      }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [shouldLimitRender, filteredAgents.length])

  return (
    <>
      <div>
        {viewMode === "card" ? (
          <Row gutter={[20, 20]} className="items-stretch">
            {renderAgents.map((agent, index) => (
              <AgentItem
                key={`${agent.agentNo}-${index}`}
                agentModeList={agentModeList}
                agent={agent}
                currentBotNo={currentBotNo}
                workbenchNo={workbenchNo}
                iframeStyle={iframeStyle}
                parentOrigin={parentOrigin}
                token={token}
                saveFilterState={saveFilterState}
                setCurrentItem={setCurrentItem}
                setOpenDeleteModal={setOpenDeleteModal}
                setEditingAgent={setEditingAgent}
                setCreateAgentVisible={setCreateAgentVisible}
              />
            ))}
          </Row>
        ) : (
          <AgentTable
            agentModeList={agentModeList}
            agents={filteredAgents}
            tabValue={tabValue}
            currentBotNo={currentBotNo}
            workbenchNo={workbenchNo}
            iframeStyle={iframeStyle}
            parentOrigin={parentOrigin}
            token={token}
            saveFilterState={saveFilterState}
            setCurrentItem={setCurrentItem}
            setOpenDeleteModal={setOpenDeleteModal}
            setEditingAgent={setEditingAgent}
            setCreateAgentVisible={setCreateAgentVisible}
          />
        )}
        {shouldLimitRender && <div ref={loadMoreRef} className="h-[1px]" />}

        {agentsList.length === 0 && (filterInputValue || selectedAgentType !== "all") && (
          <div className="mt-[50px]">
            <Empty
              description={
                filterInputValue && selectedAgentType !== "all"
                  ? `未找到匹配关键词 "${filterInputValue}" 且类型为 "${agentTypeOptions.find((opt) => opt.value === selectedAgentType)?.label}" 的Agent`
                  : filterInputValue
                    ? `未搜索到匹配关键词 "${filterInputValue}" 的Agent`
                    : `未找到类型为 "${agentTypeOptions.find((opt) => opt.value === selectedAgentType)?.label}" 的Agent`
              }
            />
          </div>
        )}
      </div>
      <DeleteModal
        title={<span>删除</span>}
        desc={
          <div>
            <p className="text-[#475467]">删除Agent是一个重要操作,是否确定删除</p>
            <br />
            <p className="-mt-[20px] mb-[10px]">
              请输入Agent名称 <b style={{ color: "red" }}>{currentItem.agentName} </b>以确认
            </p>
          </div>
        }
        placeholder="请输入Agent名称"
        confirmText={currentItem.agentName}
        openDeleteModal={openDeleteModal}
        setOpenDeleteModal={setOpenDeleteModal}
        confirmCallback={confirmCallback}
      />
    </>
  )
}

export default AgentSection
