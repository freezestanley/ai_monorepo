import React, { useState, useCallback } from "react"
import { Button, Tooltip } from "antd"
import {
  MessageOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  OpenAIOutlined,
  UserOutlined
} from "@ant-design/icons"
import { colorMap } from "../const.js"
import ConsultRecordDrawer from "@/pages/dataStatistic/voiceRecordDetail/Drawer.jsx"
import { postMessageForLX } from "@/utils"
import { MessageType } from "@/constants/postMessageType"

interface OptimizationCardProps {
  optimizationData: {
    status: string
    statusDesc: string
    externalId: string
    sessionSummary?: string
    createTime: string
    priority: string
    processor?: string
    webcallId?: string
    reasoning?: string
    sessionId?: string
  }
  index: number
  handleClickCheck: (optimizationId: string) => void
  isTaskType9?: boolean
}

const OptimizationCard: React.FC<OptimizationCardProps> = ({
  optimizationData,
  index,
  handleClickCheck,
  isTaskType9
}) => {
  const [expanded, setExpanded] = useState(false)
  const [drawerData, setDrawerData] = useState({})

  const {
    status,
    statusDesc,
    externalId,
    sessionSummary = "",
    createTime,
    priority,
    processor,
    webcallId,
    reasoning,
    sessionId
  } = optimizationData || {}

  const isRed = status === "processing"
  const priorityColor = colorMap[priority]

  // 处理通话详情
  const handleViewCallDetail = useCallback(() => {
    if (isTaskType9) {
      // 通知灵眸打开通话详情
      postMessageForLX({
        type: MessageType.OPEN_CALL_DETAIL_ARKCES,
        payload: {
          sessionId
        }
      })
    } else {
      setDrawerData({ open: true, id: webcallId, sessionId })
    }
  }, [isTaskType9, webcallId, sessionId])

  const handleViewDetail = () => {
    handleClickCheck(externalId)
  }

  // 处理HTML内容的展开/折叠 - 基于换行符数量
  const renderExpandableHtmlContent = (content: string) => {
    // 如果没有内容，直接返回空
    if (!content) {
      return <div></div>
    }

    let fixedContent = content
    fixedContent = fixedContent.replace(/style=\{\{color:(['"])([^'"]+)\1\}\}/g, "style='color:$2'")

    // 计算换行符数量
    const lineCount = (fixedContent.match(/\n/g) || []).length
    // 超过6个换行符则需要折叠
    const shouldCollapse = lineCount >= 6

    return (
      <>
        <div
          dangerouslySetInnerHTML={{ __html: fixedContent }}
          style={{
            whiteSpace: "pre-wrap",
            maxHeight: expanded || !shouldCollapse ? "none" : "120px", // 5行 * 24px行高
            overflow: "hidden"
          }}
        />
        {/* 已折叠显示展开按钮 */}
        {!expanded && shouldCollapse && (
          <span className={`text-[#7f56d9] cursor-pointer`} onClick={() => setExpanded(true)}>
            ...展开
          </span>
        )}
        {/* 已展开显示收起按钮 */}
        {expanded && shouldCollapse && (
          <span className={`text-[#7f56d9] cursor-pointer`} onClick={() => setExpanded(false)}>
            收起
          </span>
        )}
      </>
    )
  }

  return (
    <>
      <div className="border border-gray-300 rounded-xl px-6 py-4 space-y-2 hover:shadow-xl hover:shadow-gray-200/60 hover:border-gray-400 hover:bg-gray-50/30 transition-all duration-200 cursor-pointer group">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-[16px] font-semibold">会话ID：{sessionId}</div>

          <div className="flex justify-end space-x-1">
            <Button
              onClick={handleViewCallDetail}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              type="link"
            >
              通话详情
            </Button>
            {/* <Button
              onClick={handleViewDetail}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              type="link"
            >
              优化单详情
            </Button> */}
          </div>
        </div>

        <div className="flex justify-between">
          <div className="space-y-1 text-[12px]">
            <div className="text-gray-500 flex space-x-2">
              <ClockCircleOutlined />
              <div>
                创建时间：<span>{createTime}</span>
              </div>
            </div>
            {/* <div className="text-gray-500 flex space-x-2">
              <WarningOutlined style={{ color: priorityColor }} />
              <div>
                优先级：<span style={{ color: priorityColor }}>{priority}</span>
              </div>
            </div> */}
            <div className="text-gray-500 flex space-x-2">
              <OpenAIOutlined />
              <div>
                AI分析：
                <Tooltip title={reasoning}>
                  <span>
                    {reasoning?.length > 80 ? `${reasoning.substring(0, 80)}...` : reasoning}
                  </span>
                </Tooltip>
              </div>
            </div>
            {processor && (
              <div className="text-gray-500 flex space-x-2">
                <UserOutlined />
                <div>
                  处理人：<span>{processor}</span>
                </div>
              </div>
            )}
          </div>
          <div
            className={`h-[24px] rounded-[12px] px-3 flex items-center text-[12px] font-medium ${
              isRed ? "text-white bg-red-500" : "bg-slate-100 text-slate-800 whitespace-nowrap"
            }`}
          >
            {statusDesc}
          </div>
        </div>

        <div className="space-y-3 py-4 px-4 rounded-2xl bg-slate-50">
          <div className="space-x-2">
            <MessageOutlined />
            <span>会话摘要</span>
          </div>
          <div className="w-[90%]">
            {/* 使用自定义函数处理HTML内容的展开/折叠 */}
            {renderExpandableHtmlContent(sessionSummary)}
          </div>
        </div>
      </div>
      <ConsultRecordDrawer
        rootClassName={""}
        drawerData={drawerData}
        setDrawerData={setDrawerData}
      />
    </>
  )
}

export default OptimizationCard
