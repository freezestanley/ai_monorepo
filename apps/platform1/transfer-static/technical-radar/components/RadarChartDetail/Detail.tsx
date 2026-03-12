import React, { useEffect, useState } from "react"
import { Blip } from "../../type"
import { queryTechnicalRadarPointDetail } from "../../../services/technicalRadar"
import { message, Spin } from "antd"

interface DetailProps {
  blip: Blip
}

const Detail: React.FC<DetailProps> = ({ blip }) => {
  const [detailData, setDetailData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getDetail()
  }, [blip.technologyNo])

  const getDetail = async () => {
    if (!blip.technologyNo) return
    setLoading(true)
    try {
      const res = await queryTechnicalRadarPointDetail({ technologyNo: blip.technologyNo })
      setDetailData(res)
    } catch (error) {
      console.error("Failed to fetch detail:", error)
      message.error("获取详情失败")
    } finally {
      setLoading(false)
    }
  }

  const getRingColor = (r: string) => {
    switch (r) {
      case "adopt":
        return "#52c41a" // green
      case "trial":
        return "#1677ff" // blue
      case "assess":
        return "#faad14" // yellow
      case "hold":
        return "#ff4d4f" // red
      default:
        return "#d9d9d9"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Status Line */}
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wide">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: getRingColor(detailData?.ringKey ?? "") }}
        />
        {detailData?.ringKeyName || "--"}
      </div>

      {/* Detail Introduction */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">详情介绍</h3>
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>{detailData?.introduction ?? "--"}</p>

          <div>
            <div className="font-medium text-slate-700 mb-1">基本特点</div>
            {detailData?.features ?? "--"}
          </div>

          <div>
            <div className="font-medium text-slate-700 mb-1">主要应用场景</div>
            {detailData?.appScenarios ?? "--"}
          </div>

          <div>
            <div className="font-medium text-slate-700 mb-1">技术特性</div>
            {detailData?.technicalScenarios ?? "--"}
          </div>
        </div>
      </div>

      {/* 智能搜索框*/}
      {/* <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-6 text-center border border-purple-100 group cursor-pointer hover:shadow-md transition-shadow">
        <div className="absolute top-0 left-0 w-16 h-16 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col items-center justify-center gap-3">
          <div className="bg-white text-purple-600 border border-purple-200 shadow-sm flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium">
            <span>✨ 智能搜索与分析</span>
          </div>
          <span className="text-xs text-purple-600 font-medium">可以通过智能搜索获取技术发展详情与应用建议。</span>
        </div>
      </div> */}

      {/* <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">相关资源</h3>
        <div className="flex flex-col gap-3">
          <a href="#" className="flex items-center gap-2 text-sm text-blue-600 hover:underline hover:text-blue-700 group w-fit">
            <div className="w-4 h-4 flex items-center justify-center border border-blue-200 rounded bg-blue-50">
              <LinkOutlined style={{ fontSize: '10px' }} />
            </div>
            <span>审批记录</span>
          </a>
          <a href="#" className="flex items-center gap-2 text-sm text-blue-600 hover:underline hover:text-blue-700 group w-fit">
            <div className="w-4 h-4 flex items-center justify-center border border-blue-200 rounded bg-blue-50">
              <LinkOutlined style={{ fontSize: '10px' }} />
            </div>
            <span>应用案例研究</span>
          </a>
        </div>
      </div> */}
    </div>
  )
}

export default Detail
