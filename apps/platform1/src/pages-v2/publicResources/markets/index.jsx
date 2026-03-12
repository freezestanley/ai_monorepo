import { useState, useEffect, useMemo } from "react"
import { Button, Tag, Typography, Popconfirm, Tooltip, Space, message } from "antd"
import { Star, Eye } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import queryString from "query-string"
import PageContent from "@/components-v2/PageContent"
import ListTableChange from "@/components-v2/ListTableChange"
import { getColumnSearchProps } from "@/components-v2/Table"
import {
  useCancelSubscribeApi,
  useSubscribableResourcesApi,
  useSubscribeApi,
  useSubscribableBots
} from "@/api/market"
import { cancelBubble, postMessageForLX } from "@/utils"
import useBots from "@/hooks/useBots"
import useCardChangeData from "@/hooks/useCardChangeData"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { MessageType } from "@/constants/postMessageType"
import styles from "./index.module.scss"

import type1 from "@/assets/img/type1.png"
import type2 from "@/assets/img/type2.png"
import type3 from "@/assets/img/type3.png"

const marketData = {
  agent: {
    title: "Agent市集",
    name: "Agent",
    bizType: "AGENT",
    resourceCardProps: {
      className: "hover:border-[#DF58A5]/30",
      textClassName: "hover:!text-[#DF58A5]",
      FooterLeftText: "查看Agent",
      tagColor: "magenta",
      color: "#DF58A5"
    }
  },
  workflow: {
    title: "工作流市集",
    name: "工作流",
    bizType: "SKILL",
    resourceCardProps: {
      className: "hover:border-[#8c55ec]/30",
      textClassName: "hover:!text-[#8c55ec]",
      FooterLeftText: "查看工作流",
      tagColor: "purple",
      color: "#8c55ec"
    }
  },
  tool: {
    title: "工具商店",
    name: "工具",
    bizType: "PLUG_IN",
    resourceCardProps: {
      className: "hover:border-[#1fa18f]/30",
      textClassName: "hover:!text-[#1fa18f]",
      FooterLeftText: "查看工具",
      tagColor: "cyan",
      color: "#1fa18f"
    }
  }
}

const SKILLICONTYPE = {
  1: type3, //"icon-liaotianjineng",
  2: type2, //"icon-biaodanjineng",s
  3: type1, //type3, //"icon-APIjineng",
  4: type3 //"icon-APIjineng"
}

const Markets = () => {
  const { type } = useParams()
  const navigate = useNavigate()
  const [currentBizNo, setCurrentBizNo] = useState(null)
  const [isChooseBotVisible, setIsChooseBotVisible] = useState(false)

  const { queryParams, setQueryParams, viewMode, setViewMode } = useCardChangeData()

  const location = useLocation()
  const { search } = location
  const { parentOrigin, isIframe } = queryString.parse(search) ?? {}

  const { botsListInfo } = useBots()

  const queryClient = useQueryClient()
  const updateHome = () => {
    queryClient.invalidateQueries([QUERY_KEYS.MARKET_HOME])
  }

  const { mutate: mutateSubscribe } = useSubscribeApi(updateHome)
  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(updateHome)

  const curMarkData = useMemo(() => marketData[type], [type])

  const { data: subscribableBotsData } = useSubscribableBots({ bizType: curMarkData?.bizType })

  // 使用无限滚动获取模型系列列表
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listLoading
  } = useSubscribableResourcesApi({
    pageSize: queryParams.pageSize,
    bizType: curMarkData?.bizType,
    ...queryParams.queryParams
  })

  useEffect(() => {
    setQueryParams((preState) => ({ ...preState, queryParams: {}, current: 1 }))
  }, [type])

  const onCardClick = (item) => {
    // 区分插件和工作流，跳转到不同的详情页
    const { bizNo, belongToBotNo, canRead = true, hasSubscribed, resourceCode, agentMode } = item
    if (type === "workflow") {
      // 跳转到工作流详情页
      navigate(
        `/editSkill?skillNo=${bizNo}&isIframe=${isIframe}&botNo=${belongToBotNo}&mode=showDetail&skillCanRead=${canRead}&hasSubscribed=${hasSubscribed}&marketSub=${true}&workbenchNo=${resourceCode}&parentOrigin=${parentOrigin}`
      )
    } else if (type === "tool") {
      // 跳转到插件详情页
      navigate(`/plugins-detail?botNo=${belongToBotNo}&pluginNo=${bizNo}&marketSub=${true}`)
    } else if (type === "agent") {
      navigate(
        `/agent/${agentMode === 7 ? "detailv2" : "detail"}?agentNo=${bizNo}&mode=showDetail&agentCanRead=${canRead}&isIframe=${isIframe}&botNo=${belongToBotNo}&agentMode=${agentMode || 1}`
      )
    }
  }

  const handleCancelSubscribe = (e, bizNo) => {
    cancelBubble(e)
    mutateCancelSubscribe({ bizType: type, bizNo })
  }

  const showRobotSelectionModal = (e, bizNo) => {
    cancelBubble(e)
    setCurrentBizNo(bizNo)
    setIsChooseBotVisible(true)
  }

  const onChooseBotSumbmit = async (currentBot) => {
    // 订阅逻辑
    mutateSubscribe({
      bizType: curMarkData?.bizType,
      bizNo: currentBizNo,
      botNo: currentBot.botNo
    })
    // 发送消息给 iframe
    postMessageForLX({
      type: MessageType.SUBSCRIBE_SUCCESS,
      botNo: currentBot.botNo,
      tab: curMarkData?.bizType
    })
    message.success("订阅成功，正在为您跳转工作台～")
    setIsChooseBotVisible(false)
    setCurrentBizNo(null)
  }

  // 合并所有页面的数据
  const list = useMemo(() => {
    return data?.pages
      ?.flatMap((page) => page?.list)
      ?.filter((item) => !!item)
      ?.map((item) => {
        const { deptColor } =
          botsListInfo?.botList?.find((bot) => bot.deptName === item.deptName) || {}
        return {
          ...item,
          id: item.bizNo,
          iconUrl: SKILLICONTYPE[!item.skillType ? 1 : item.skillType],
          inputTypes: [`来源：${item.belongToBotName || "-"}`],
          supplierData: {
            color: deptColor,
            text: item.deptName
          }
        }
      })
  }, [data, botsListInfo])

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    // 更新查询参数
    const newParams = {}
    // 处理业务分类筛选参数名映射
    if (dataIndex === "name") {
      newParams.query = selectedKeys[0]
    } else if (dataIndex === "description") {
      newParams.descriptionLike = selectedKeys[0]
    }
    setQueryParams((preState) => ({
      ...preState,
      queryParams: { ...preState.queryParams, ...newParams },
      current: 1
    }))
  }

  const handleReset = (clearFilters, confirm, dataIndex) => {
    clearFilters()
    // 重置特定字段的查询参数
    setQueryParams((preState) => {
      const newParams = { ...(preState.queryParams || {}) }
      // 处理业务分类和标签筛选参数名映射
      if (dataIndex === "name") {
        delete newParams.queryParams.query // 删除后端对应的参数名
      } else if (dataIndex === "description") {
        delete newParams.descriptionLike
      } else {
        delete newParams.queryParams[dataIndex]
      }
      return { ...preState, current: 1, queryParams: newParams }
    })
    confirm({ closeDropdown: false })
  }

  // 表格分页变化处理
  const handleTableChange = (pagination, filters, sorter) => {
    setQueryParams((preState) => {
      const newParams = { ...preState.queryParams, sortOrder: null }
      // 处理排序
      if (sorter.field && sorter.order) {
        newParams.sortOrder = {}
        // 根据排序字段设置对应的接口参数
        if (sorter.field === "gmtModified") {
          newParams.sortOrder.field = "gmt_modified" // 修改时间
        }
        // 设置排序方向
        newParams.sortOrder.asc = sorter.order === "ascend"
      }
      // 处理筛选
      if (filters.belongToBotName?.length > 0) {
        newParams.belongToBotNo = filters.belongToBotName[0]
      } else {
        delete newParams.belongToBotNo
      }
      return {
        ...preState,
        ...pagination,
        queryParams: newParams,
        current: 1
      }
    })
  }

  const columns = useMemo(() => {
    return [
      {
        title: `${curMarkData?.name}名称`,
        dataIndex: "name",
        key: "name",
        width: 200,
        render: (text, record) => (
          <div className="flex items-center gap-2">
            <img src={record.iconUrl} className="w-[32px] h-[32px] rounded-full" />
            <Typography.Paragraph
              ellipsis={{ rows: 1, tooltip: text }}
              className="!m-0 text-[14px] font-bold text-gray-900 leading-snug line-clamp-2 break-all"
            >
              {text}
            </Typography.Paragraph>
          </div>
        ),
        ...getColumnSearchProps({
          dataIndex: "name",
          placeholder: `${curMarkData?.name}名称`,
          color: curMarkData?.resourceCardProps?.color,
          defaultFilteredValue: queryParams.queryParams.query
            ? [queryParams.queryParams.query]
            : undefined,
          handleSearch,
          handleReset
        })
      },
      {
        title: `${curMarkData?.name}描述`,
        dataIndex: "description",
        key: "description",
        width: 400,
        render: (text) => (
          <Typography.Paragraph
            ellipsis={{ rows: 2, tooltip: text }}
            className="text-gray-600 !mb-3 font-medium"
          >
            {text || "-"}
          </Typography.Paragraph>
        ),
        ...getColumnSearchProps({
          dataIndex: "description",
          placeholder: `${curMarkData?.name}描述`,
          color: curMarkData?.resourceCardProps?.color,
          defaultFilteredValue: queryParams.queryParams.descriptionLike
            ? [queryParams.queryParams.descriptionLike]
            : undefined,
          handleSearch,
          handleReset
        })
      },
      {
        title: "来源空间",
        dataIndex: "belongToBotName",
        key: "belongToBotName",
        width: 120,
        render: (text) => (
          <Tag
            bordered={false}
            color={curMarkData?.resourceCardProps?.tagColor}
            style={{ margin: 0 }}
          >
            {text}
          </Tag>
        ),
        filters: subscribableBotsData?.map((item) => ({ text: item.botName, value: item.botNo })),
        // onFilter: (value, record) => record.belongToBotNo === value,
        filterDropdownProps: { placement: "bottomLeft" },
        filterMultiple: false
      },
      {
        title: "更新时间",
        dataIndex: "gmtModified",
        key: "gmtModified",
        width: 120,
        sorter: true, // 添加排序功能
        render: (text) => (text ? dayjs(text).format("YYYY-MM-DD") : "-")
      },
      {
        title: "操作",
        dataIndex: "action",
        key: "action",
        fixed: "right",
        width: 80,
        render: (_, record) => (
          <Space size={2}>
            <Tooltip title={"查看"}>
              <Button
                type="link"
                className={`!text-gray-400 ${curMarkData?.resourceCardProps?.textClassName} transition-colors !p-1 !border-0`}
                icon={<Eye className="mt-1" size={18} strokeWidth={2.2} />}
                onClick={() => onCardClick(record)}
              />
            </Tooltip>
            <Tooltip title={record.isPinned ? "取消订阅" : "订阅"}>
              <Button
                type="link"
                className={`!text-gray-400 ${curMarkData?.resourceCardProps?.textClassName} transition-colors !p-0 !border-0`}
                icon={<Star className="mt-1" size={16} strokeWidth={2.2} />}
                onClick={(e) => showRobotSelectionModal(e, record.bizNo)}
              />
            </Tooltip>
          </Space>
        )
      }
    ]
  }, [curMarkData, queryParams, subscribableBotsData])

  return (
    <PageContent
      title={curMarkData?.title}
      searchProps={
        viewMode === "card"
          ? {
              placeholder: `搜索${curMarkData?.name}名称...`,
              defaultValue: queryParams.queryParams.query,
              onChange: (e) =>
                setQueryParams((preState) => ({
                  ...preState,
                  current: 1,
                  queryParams: { ...preState.queryParams, query: e.target.value }
                }))
            }
          : undefined
      }
      segmentedProps={{
        className: styles[`segmented-${type}`],
        value: viewMode,
        onChange: (v) => setViewMode(v)
      }}
    >
      <div className="pt-5">
        <ListTableChange
          viewMode={viewMode}
          list={list}
          loading={listLoading}
          onClick={onCardClick}
          isFetchingNextPage={isFetchingNextPage}
          isChooseBotVisible={isChooseBotVisible}
          setIsChooseBotVisible={setIsChooseBotVisible}
          onChooseBotSumbmit={onChooseBotSumbmit}
          resourceCardProps={{
            ...(curMarkData?.resourceCardProps || {}),
            FooterRight: (resource) => (
              <Tooltip title={resource.isPinned ? "取消订阅" : "订阅"}>
                {resource.isPinned ? (
                  <Popconfirm
                    title=""
                    description={`【取消订阅】将无法调用对应声音。`}
                    okText="确认"
                    onConfirm={(e) => handleCancelSubscribe(e, resource.bizNo)}
                    cancelText="取消"
                    onPopupClick={(e) => cancelBubble(e)}
                  >
                    <div
                      className={`w-8 h-8 rounded-[var(--radius-s)] flex items-center justify-center transition-all ${resource.isPinned ? "bg-[#fff7e6] text-yellow-400 shadow-inner" : "bg-gray-50 text-gray-200 hover:text-gray-400"}`}
                    >
                      <Star
                        size={16}
                        strokeWidth={2.2}
                        fill={resource.isPinned ? "currentColor" : "none"}
                      />
                    </div>
                  </Popconfirm>
                ) : (
                  <div
                    className={`w-8 h-8 rounded-[var(--radius-s)] flex items-center justify-center transition-all ${resource.isPinned ? "bg-[#fff7e6] text-yellow-400 shadow-inner" : "bg-gray-50 text-gray-200 hover:text-gray-400"}`}
                    onClick={(e) => showRobotSelectionModal(e, resource.bizNo)}
                  >
                    <Star
                      size={16}
                      strokeWidth={2.2}
                      fill={resource.isPinned ? "currentColor" : "none"}
                    />
                  </div>
                )}
              </Tooltip>
            )
          }}
          tableProps={{ columns, onChange: handleTableChange }}
          fetchNextPage={() => hasNextPage && fetchNextPage()}
        />
      </div>
    </PageContent>
  )
}

export default Markets
