import React from "react"
import classNames from "classnames"
import { motion } from "framer-motion"
import { Tag, Tooltip, Typography } from "antd"

// 模拟部门数据
const DEPARTMENTS = [
  {
    id: "d1",
    name: "健康险",
    color: "border-blue-300 bg-blue-50 text-blue-700"
  },
  {
    id: "d2",
    name: "数据智能",
    color: "border-green-300 bg-green-50 text-green-700"
  },
  {
    id: "d3",
    name: "产品研发",
    color: "border-amber-300 bg-amber-50 text-amber-700"
  },
  {
    id: "d4",
    name: "基础架构",
    color: "border-purple-300 bg-purple-50 text-purple-700"
  }
]

const SpaceCardV2 = ({
  id,
  name,
  dept,
  avatarUrl,
  avatarColor,
  recentCalls,
  callsTrend,
  isPinned,
  onClick,
  onTopUpClick,
  index
}) => {
  const callCountRate =
    typeof callsTrend === "string" ? Number(callsTrend.replace("%", "")) : callsTrend
  const showTrend =
    typeof callCountRate === "number" && !Number.isNaN(callCountRate) && callCountRate !== 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
      transition={{ duration: 0.2 }}
      className="group relative flex h-[240px] cursor-pointer flex-col justify-between overflow-hidden rounded-[var(--radius-l)] border border-solid border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl"
      onClick={onClick}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          {avatarUrl ? (
            <img
              className="h-14 w-14 shrink-0 rounded-full shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
              src={avatarUrl}
              alt={name || ""}
            />
          ) : (
            <div
              className={classNames(
                "h-14 w-14 shrink-0 rounded-full shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                avatarColor
              )}
            />
          )}
          <div className="min-w-0 flex-1 pt-1">
            {!!dept?.name && (
              <Tag className={classNames("mb-2", dept?.color || "")}>{dept?.name}</Tag>
            )}
            <Typography.Paragraph
              ellipsis={{ rows: 1, tooltip: name }}
              className="!m-0 w-full text-[18px] font-[600] leading-tight text-slate-800 transition-colors group-hover:text-[var(--primary-color)]"
            >
              {name}
            </Typography.Paragraph>
          </div>
        </div>

        <div className="flex flex-col justify-center overflow-hidden rounded-[var(--radius-m)] border border-slate-100 bg-slate-50/50 p-4">
          <div className="min-w-0 space-y-1 overflow-hidden">
            <div className="truncate text-[10px] font-[500] uppercase tracking-wider text-slate-700">
              近7天调用次数
            </div>
            <div className="flex w-full items-baseline justify-between whitespace-nowrap">
              <div className="text-[24px] font-[600] tracking-tighter text-slate-800">
                {recentCalls || 0}
              </div>
              <span
                className={classNames(
                  "shrink-0 text-[12px] font-[600]",
                  showTrend ? (callCountRate > 0 ? "text-orange-500" : "text-emerald-500") : ""
                )}
              >
                {showTrend ? `${callCountRate > 0 ? "+" : ""}${callCountRate}%` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-[12px] font-[500] text-slate-600 transition-all group-hover:text-[var(--primary-color)]">
          <span>进入空间</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
        <Tooltip title={isPinned ? "取消置顶" : "置顶"} className="flex items-center">
          <div
            onClick={(e) => onTopUpClick?.(e, id, isPinned)}
            className={classNames(
              "rounded-[var(--radius-s)] p-1.5 transition-all",
              isPinned
                ? "bg-purple-50 text-[var(--primary-color)]"
                : "text-gray-300 opacity-0 hover:bg-purple-50 hover:text-[var(--primary-color)] group-hover:opacity-100"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={classNames("h-4 w-4", isPinned ? "opacity-100" : "")}
            >
              <path d="M12 2l4 4-3 3 3 8-1 1-8-3-3 3-4-4 3-3-3-8 1-1 8 3 3-3z" />
            </svg>
          </div>
        </Tooltip>
      </div>
    </motion.div>
  )
}

export default SpaceCardV2
