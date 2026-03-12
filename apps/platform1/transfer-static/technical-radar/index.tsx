import { FC, useState, useRef, useEffect } from "react"
import { message, Tooltip } from "antd"
import { CloseOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import RadarChart from "./components/RadarChart"
import RadarConfigDescription from "./components/RadarConfigDescription"
import Declare from "./components/Declare"
import RadarChartDetail from "./components/RadarChartDetail"
import { Blip } from "./type"
import {
  axisLineStyleConfig,
  getRingAndQuadrantFromCoordinate,
  layoutControlsConfig,
  quadrantConfig,
  quadrantLabelConfig,
  RADAR_CONFIG,
  radarLabelConfig
} from "./config"
import { queryTechnicalRadarPoint } from "../services/technicalRadar"
import "./index.module.scss"

const TechnicalRadar: FC = () => {
  const navigate = useNavigate()
  const [selectedBlip, setSelectedBlip] = useState<Blip | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [drawerMode, setDrawerMode] = useState<"detail" | "list">("detail")

  const textRef = useRef<HTMLParagraphElement>(null)
  const [isTextTruncated, setIsTextTruncated] = useState(false)

  useEffect(() => {
    getTechnicalRadarPoint()
    const checkTruncation = () => {
      const element = textRef.current
      if (element) {
        setIsTextTruncated(element.scrollWidth > element.clientWidth)
      }
    }

    checkTruncation()
    window.addEventListener("resize", checkTruncation)
    return () => window.removeEventListener("resize", checkTruncation)
  }, [])

  // 获取雷达点
  const getTechnicalRadarPoint = async () => {
    try {
      const res = await queryTechnicalRadarPoint()
      const newBlips: Blip[] = res?.map(
        (item: { technologyNo: number; horizontalAxis: string; verticalAxis: string }) => ({
          ...item,
          x: Number(item.horizontalAxis),
          y: Number(item.verticalAxis),
          ...getRingAndQuadrantFromCoordinate(
            Number(item.horizontalAxis),
            Number(item?.verticalAxis)
          )
        })
      )
      setRadarConfig((prev: any) => ({
        ...prev,
        blips: newBlips || []
      }))
    } catch (e) {
      console.log("e", e)
      message.error("获取技术点信息失败")
    }
  }

  /** 雷达点 */
  const handleBlipClick = (blip: Blip) => {
    setSelectedBlip(blip)
    setDrawerMode("detail")
    setDetailVisible(true)
  }

  /** 雷达点Tooltip的点击 */
  const handleTooltipClick = (blip: Blip) => {
    setSelectedBlip(blip)
  }

  // console.log('MOCK_BLIPS', MOCK_BLIPS)
  const [radarConfig, setRadarConfig] = useState({
    // Core props
    blips: [],
    config: RADAR_CONFIG,
    onBlipClick: handleBlipClick,
    onTooltipClick: handleTooltipClick,

    ...layoutControlsConfig,

    ...axisLineStyleConfig,

    ...radarLabelConfig,

    /** 象限配置 */
    quadrantConfigs: quadrantConfig,
    /** 象限标签 */
    quadrantLabels: quadrantLabelConfig
  })

  return (
    <div
      className="technical-radar flex flex-col rounded-xl border border-gray-200 bg-white"
      style={{ height: "calc(100vh - 92px)" }}
    >
      {/* 顶部标题栏 */}
      <div
        className="technical-header flex shrink-0 items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid #e5e7eb" }} // Explicit style to ensure visibility
      >
        <span className="text-lg font-medium text-gray-900">技术雷达</span>
        <CloseOutlined
          className="cursor-pointer text-lg text-gray-400 transition-colors hover:text-gray-600"
          onClick={() => navigate(-1)}
        />
      </div>

      {/* 内容区域 - 可滚动 */}
      <div className="relative flex-1 overflow-hidden" tabIndex={-1} style={{ outline: "none" }}>
        <div
          className="absolute inset-0 overflow-y-auto overflow-x-hidden p-6 transition-[right] duration-300 ease-in-out"
          style={{ right: detailVisible ? "400px" : "0", minWidth: 400 }}
        >
          {/* 申报 */}
          <Declare />

          {/* 雷达图 */}
          <div className="relative flex flex-col items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">
            <Tooltip
              title={
                isTextTruncated
                  ? "点击雷达图中任一技术光点，即可打开该技术详情页面查看技术介绍。但请注意，这些技术可能会随时更新。"
                  : ""
              }
            >
              <p
                ref={textRef}
                className="mb-10 text-center text-[13px] leading-6 text-slate-500 truncate"
              >
                点击雷达图中任一技术光点，即可打开该技术详情页面查看技术介绍。但请注意，这些技术可能会随时更新。
              </p>
            </Tooltip>
            <div className="flex-1 w-full mx-auto" style={{ maxWidth: "1300px", marginBottom: 38 }}>
              <RadarChart
                {...radarConfig}
                activeQuadrant={detailVisible ? selectedBlip?.quadrant : undefined}
                selectedBlip={selectedBlip}
              />
            </div>
          </div>

          {/* 说明 */}
          <RadarConfigDescription />
        </div>

        <RadarChartDetail
          open={detailVisible}
          onClose={() => {
            setDetailVisible(false)
            setSelectedBlip(null)
          }}
          blip={selectedBlip}
          mode={drawerMode}
          onModeChange={setDrawerMode}
          onBlipSelect={handleBlipClick}
        />
      </div>
    </div>
  )
}

export default TechnicalRadar
