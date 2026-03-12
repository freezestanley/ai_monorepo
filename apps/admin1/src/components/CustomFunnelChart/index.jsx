import React, { useMemo, useState, useEffect } from "react"
import { Tooltip } from "antd"
import "./index.scss"

const CustomFunnelChart = ({
  data = [],
  height = 500,
  colors = [
    "#5B8FF9",
    "#61DDBA",
    "#2F54EB",
    "#8D72E2",
    "#F6BD16",
    "#FF6B3B",
    "#C23531",
    "#2F4554",
    "#61A0A8",
    "#D48265"
  ],
  showLabels = true,
  showTooltip = true,
  onItemClick
}) => {
  const [hoveredItem, setHoveredItem] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth)

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const maxValue = Math.max(...data.map((item) => item.value))
    const minWidth = 100 // 最小宽度像素
    const maxWidth = 500 // 最大宽度像素

    return data.map((item, index) => {
      const percentage = (item.value / maxValue) * 100
      const width = minWidth + (maxWidth - minWidth) * (item.value / maxValue)
      const total = data[0]?.value || 1
      const conversionRate = ((item.value / total) * 100).toFixed(1)

      return {
        ...item,
        percentage,
        width,
        conversionRate,
        color: colors[index % colors.length],
        index
      }
    })
  }, [data, colors])

  const funnelAreaHeight = 50 // 每个漏斗区域总高度50px
  const barHeight = 25 // 色块条高度25px
  const connectionHeight = 25 // 连接区域高度25px
  const svgWidth = 600
  const funnelCenterX = svgWidth / 2 // 漏斗中心X坐标

  // 使用vw和calc计算名称区域宽度和连接线起始位置
  const nameAreaWidth = 100 // 最小100px，或视口宽度的15%
  const connectionStartX = -nameAreaWidth - viewportWidth * 0.1 // 从名称区域右边缘开始，留2%视口宽度的间距

  const handleItemClick = (item, event) => {
    if (onItemClick) {
      onItemClick(item, event)
    }
  }

  const handleMouseEnter = (item, event) => {
    if (showTooltip) {
      const rect = event.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      })
      setHoveredItem(item)
    }
  }

  const handleMouseLeave = () => {
    setHoveredItem(null)
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ minHeight: height }}>
        暂无数据
      </div>
    )
  }

  // 创建每个漏斗区域的连接多边形路径
  const createConnectionPath = (currentWidth, nextWidth, y) => {
    const currentLeftX = funnelCenterX - currentWidth / 2
    const currentRightX = funnelCenterX + currentWidth / 2
    const nextLeftX = funnelCenterX - nextWidth / 2
    const nextRightX = funnelCenterX + nextWidth / 2

    const topY = y + barHeight
    const bottomY = y + funnelAreaHeight

    return `M ${currentLeftX} ${topY} L ${currentRightX} ${topY} L ${nextRightX} ${bottomY} L ${nextLeftX} ${bottomY} Z`
  }

  return (
    <div className="w-full custom-funnel-chart" style={{ minHeight: height }}>
      <div className="flex items-start">
        {/* 左侧名称列表 */}
        <div className="flex-shrink-0 pr-4" style={{ width: nameAreaWidth }}>
          {chartData.map((item, index) => {
            const y = 60 + index * funnelAreaHeight
            return (
              <div
                key={`name-${index}`}
                className="flex items-center justify-end"
                style={{
                  height: funnelAreaHeight,
                  marginTop: index === 0 ? y - funnelAreaHeight / 2 : 0,
                  lineHeight: `${funnelAreaHeight}px`
                }}
              >
                <span className="text-sm text-gray-500 font-[400] text-right mt-[20px]">
                  {item.name}
                </span>
              </div>
            )
          })}
        </div>

        {/* SVG图表区域 */}
        <div className="flex-1">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${svgWidth} ${height}`}
            className="overflow-visible"
          >
            <defs>
              {/* 定义渐变效果 */}
              {chartData.map((item, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`gradient-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={item.color} stopOpacity="1" />
                </linearGradient>
              ))}
            </defs>

            {/* 渲染漏斗图层级 */}
            {chartData.map((item, index) => {
              const y = 60 + index * funnelAreaHeight
              const barWidth = item.width
              const barX = funnelCenterX - barWidth / 2 // 居中对齐

              return (
                <g key={`funnel-item-${index}`}>
                  {/* 连接线从左侧名称区域连到色块 - 使用vw和calc动态计算 */}
                  <line
                    x1={connectionStartX}
                    y1={y + barHeight / 2}
                    x2={barX}
                    y2={y + barHeight / 2}
                    stroke="#d1d5db"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />

                  {/* 色块条 - 上面25px */}
                  <rect
                    x={barX}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={`url(#gradient-${index})`}
                    rx="3"
                    ry="3"
                    className="funnel-item cursor-pointer"
                    onClick={(e) => handleItemClick(item, e)}
                    onMouseEnter={(e) => handleMouseEnter(item, e)}
                    onMouseLeave={handleMouseLeave}
                  />

                  {/* 数值显示在色块条上 */}
                  {showLabels && (
                    <text
                      x={barX + barWidth / 2}
                      y={y + barHeight / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="funnel-label fill-white text-sm font-medium"
                    >
                      {item.value.toLocaleString()}
                    </text>
                  )}

                  {/* 灰色多边形连接区域 - 下面25px */}
                  {index < chartData.length - 1 && (
                    <g>
                      <path
                        d={createConnectionPath(barWidth, chartData[index + 1].width, y)}
                        fill="#f5f5f5"
                      />

                      {/* 占比显示在灰色背景区域上 */}
                      {showLabels && (
                        <text
                          x={funnelCenterX}
                          y={y + barHeight + connectionHeight / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="funnel-label fill-gray-600 text-xs"
                        >
                          {item.conversionRate}%
                        </text>
                      )}
                    </g>
                  )}

                  {/* 最后一个项目的占比显示 */}
                  {index === chartData.length - 1 && showLabels && (
                    <text
                      x={barX + barWidth + 15}
                      y={y + barHeight / 2}
                      textAnchor="start"
                      dominantBaseline="middle"
                      className="funnel-label fill-gray-600 text-xs"
                    >
                      {item.conversionRate}%
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && hoveredItem && (
        <div
          className="funnel-tooltip fixed z-50 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 10,
            transform: "translate(-50%, -100%)"
          }}
        >
          <div className="font-medium">{hoveredItem.name}</div>
          <div>数值: {hoveredItem.value.toLocaleString()}</div>
          <div>转化率: {hoveredItem.conversionRate}%</div>
        </div>
      )}
    </div>
  )
}

export default CustomFunnelChart
