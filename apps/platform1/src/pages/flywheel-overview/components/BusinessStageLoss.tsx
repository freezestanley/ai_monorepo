import React from "react"
import { Search, TrendingDown } from "lucide-react"

interface BusinessStageLossProps {
  selectedCardId: string
  setSelectedCardId: React.Dispatch<React.SetStateAction<string>>
  chartViewMode: string
  setChartViewMode: React.Dispatch<React.SetStateAction<string>>
  Stageanalysis: any[]
  lossEnabled: boolean
  generalEnabled: boolean
  isTaskType9: boolean
}

const BusinessStageLoss: React.FC<BusinessStageLossProps> = ({
  selectedCardId,
  setSelectedCardId,
  chartViewMode,
  setChartViewMode,
  Stageanalysis,
  lossEnabled,
  generalEnabled,
  isTaskType9
}) => {
  // Height Logic: Percentage of the FIRST stage (Total Addressable Volume)
  const maxCount = Stageanalysis.length > 0 ? Stageanalysis[0].entryCount : 100

  // Helper to get 3D Bar Colors based on state
  const getBarColors = (isSelected: boolean, mode: string) => {
    if (isSelected && mode === "churn") {
      // Active Churn Mode: Soft Rose (Warm, professional, not aggressive)
      return {
        front: "bg-[#fb7185]", // rose-400 (Soft Rose front)
        frontLight: "bg-[#fda4af]", // rose-200 (Soft Rose front)
        side: "bg-[#f43f5e]", // rose-500 (Depth shadow)
        sideLight: "bg-[#fb7185]" // rose-200 (Depth shadow)
      }
    }

    if (isSelected && mode === "problem") {
      // Active Problem Mode: Subtle Violet (Background role)
      return {
        front: "bg-[rgba(125,82,244,1)]", // violet
        frontLight: "bg-[rgba(167,139,250,1)]", // violet-400 (更淡的 violet)
        side: "bg-[rgba(91,44,201,1)]", // violet
        sideLight: "bg-[rgba(125,82,244,1)]" // violet (更淡的侧面)
      }
    }

    // Inactive: Neutral Cool Gray/Indigo
    return {
      front: "bg-[rgba(196,181,253,1)]", // violet-300 更深的紫色
      frontLight: "bg-[rgba(237,233,254,1)]", // 更淡的紫色
      side: "bg-[rgba(167,139,250,1)]", // violet-400 更深的侧面
      sideLight: "bg-[rgba(220,213,255,1)]" // 更淡的侧面
    }
  }

  return (
    <div className="w-full h-full">
      <div className="bg-gray-50/80 rounded-t-xl border-x border-t border-gray-100 p-2 pb-0 h-full">
        <div className="flex flex-col md:flex-row w-full h-full items-end justify-between relative">
          {Stageanalysis.map((stage, index) => {
            const rawPercent = (stage.entryCount / maxCount) * 100

            // 处理 entryCount 为 0 的情况，避免 NaN
            const remainingPercent =
              stage.entryCount === 0
                ? 100 // 默认显示 100% 未流失
                : ((stage.entryCount - stage.loseCount) / stage.entryCount) * 100
            const lossPercent =
              stage.entryCount === 0
                ? 0 // 默认显示 0% 流失
                : (stage.loseCount / stage.entryCount) * 100

            const heightPercent = Math.max(rawPercent, 0.5) // 最小0.5%，确保可见

            const isSelected = stage.stageId === selectedCardId
            const barColors = getBarColors(isSelected, chartViewMode)

            // Divider Logic - 显示除了最后一个之外的所有竖线
            const showDivider = index < Stageanalysis.length - 1

            // Card Container Style (The "Chrome Tab")
            const containerClasses = isSelected
              ? `rounded-t-lg 
                  shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.4)]
                  relative 
                  -mb-[1px] pb-[1px] 
                  bg-white
                  before:content-['']
                  before:absolute
                  before:top-0
                  before:left-0
                  before:right-0
                  before:h-1.5
                  before:rounded-t-lg
                `
              : `
                  rounded-t-lg 
                  mb-0 pb-0
                  hover:bg-gray-100/50 /* Subtle hover for inactive tabs */
                  transition-colors duration-200
                `

            // Top Border Color
            const topBorderColor = isSelected
              ? chartViewMode === "problem"
                ? "before:bg-violet-600"
                : "before:bg-rose-400"
              : "before:bg-transparent"

            return (
              <div
                key={stage.stageId}
                className={`
                  flex-1 flex flex-col h-full min-w-[140px] group
                  ${containerClasses}
                  ${topBorderColor}
                `}
              >
                {/* Inner Layout with Gap to separate zones */}
                <div className="flex flex-col h-full w-full gap-4">
                  {/* --- TOP ZONE: Text Info (Problem Analysis) --- */}
                  <div
                    className={`
                      relative px-4 pt-5 pb-2 flex-none 
                      transition-all duration-300 group/top rounded-t-md 
                      ${generalEnabled ? "hover:bg-blue-50 cursor-pointer" : ""}
                    `}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!generalEnabled) return
                      setSelectedCardId(stage.stageId)
                      setChartViewMode(`problem`)
                    }}
                  >
                    {/* Hover Hint: Bottom Right of Top Zone (Middle area) */}
                    <div
                      className={`absolute bottom-0 right-2 opacity-0 transition-all duration-300 z-50 pointer-events-none translate-y-1 group-hover/top:translate-y-0 ${generalEnabled ? "group-hover/top:opacity-100" : ""} `}
                    >
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-violet-700 select-none">
                        <Search size={11} strokeWidth={3} /> 分析阶段问题
                      </span>
                    </div>

                    {/* Content with Lift Effect */}
                    <div className="transition-transform duration-300 ease-out group-hover/top:-translate-y-1 ">
                      <div
                        className={`
                        text-sm font-medium truncate mb-1 transition-colors duration-300
                        ${
                          isSelected && chartViewMode === "problem"
                            ? "text-violet-700 font-bold"
                            : "text-gray-500"
                        }
                        ${!isSelected && "group-hover/top:text-violet-700"}
                      `}
                      >
                        {stage.stageName}
                      </div>

                      <div
                        className={`
                        text-3xl font-bold transition-all duration-300
                        ${
                          isSelected && chartViewMode === "problem"
                            ? "text-violet-600 scale-105 origin-left"
                            : "text-gray-400"
                        }
                        ${!isSelected && "group-hover/top:text-violet-600"}
                      `}
                      >
                        {stage.entryCount}
                      </div>
                    </div>
                  </div>

                  {/* --- BOTTOM ZONE: 3D Bar (Churn Analysis) --- */}
                  {!isTaskType9 && (
                    <div
                      className={`
                      relative flex-1 w-full pl-6 pr-10 pb-0 flex items-end justify-center group/bottom
                      transition-colors duration-300  overflow-hidden pt-6 ${lossEnabled ? "hover:bg-red-100 cursor-pointer" : ""}
                    `}
                      onClick={() => {
                        if (!lossEnabled) return
                        setSelectedCardId(stage.stageId)
                        setChartViewMode(`churn`)
                      }}
                    >
                      <div
                        className={`absolute top-[6px] right-4 opacity-0  transition-all duration-300  pointer-events-none -translate-y-1 group-hover/bottom:translate-y-0 ${lossEnabled ? "group-hover/bottom:opacity-100 cursor-not-allowed" : "cursor-pointer"} `}
                      >
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 select-none">
                          <TrendingDown size={11} strokeWidth={3} /> 分析流失原因
                        </span>
                      </div>
                      {/* 3D Bar Container */}
                      <div
                        className={`
                        relative w-full transition-transform duration-300 ease-out origin-bottom 
                      `}
                        style={{ height: `${heightPercent}%` }}
                      >
                        {/* Side Face */}

                        <div className="absolute left-full w-[12px] h-full flex flex-col transition-colors duration-300 z-0">
                          {/* 上段 - 流失部分侧面 */}
                          <div
                            className={`w-full ${barColors.sideLight} origin-bottom-left transform skew-y-[45deg] z-0 transition-colors duration-300`}
                            style={{ height: `${lossPercent}%` }}
                          ></div>
                          {/* 下段 - 未流失部分侧面 */}
                          <div
                            className={`w-full ${barColors.side} transition-colors duration-300 origin-bottom-left transform skew-y-[45deg] z-0 `}
                            style={{ height: `${remainingPercent}%` }}
                          ></div>
                        </div>

                        {/* Front Face */}
                        <div
                          className={`relative w-full h-full flex flex-col transition-colors duration-300`}
                        >
                          <div
                            className={`w-full ${barColors.frontLight} flex flex-col justify-end transition-colors duration-300`}
                            style={{ height: `${lossPercent}%` }}
                          ></div>

                          <div
                            className={`w-full ${barColors.front}  transition-colors duration-300 flex items-end justify-center`}
                            style={{ height: `${remainingPercent}%` }}
                          >
                            <div
                              className={`p-2 pb-4 overflow-hidden text-[12px] font-bold uppercase tracking-wider mb-0.5  space-x-1 ${heightPercent > 14 ? "text-white" : "text-gray-400"}`}
                            >
                              <span>流失率</span>
                              <span>{stage.lossRate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 竖线分隔 */}
                {/* {showDivider && (
                  <div className="absolute right-0 top-1 bottom-0 w-[1px] bg-gray-300/60"></div>
                )} */}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BusinessStageLoss
