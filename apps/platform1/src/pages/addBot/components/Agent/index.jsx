import React, { useState, useCallback, useMemo, useEffect } from "react"
import { Tabs, Button, Spin, Input, Select, message } from "antd"
import { PlusOutlined, SearchOutlined, AppstoreOutlined, BarsOutlined } from "@ant-design/icons"
import { useFetchAgentList } from "@/api/agent"
import { useFetchSubscribeSkillListByPage } from "@/api/skill"
import { useQueryClient } from "@tanstack/react-query"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { QUERY_KEYS } from "@/constants/queryKeys"
import CreateAgent from "@/components/CreateAgent"
import { useFetchAgentMode } from "@/api/common"
import { useInitPublishData, useStudioPublishData } from "@/hooks/useStudioPublishData"
import AgentSection from "./AgentSection"
import SubscribeAgentModal from "./SubscribeAgentModal"
import ScenarioTestModal from "./ScenarioTestModal"
import "../SkillList.scss"

// 状态保持的 key
export const AGENT_FILTER_STATE_KEY = "agent_filter_state"

const Agent = ({ currentBotNo, workbenchNo, parentOrigin, iframeStyle = false, token }) => {
  const [filterInputValue, setFilterInputValue] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const [createAgentVisible, setCreateAgentVisible] = useState(false)
  const [editingAgent, setEditingAgent] = useState(null)
  const [searchExpand, setSearchExpand] = useState(true)
  const [selectedAgentType, setSelectedAgentType] = useState("all") // 类型筛选状态
  // 我的工作流和我的订阅切换
  const [tabValue, setTabValue] = useState("1")
  const [modalVisible, setModalVisible] = useState(false)
  // 视图模式：card 卡片视图，table 列表视图
  const [viewMode, setViewMode] = useState("card")

  const { data: agentMode } = useFetchAgentMode()

  // 获取版本发布配置数据
  useInitPublishData()
  const { isPublishDisabled } = useStudioPublishData()

  const agentModeList = useMemo(() => {
    return (
      agentMode?.map((item) => ({
        label: item.name,
        value: Number(item.code)
      })) || []
    )
  }, [agentMode])

  // 从 sessionStorage 恢复筛选状态
  const restoreFilterState = useCallback(() => {
    try {
      const savedState = sessionStorage.getItem(AGENT_FILTER_STATE_KEY)
      if (savedState) {
        const filterState = JSON.parse(savedState)
        // 检查状态是否过期（30分钟）
        const isExpired = Date.now() - filterState.timestamp > 30 * 60 * 1000
        if (!isExpired && filterState.botNo === currentBotNo) {
          setFilterInputValue(filterState.filterInputValue || "")
          setSelectedAgentType(filterState.selectedAgentType || "all")
          setSearchExpand(filterState.searchExpand || false)
          setTabValue(filterState.tabValue || "1")
          setViewMode(filterState.viewMode || "card")
        } else {
          // 清除过期状态
          sessionStorage.removeItem(AGENT_FILTER_STATE_KEY)
          setFilterInputValue("")
          setSelectedAgentType("all")
          setTabValue("1")
          setViewMode("card")
        }
      }
    } catch (error) {
      console.error("Failed to restore filter state:", error)
      sessionStorage.removeItem(AGENT_FILTER_STATE_KEY)
    }
  }, [currentBotNo])

  // 组件挂载时恢复状态
  useEffect(() => {
    restoreFilterState()
  }, [restoreFilterState])

  const onCompositionStart = useCallback(() => setIsComposing(true), [])
  const onCompositionEnd = useCallback(() => {
    setIsComposing(false)
  }, [])

  const queryClient = useQueryClient()

  const { data: agentList = [], isLoading } = useFetchAgentList({
    botNo: currentBotNo,
    agentName: filterInputValue || undefined
  })

  const { data: subscribedAgentData = {}, isLoading: subscribedAgentLoading } =
    useFetchSubscribeSkillListByPage({
      botNo: currentBotNo,
      bizType: "AGENT",
      pageSize: 100,
      pageNum: 1
    })

  const subscribedAgentTemp = useMemo(
    () => ({
      ...subscribedAgentData,
      list: (subscribedAgentData.list || []).map((i) => ({
        ...i,
        agentName: i.name, // 前端添加字段
        agentNo: i.bizNo, // 前端添加字段
        type: "subscribed_agent" // 前端添加字段
      }))
    }),
    [subscribedAgentData]
  )

  const agentData = useMemo(
    () => (tabValue === "1" ? agentList || [] : subscribedAgentTemp.list),
    [tabValue, agentList, subscribedAgentTemp]
  )

  const allAgentList = useMemo(() => {
    return [...(agentList || []), ...(subscribedAgentTemp.list || [])]
  }, [agentList, subscribedAgentTemp.list])

  // 根据agentData动态生成类型选项
  const agentTypeOptions = useMemo(() => {
    const typeMap = new Map()

    // 遍历agentData，收集所有存在的类型
    agentData.forEach((agent) => {
      if (agent.agentMode) {
        const typeKey = agent.agentMode
        const typeName =
          agentModeList.find((v) => v.value === agent.agentMode)?.label?.replace("Agent", "") ||
          "其他"

        if (!typeMap.has(typeKey)) {
          typeMap.set(typeKey, typeName)
        }
      }
    })

    // 转换为选项数组，添加"全部"选项
    const options = [{ label: "全部类型", value: "all" }]

    // 按照固定顺序添加类型选项
    agentModeList.forEach((option) => {
      if (typeMap.has(option.value)) {
        options.push({ label: option.label?.replace("Agent", ""), value: option.value })
      }
    })

    // 添加其他未知类型
    typeMap.forEach((typeName, typeKey) => {
      if (!agentModeList.map((v) => v.value).includes(typeKey)) {
        options.push({ label: typeName, value: typeKey })
      }
    })

    return options
  }, [agentData, agentModeList])

  const handleCreateAgentClose = () => {
    setCreateAgentVisible(false)
    setEditingAgent(null)
  }

  // const onSearchInputChange = useCallback(
  //   debounce((e) => {
  //     const value = e.target.value
  //     console.log("value", value)
  //     if (!isComposing) {
  //       setFilterInputValue(e.target.value)
  //     }
  //   }, 500),
  //   [isComposing]
  // )

  // 处理输入框值变化
  const handleInputChange = (e) => {
    const value = e.target.value
    // 实时更新输入框显示值
    setFilterInputValue(value)
    // 延迟更新筛选条件（如果需要的话，这里可以用于API调用等）
    // debouncedSetFilter(value)
  }

  // 组件卸载时的清理（可选，如果希望在特定情况下清除状态）
  useEffect(() => {
    return () => {
      // 如果需要在组件卸载时清除状态，可以取消注释下面的代码
      // clearFilterState()
    }
  }, [])

  return (
    <div className="skill-list-wrapper-v2">
      <div className={`skill-list-wrapper ${iframeStyle && "iframeStyle"}`}>
        <div className="mx-auto w-full max-w-[1400px] px-2 md:px-4">
          <div className="rounded-[16px] bg-white py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Tabs
                activeKey={tabValue}
                tabBarStyle={{ margin: 0 }}
                className="agent-page-tabs min-w-[220px] flex-1"
                onChange={(active) => {
                  setTabValue(active)
                }}
                items={[
                  {
                    key: "1",
                    label: "我的Agent"
                  },
                  {
                    key: "2",
                    label: "我的订阅"
                  }
                ]}
              />

              {tabValue === "1" && (
                <div className="flex items-center gap-2">
                  <Button
                    type="primary"
                    className="h-[36px]"
                    icon={<PlusOutlined />}
                    disabled={isPublishDisabled}
                    onClick={() => {
                      setCreateAgentVisible(true)
                    }}
                  >
                    创建 Agent
                  </Button>
                  <Button
                    className="h-[36px]"
                    onClick={() => {
                      setModalVisible(true)
                    }}
                  >
                    场景测试
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button.Group>
                <Button
                  type={viewMode === "card" ? "primary" : "default"}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode("card")}
                  size="middle"
                />
                <Button
                  type={viewMode === "table" ? "primary" : "default"}
                  icon={<BarsOutlined />}
                  onClick={() => setViewMode("table")}
                  size="middle"
                />
              </Button.Group>

              <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                <Select
                  value={selectedAgentType}
                  onChange={setSelectedAgentType}
                  options={agentTypeOptions}
                  style={{ width: 200 }}
                  size="middle"
                  placeholder="选择类型"
                />
                <Input
                  className="w-[320px] max-w-full"
                  placeholder="搜索Agent名称，按 Enter 确认"
                  value={filterInputValue}
                  onChange={handleInputChange}
                  onCompositionStart={onCompositionStart}
                  onCompositionEnd={onCompositionEnd}
                  onPressEnter={handleInputChange}
                  suffix={
                    <SearchOutlined
                      style={{ color: "#bfbfbf", cursor: "pointer" }}
                      onClick={handleInputChange}
                    />
                  }
                />
              </div>
            </div>
          </div>

          <Spin spinning={isLoading || subscribedAgentLoading}>
            <div className="mt-5">
              {agentData?.length ? (
                <AgentSection
                  agentModeList={agentModeList}
                  agents={agentData}
                  tabValue={tabValue}
                  isComposing={isComposing}
                  filterInputValue={filterInputValue}
                  selectedAgentType={selectedAgentType}
                  agentTypeOptions={agentTypeOptions}
                  currentBotNo={currentBotNo}
                  workbenchNo={workbenchNo}
                  iframeStyle={iframeStyle}
                  parentOrigin={parentOrigin}
                  token={token}
                  searchExpand={searchExpand}
                  setEditingAgent={setEditingAgent}
                  setCreateAgentVisible={setCreateAgentVisible}
                  viewMode={viewMode}
                />
              ) : (
                <div className="mt-[38vh]">
                  <CustomEmpty
                    description={tabValue === "1" ? `您还未添加任何Agent` : `暂未订阅任何Agent`}
                  />
                </div>
              )}
            </div>
          </Spin>

          <CreateAgent
            visible={createAgentVisible && tabValue === "1"}
            agentModeList={agentModeList}
            currentBotNo={currentBotNo}
            initialValues={editingAgent}
            onClose={handleCreateAgentClose}
          />
          <SubscribeAgentModal
            visible={createAgentVisible && tabValue !== "1"}
            botNo={currentBotNo}
            initialValues={editingAgent}
            onClose={handleCreateAgentClose}
            onSuccess={() => {
              queryClient.invalidateQueries([
                editingAgent?.type === "subscribed_agent"
                  ? QUERY_KEYS.SUBSCRIBE_SKILL_LIST_BY_PAGE
                  : QUERY_KEYS.AGENT_LIST
              ])
            }}
          />
          <ScenarioTestModal
            botNo={currentBotNo}
            agentList={allAgentList}
            visible={modalVisible}
            onCancel={() => setModalVisible(false)}
          />
        </div>
      </div>
    </div>
  )
}

export default Agent
