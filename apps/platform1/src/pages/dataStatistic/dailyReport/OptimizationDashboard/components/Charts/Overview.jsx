import React from "react"
import PropTypes from "prop-types"
import { useFetchOptimizationOverview } from "@/api/optimize"
import { Tooltip } from "antd"
import { QuestionCircleOutlined } from "@ant-design/icons"
import dayjs from "dayjs"

function OptimizationOverview({ botNo, startTime, endTime }) {
  const formattedStartTime = startTime ? dayjs(startTime).format("YYYY-MM-DD") : undefined
  const formattedEndTime = endTime ? dayjs(endTime).format("YYYY-MM-DD") : undefined

  const { data } = useFetchOptimizationOverview({
    botNo,
    startTime: formattedStartTime,
    endTime: formattedEndTime
  })

  return (
    <div className="bg-white">
      <div className="flex items-center mb-4">
        <h4 className="text-[14px] font-medium text-[#1F2937] m-0">数据总览</h4>
        <Tooltip title="展示优化数据的整体情况，包括总量、处理进度、完成率等关键指标">
          <QuestionCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
        </Tooltip>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {/* 创建优化总数 */}
        <div className="flex flex-col justify-center p-6 border rounded-lg">
          <div className="text-[14px] text-[#6B7280]">创建优化总数</div>
          <div className="text-[32px] font-medium text-[#1F2937] mt-2">
            {data?.newCreatedTotal || 0}
          </div>
        </div>

        {/* 已处理优化数据 */}
        <div className="flex flex-col justify-center p-6 border rounded-lg">
          <div>
            <div className="text-[14px] text-[#6B7280]">已累积优化数据</div>
            <div className="text-[32px] font-medium text-[#1F2937] mt-2">
              {data?.hasExaminedTotal || 0}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[14px] text-[#6B7280]">已输出优化数据</div>
            <div className="text-[32px] font-medium text-[#1F2937] mt-2">
              {data?.hasProcessedTotal || 0}
            </div>
          </div>
        </div>

        {/* 审核完成率 */}
        <div className="flex flex-col justify-center p-6 border rounded-lg">
          <div className="text-[14px] text-[#6B7280]">审核完成率</div>
          <div className="text-[32px] font-medium text-[#1F2937] mt-2">
            {(data?.hasExaminedPercentage * 100).toFixed(2)}%
          </div>
          <div className="text-[12px] text-[#6B7280] mt-3">审核平均耗时</div>
          <div className="text-[14px] text-[#1F2937] mt-1">{data?.avgExaminedCost || "-"}</div>
        </div>

        {/* 解决完成率 */}
        <div className="flex flex-col justify-center p-6 border rounded-lg">
          <div className="text-[14px] text-[#6B7280]">解决完成率</div>
          <div className="text-[32px] font-medium text-[#1F2937] mt-2">
            {(data?.hasProcessedPercentage * 100).toFixed(2)}%
          </div>
          <div className="text-[12px] text-[#6B7280] mt-3">解决平均耗时</div>
          <div className="text-[14px] text-[#1F2937] mt-1">{data?.avgProcessedCost || "-"}</div>
        </div>
      </div>
    </div>
  )
}

OptimizationOverview.propTypes = {
  botNo: PropTypes.string,
  startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  endTime: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
}

export default OptimizationOverview
