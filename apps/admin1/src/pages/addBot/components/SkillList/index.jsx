import { useState, useCallback, useMemo, useRef } from "react"
import { Button, Spin, Tabs, Tag } from "antd"
import { useEffect } from "react"
import CreateSkillStep from "@/components/CreateSkillStep"

import {
  useDeleteSkill,
  useFetchSkillListByPage,
  useFetchSubscribeSkillListByPage
} from "@/api/skill"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import DeleteModal from "@/components/DeleteModal/DeleteModal"
import SkillModal from "@/components/SkillModal"
import { throttle } from "lodash"
import queryString from "query-string"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { fetchSourceTag } from "@/api/sourceTag/api"
import { useInitPublishData } from "@/hooks/useStudioPublishData"
import SkillHeader from "./SkillHeader"
import SkillSection from "./SkillSection"
import "../SkillList.scss"

export const SKILL_TYPES = [
  { key: "3", label: "API类型" },
  { key: "2", label: "表单类型" },
  { key: "1", label: "快速问答" },
  { key: "subscribed_skill", label: "订阅工作流" }
]

// 状态保持的 key
const SKILL_FILTER_STATE_KEY = "skill_filter_state"

// Mock 数据
const Skill = ({ currentBotNo, parentOrigin, workbenchNo, iframeStyle = false }) => {
  const [skillStepVisible, setSkillStepVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState({ skillName: "", skillNo: "" })
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [skillModalVisible, setSkillModalVisible] = useState(false)
  const [currentSkill, setCurrentSkill] = useState(null)
  const [filterValue, setFilterValue] = useState("全部分组")
  const [filterInputValue, setFilterInputValue] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const [isAscOrder, setIsAscOrder] = useState(false)
  const [groupList, setGroupList] = useState([])
  const [filterType, setFilterType] = useState("全部")

  // 我的工作流和我的订阅切换
  const [tabValue, setTabValue] = useState("1")

  // 展示模式状态：grid (卡片) 或 list (列表)
  const [viewMode, setViewMode] = useState("grid")
  const [renderLimit, setRenderLimit] = useState(60)
  const loadMoreRef = useRef(null)
  const renderBatchSize = 60

  // 监听滚动
  const [pageScrollTop, setPageScrollTop] = useState(0)

  // 获取版本发布配置数据
  useInitPublishData()

  // 保存筛选状态到 sessionStorage
  const saveFilterState = useCallback(() => {
    const filterState = {
      filterValue,
      filterInputValue,
      filterType,
      isAscOrder,
      tabValue,
      viewMode,
      botNo: currentBotNo,
      timestamp: Date.now()
    }
    sessionStorage.setItem(SKILL_FILTER_STATE_KEY, JSON.stringify(filterState))
  }, [filterValue, filterInputValue, filterType, isAscOrder, tabValue, viewMode, currentBotNo])

  // 从 sessionStorage 恢复筛选状态
  const restoreFilterState = useCallback(() => {
    try {
      const savedState = sessionStorage.getItem(SKILL_FILTER_STATE_KEY)
      if (savedState) {
        const filterState = JSON.parse(savedState)
        // 检查状态是否过期（30分钟）
        const isExpired = Date.now() - filterState.timestamp > 30 * 60 * 1000
        if (!isExpired && filterState.botNo === currentBotNo) {
          setFilterValue(filterState.filterValue || "全部分组")
          setFilterInputValue(filterState.filterInputValue || "")
          setFilterType(filterState.filterType || "全部")
          setIsAscOrder(filterState.isAscOrder || false)
          setTabValue(filterState.tabValue || "1")
          setViewMode(filterState.viewMode || "grid")
        } else {
          // 清除过期状态
          sessionStorage.removeItem(SKILL_FILTER_STATE_KEY)
          setFilterValue("全部分组")
          setFilterInputValue("")
          setFilterType("全部")
          setIsAscOrder(false)
          setTabValue("1")
          setViewMode("grid")
        }
      }
    } catch (error) {
      console.error("Failed to restore filter state:", error)
      sessionStorage.removeItem(SKILL_FILTER_STATE_KEY)
    }
  }, [currentBotNo])

  // 组件挂载时恢复状态
  useEffect(() => {
    restoreFilterState()
  }, [restoreFilterState])

  // 监听筛选条件变化，自动保存状态（延迟保存，避免初始化时立即覆盖）
  useEffect(() => {
    const timer = setTimeout(() => {
      saveFilterState()
    }, 1000) // 1秒延迟，确保状态恢复完成后再开始自动保存

    return () => clearTimeout(timer)
  }, [filterValue, filterInputValue, filterType, isAscOrder, tabValue, viewMode, saveFilterState])

  const { mutate: delSkill } = useDeleteSkill()

  const queryClient = useQueryClient()

  const { data: skillData = {}, isLoading } = useFetchSkillListByPage({
    botNo: currentBotNo,
    pageSize: 500,
    pageNum: 1,
    orderField: "gmt_modified",
    asc: isAscOrder
  })

  const getGroupList = useCallback(async () => {
    const res = await fetchSourceTag({ botNo: currentBotNo, tagType: "skillGroupTag" })
    setGroupList(res.data?.length ? res.data : [{}])
  }, [currentBotNo])

  useEffect(() => {
    getGroupList()
  }, [getGroupList])

  const { data: subscribedSkillData = {}, isLoading: subscribedSkillLoading } =
    useFetchSubscribeSkillListByPage({
      botNo: currentBotNo,
      bizType: "SKILL",
      pageSize: 100,
      pageNum: 1
    })

  const subscribedSkillTemp = useMemo(
    () => ({
      ...subscribedSkillData,
      list: (subscribedSkillData.list || []).map((i) => ({
        ...i,
        skillName: i.name, // 前端添加字段
        skillNo: i.bizNo, // 前端添加字段
        type: "subscribed_skill" // 前端添加字段
      }))
    }),
    [subscribedSkillData]
  )

  const skillList = useMemo(
    () => (tabValue === "1" ? skillData.skillList || [] : subscribedSkillTemp.list),
    [tabValue, skillData, subscribedSkillTemp]
  )

  // 计算过滤后的工作流列表
  const filteredSkillList = useMemo(() => {
    if (!skillList || skillList.length === 0) return []

    let filteredList = skillList

    // 分组筛选
    filteredList = filteredList.filter((skill) => {
      if (filterValue === "全部分组" || tabValue === "2") return true
      if (filterValue === "未分组") {
        return !skill.groupTagName
      }
      return skill.groupTagName?.includes(filterValue)
    })

    // 工作流类型筛选
    filteredList = filteredList.filter((skill) => {
      if (filterType !== "全部") {
        const skillTypeStr =
          skill.type === "subscribed_skill" ? skill.skillType?.toString() : skill.type?.toString()
        return skillTypeStr === filterType
      }
      return true
    })

    // 搜索关键词筛选
    filteredList = filteredList.filter((skill) => {
      if (filterInputValue && !isComposing) {
        return (
          skill.skillName?.includes(filterInputValue) ||
          skill.description?.includes(filterInputValue) ||
          skill.skillNo?.includes(filterInputValue)
        )
      }
      return true
    })

    return filteredList
  }, [skillList, filterValue, filterType, filterInputValue, isComposing, tabValue])

  const shouldLimitRender = useMemo(() => {
    return viewMode === "grid" && filteredSkillList.length > 50
  }, [viewMode, filteredSkillList.length])

  const renderSkills = useMemo(() => {
    if (!shouldLimitRender) return filteredSkillList
    return filteredSkillList.slice(0, renderLimit)
  }, [filteredSkillList, renderLimit, shouldLimitRender])

  // 判断是否有筛选条件
  const hasFilterConditions = useMemo(() => {
    return (
      filterValue !== "全部分组" ||
      filterType !== "全部" ||
      (filterInputValue && filterInputValue.trim() !== "")
    )
  }, [filterValue, filterType, filterInputValue])

  const pageLoading = useMemo(() => {
    return isLoading || subscribedSkillLoading
  }, [isLoading, subscribedSkillLoading])

  const confirmCallback = useCallback(async () => {
    try {
      await delSkill(currentItem.skillNo)
    } catch (error) {
      console.log(":===>>>  error:", error)
    }
  }, [currentItem])

  const scrollChange = () => {
    // 监听滚动条距离顶部距离
    setPageScrollTop(document.documentElement.scrollTop || 0)
  }

  const scrollHandlerRef = useRef(null)

  useEffect(() => {
    scrollHandlerRef.current = throttle(() => {
      scrollChange()
    }, 300)
    window.addEventListener("scroll", scrollHandlerRef.current, true)
    scrollChange()
    return () => {
      if (scrollHandlerRef.current?.cancel) {
        scrollHandlerRef.current.cancel()
      }
      window.removeEventListener("scroll", scrollHandlerRef.current, true)
    }
  }, [])

  useEffect(() => {
    setRenderLimit(60)
  }, [tabValue, filterValue, filterType, filterInputValue, viewMode])

  useEffect(() => {
    if (!shouldLimitRender) return
    const target = loadMoreRef.current
    if (!target) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setRenderLimit((prev) => {
          const next = Math.min(prev + renderBatchSize, filteredSkillList.length)
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
  }, [shouldLimitRender, filteredSkillList.length])

  const searchParams = queryString.parse(window.location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const { token, iframeStyle: paramsIframeStyle } = searchParams.token ? searchParams : hashParams
  const isIframe = token || paramsIframeStyle === "true"

  return (
    <div className="skill-list-wrapper-v2">
      <div className={`skill-list-wrapper ${iframeStyle && "iframeStyle"}`}>
        {/* <Row className="header" justify="space-between">
          <h1 className="font-bold text-lg">{iframeStyle && "工作流管理1"}</h1>
        </Row> */}
        <Tabs
          activeKey={tabValue}
          className={`${!isIframe ? "tab-skill-no-iframe" : "tab-skill"} ${pageScrollTop > 10 && isIframe ? "tab-skill-shadow" : ""}`}
          style={tabValue === "2" ? { paddingBottom: 0 } : {}}
          onChange={(active) => {
            setTabValue(active)
          }}
          items={[
            {
              key: "1",
              label: "我的工作流",
              // style: { position: "fixed", top: "80px", zIndex: 10 },
              children: (
                <SkillHeader
                  iframeStyle={iframeStyle}
                  currentBotNo={currentBotNo}
                  skillData={skillData}
                  groupList={groupList}
                  setFilterValue={setFilterValue}
                  setIsComposing={setIsComposing}
                  setFilterType={setFilterType}
                  isAscOrder={isAscOrder}
                  setIsAscOrder={setIsAscOrder}
                  setFilterInputValue={setFilterInputValue}
                  setSkillStepVisible={setSkillStepVisible}
                  getGroupList={getGroupList}
                  // 传递状态保存函数和当前筛选值
                  saveFilterState={saveFilterState}
                  filterValue={filterValue}
                  filterInputValue={filterInputValue}
                  filterType={filterType}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              )
            },
            {
              key: "2",
              label: "我的订阅"
            }
          ]}
        />

        {/* <Divider className={"divider"}>我的工作流</Divider> */}
        <Spin spinning={pageLoading}>
          <div
            className={`${isIframe ? (tabValue === "1" ? "mt-[106px]" : "mt-[50px]") : "mt-[20px]"}`}
          >
            {filteredSkillList?.length ? (
              <SkillSection
                tabValue={tabValue}
                groupList={groupList}
                currentBotNo={currentBotNo}
                iframeStyle={iframeStyle}
                setSkillModalVisible={setSkillModalVisible}
                setCurrentSkill={setCurrentSkill}
                setCurrentItem={setCurrentItem}
                setOpenDeleteModal={setOpenDeleteModal}
                skills={renderSkills}
                // 传递状态保存函数
                saveFilterState={saveFilterState}
                parentOrigin={parentOrigin}
                workbenchNo={workbenchNo}
                viewMode={viewMode}
              />
            ) : (
              <div className="mt-[38vh]">
                {skillList?.length === 0 ? (
                  // 没有工作流数据
                  <CustomEmpty
                    description={tabValue === "1" ? `您还未添加任何工作流` : `暂未订阅任何工作流`}
                  />
                ) : hasFilterConditions ? (
                  // 有工作流数据但被筛选条件过滤掉了
                  <CustomEmpty
                    description={
                      <div className="text-center">
                        <div className="mb-4">没有找到匹配的工作流</div>
                        <div className="text-sm text-gray-500 mb-4">
                          当前筛选条件：
                          {filterValue !== "全部分组" && <Tag>分组：{filterValue}</Tag>}
                          {filterType !== "全部" && (
                            <Tag>
                              类型：
                              {SKILL_TYPES.find((type) => type.key === filterType)?.label ||
                                filterType}
                            </Tag>
                          )}
                          {filterInputValue && (
                            <span className="mx-1 px-2 py-1 bg-orange-100 text-orange-600 rounded">
                              关键词：{filterInputValue}
                            </span>
                          )}
                        </div>
                        <Button
                          type="primary"
                          onClick={() => {
                            setFilterValue("全部分组")
                            setFilterType("全部")
                            setFilterInputValue("")
                          }}
                        >
                          清除筛选条件
                        </Button>
                      </div>
                    }
                  />
                ) : (
                  // 兜底情况
                  <CustomEmpty
                    description={tabValue === "1" ? `您还未添加任何工作流` : `暂未订阅任何工作流`}
                  />
                )}
              </div>
            )}
            {shouldLimitRender && <div ref={loadMoreRef} className="h-[1px]" />}

            {/* {SKILL_TYPES.map((type) => {
            const skillList = [
              ...(skillData.skillList || []),
              ...(subscribedSkillTemp.list || [])
            ]
            const skillsOfType =
              skillList.filter((item) => item.type === type.key) || []

            return (
              <div>
                <SkillSection
                  key={type.key}
                  title={type.label}
                  skills={skillsOfType}
                />
              </div>
            )
          })} */}
          </div>
        </Spin>
        <CreateSkillStep
          parentOrigin={parentOrigin}
          currentBotNo={currentBotNo}
          visible={skillStepVisible}
          onClose={() => setSkillStepVisible(false)}
        />
        <DeleteModal
          title={<span>删除</span>}
          desc={
            <div>
              <p className="text-[#475467]">删除工作流可能导致应用端无法使用,是否确定删除</p>
              <br />
              <p className="-mt-[20px] mb-[10px]">
                请输入工作流名称 <b style={{ color: "red" }}>{currentItem.skillName} </b>以确认
              </p>
            </div>
          }
          placeholder="请输入工作流名称"
          confirmText={currentItem.skillName}
          openDeleteModal={openDeleteModal}
          setOpenDeleteModal={setOpenDeleteModal}
          confirmCallback={confirmCallback}
        />
        <SkillModal
          onSuccess={() => {
            queryClient.invalidateQueries([
              currentSkill?.type === "subscribed_skill"
                ? QUERY_KEYS.SUBSCRIBE_SKILL_LIST_BY_PAGE
                : QUERY_KEYS.SKILL_LIST_BY_PAGE
            ])
          }}
          visible={skillModalVisible}
          botNo={currentBotNo}
          skillNo={currentSkill?.skillNo}
          key={currentSkill?.skillNo}
          initialValues={{
            ...currentSkill,
            skillName: currentSkill?.skillName,
            description: currentSkill?.description,
            type: currentSkill?.type
          }}
          onClose={() => {
            setSkillModalVisible(false)
          }}
        />
      </div>
    </div>
  )
}

export default Skill
