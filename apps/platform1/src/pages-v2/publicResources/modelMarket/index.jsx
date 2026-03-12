import { useMemo } from "react"
import { Button, Tag, Typography, Space, Tooltip } from "antd"
import { Play, Eye } from "lucide-react"
import dayjs from "dayjs"
import { useNavigate } from "react-router-dom"
import PageContent from "@/components-v2/PageContent"
import ListTableChange from "@/components-v2/ListTableChange"
import { getColumnSearchProps } from "@/components-v2/Table"
import { useInfiniteModelSeriesMarketListApi } from "@/api/modelSeries"
import { supplierMap } from "@/pages/modelSeries/constants"
import useCardChangeData from "@/hooks/useCardChangeData"
import styles from "./index.module.scss"

// 模型图标
import modelIcon from "@/assets/img/agentAvater-new.png?url"

const typeMap = {
  text: "文本",
  image: "图片",
  video: "视频",
  audio: "音频"
}

const ModelMarket = () => {
  const navigate = useNavigate()

  const { queryParams, setQueryParams, viewMode, setViewMode } = useCardChangeData({
    nameKey: "name"
  })

  // 使用无限滚动获取模型系列列表
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listLoading
  } = useInfiniteModelSeriesMarketListApi({
    pageSize: queryParams.pageSize,
    param: queryParams.queryParams
  })

  const onCardClick = (item) => {
    // 设置来源标记
    sessionStorage.setItem("fromModelMarket", "true")
    navigate(`/model-series/${item.id}`)
  }

  // 合并所有页面的数据
  const list = useMemo(() => {
    return (data?.pages?.flatMap((page) => page.list) || []).map((item) => {
      const inputCapabilities = item.mainModelAttribute?.capability?.input || {}
      const inputTypes = Object.entries(inputCapabilities)
        ?.filter(([_, value]) => value === true)
        ?.map(([key]) => {
          return typeMap[key] || key
        })
      return {
        ...item,
        iconUrl: modelIcon,
        inputTypes,
        supplierData: {
          color: supplierMap[item.supplier]?.color,
          text: supplierMap[item.supplier]?.label || item.supplier
        }
      }
    })
  }, [data])

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    // 更新查询参数
    const newParams = {}
    // 处理业务分类筛选参数名映射
    newParams[dataIndex] = selectedKeys[0]
    setQueryParams((preState) => ({
      ...preState,
      queryParams: { ...preState.queryParams, ...newParams },
      current: 1
    }))
  }

  const handleReset = (clearFilters, confirm, dataIndex) => {
    clearFilters()
    // 重置特定字段的查询参数
    confirm({ closeDropdown: false })
    setQueryParams((preState) => {
      const newParams = { ...preState, current: 1 }
      // 处理业务分类和标签筛选参数名映射
      delete newParams.queryParams[dataIndex]
      return newParams
    })
  }

  const columns = useMemo(() => {
    return [
      {
        title: "模型名称",
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
          placeholder: "模型名称",
          color: "blue",
          defaultFilteredValue: queryParams.queryParams.name
            ? [queryParams.queryParams.name]
            : undefined,
          handleSearch,
          handleReset
        })
      },
      {
        title: "厂牌",
        dataIndex: "supplier",
        key: "supplier",
        width: 100,
        render: (text) => (
          <Tag color={supplierMap[text]?.color} style={{ margin: 0 }} bordered={false}>
            {supplierMap[text]?.label || text}
          </Tag>
        )
      },
      {
        title: "模型描述",
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
        )
      },
      {
        title: "标签",
        dataIndex: "inputTypes",
        key: "inputTypes",
        width: 240,
        render: (text) => (
          <Space>
            {text?.slice(0, 3).map((type, index) => (
              <Tag bordered={false} key={index} color="blue" style={{ margin: 0 }}>
                {type}
              </Tag>
            ))}
            {text?.length > 3 && (
              <Tooltip
                title={
                  <div className="flex flex-wrap gap-1">
                    {text?.slice(3).map((type, index) => (
                      <Tag key={index} variant="solid" color="blue" style={{ margin: 0 }}>
                        {type}
                      </Tag>
                    ))}
                  </div>
                }
              >
                <Tag bordered={false} color="blue" style={{ margin: 0 }}>
                  +{text?.length - 3}
                </Tag>
              </Tooltip>
            )}
          </Space>
        )
      },
      {
        title: "更新时间",
        dataIndex: "gmtModified",
        key: "gmtModified",
        width: 120,
        render: (text) => (text ? dayjs(text).format("YYYY-MM-DD") : "-")
      },
      {
        title: "操作",
        dataIndex: "action",
        key: "action",
        fixed: "right",
        width: 80,
        render: (_, record) => (
          <Tooltip title={"查看"}>
            <Button
              type="link"
              className="!text-gray-400 hover:!text-indigo-600 transition-colors !p-1 !border-0"
              icon={<Eye className="mt-1" size={18} strokeWidth={2.2} />}
              onClick={() => onCardClick(record)}
            />
          </Tooltip>
        )
      }
    ]
  }, [queryParams])

  return (
    <PageContent
      title="模型广场"
      HeaderLeftComp={
        <Button
          type="link"
          className="!font-[600] !text-indigo-500 hover:!text-indigo-600 !opacity-100 !p-0 !border-0 transition-colors"
          onClick={() => {
            // 设置来源标记
            sessionStorage.setItem("fromModelMarket", "true")
            navigate("/model-series/compare")
          }}
        >
          模型对比
        </Button>
      }
      searchProps={
        viewMode === "card"
          ? {
              placeholder: "搜索模型名称...",
              defaultValue: queryParams.queryParams.name,
              onChange: (e) =>
                setQueryParams((preState) => ({
                  ...preState,
                  current: 1,
                  queryParams: { ...preState.queryParams, name: e.target.value }
                }))
            }
          : undefined
      }
      segmentedProps={{
        className: styles.segmented,
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
          resourceCardProps={{
            className: "hover:border-blue-200",
            FooterLeftText: "查看模型"
            // FooterRight: (
            //   <div className="flex items-center gap-2 cursor-pointer font-bold text-[#3b82f6]">
            //     <Play size={16} strokeWidth={3} />
            //     试用
            //   </div>
            // )
          }}
          tableProps={{ columns }}
          fetchNextPage={() => hasNextPage && fetchNextPage()}
        />
      </div>
    </PageContent>
  )
}

export default ModelMarket
