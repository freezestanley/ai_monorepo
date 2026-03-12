import React, { useState, useEffect } from "react"
import { Progress, Spin, Modal, Tag } from "antd"
import { RefreshCcw, Database, Sparkles, Cpu, CircleCheck } from "lucide-react"
import { LoadingOutlined, CheckOutlined } from "@ant-design/icons"
import { useDataAccumulationProgressApi, useStepChainApi } from "@/api/flywheel"

interface IProps {
  open: boolean
  onCancel: () => void
  openSettingDrawer: () => void
  dataAccumulationProgress: any
  steps: any
  refetchDataAccumulationProgress: () => void
}

const DataAccumulation: React.FC<IProps> = ({
  open,
  onCancel,
  openSettingDrawer,
  dataAccumulationProgress,
  steps,
  refetchDataAccumulationProgress
}) => {
  const [rotation, setRotation] = useState(0)

  const {
    targetCount,
    currentCount,
    completed: accumulateCompleted // 数据是否积累完成
  } = dataAccumulationProgress

  const safeTargetCount = targetCount ?? 0
  const safeCurrentCount = currentCount ?? 0

  // 渲染图标
  const renderIcon = (status: number) => {
    if (status === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center ">
          <CircleCheck className="text-green-500 w-5 h-5" />
        </div>
      )
    }

    if (status === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-400 flex items-center justify-center ">
          <LoadingOutlined className="text-purple-500 text-md" spin />
        </div>
      )
    }

    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center ">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
      </div>
    )
  }

  // 获取连接线颜色
  const getLineColor = (status: number) => {
    if (status === 3) return "bg-green-100"
    return "bg-gray-100"
  }

  // 获取标题颜色
  const getTitleColor = (status: number) => {
    if (status === 1) return "text-gray-400"
    return "text-gray-700"
  }

  // 获取右侧文本颜色
  const getRightTextColor = (status: number) => {
    if (status === 1) return "text-gray-400"
    if (status === 2) return "text-purple-400"
    else return "text-gray-300"
  }

  const relaod = () => {
    setRotation((prev) => prev + 360)
    refetchDataAccumulationProgress()
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
      closable={true}
      styles={{
        content: { padding: 0 },
        body: { padding: 0 }
      }}
    >
      <div className="flex p-6 mx-0 justify-center border border-gray-200 rounded-xl bg-white relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:rounded-t-lg before:bg-[linear-gradient(90deg,rgb(233_223_254)_0%,rgb(248_219_252)_50%,rgb(233_223_254)_100%)]">
        <div className="flex flex-col justify-center items-center py-10 space-y-10 w-full">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-[#f0e7ff] flex items-center justify-center shadow-lg border border-purple-100">
              {accumulateCompleted ? (
                <Cpu className="w-14 h-14 text-[#6e2bd9]" />
              ) : (
                <Database className="w-14 h-14 text-[#6e2bd9]" />
              )}
            </div>

            <div className="absolute h-[30px] w-[30px] bottom-0 right-1 bg-white rounded-full p-1 shadow-md border border-gray-100">
              {accumulateCompleted ? (
                <Sparkles className="w-[20px] h-[20px] text-[#fbce94]" />
              ) : (
                <Spin
                  indicator={
                    <LoadingOutlined
                      style={{
                        fontSize: 20,
                        color: "#52c41a"
                      }}
                      spin
                    />
                  }
                />
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center space-y-3">
            <div className="text-[26px] font-bold">
              {accumulateCompleted ? "样本已就绪，正在进行首批分析" : "数据飞轮正在积累样本"}
            </div>
            <div className="text-[16px] text-gray-500 w-[450px] text-center leading-[1.6] ">
              {accumulateCompleted ? "已积累" : "系统需要积累至少"}
              <span className="text-[16px] font-bold px-1 text-black">{`${safeTargetCount}条`}</span>
              {accumulateCompleted
                ? "有效数据。AI正在对数据进行深度结构化处理，这可能需要几分钟时间。"
                : "有效会话数据，以确保分析结果具备统计学意义。"}
            </div>
          </div>
          {!accumulateCompleted && (
            <div className="space-y-6 flex flex-col justify-center items-center">
              <div className="flex items-center justify-between w-full text-[14px] font-bold">
                <span className="text-[#6e2bd9] ">当前累计量</span>
                <span className="text-gray-400 ">目标：{`${safeTargetCount}条`}</span>
              </div>
              <Progress
                percent={(safeCurrentCount / safeTargetCount) * 100}
                percentPosition={{ align: "end", type: "inner" }}
                size={[600, 15]}
                format={(percent) => `${safeCurrentCount}`}
                strokeColor="#6e2bd9"
              />
              <div className="flex justify-start w-full">
                <div
                  className="flex items-center text-[12px] text-gray-400 space-x-2 cursor-pointer "
                  onClick={relaod}
                >
                  <RefreshCcw
                    className="w-4 h-4 transition-transform duration-500"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                  <span> 每五分钟自动同步</span>
                </div>
              </div>
              <div className="text-[14px] text-gray-400">
                等待期间，建议您
                <span
                  className="text-[#6e2bd9] font-bold px-2 cursor-pointer"
                  onClick={openSettingDrawer}
                >
                  完善业务配置
                </span>
              </div>
            </div>
          )}
          {accumulateCompleted && (
            <div className="w-[500px] flex flex-col items-center space-y-10">
              <div className="w-full">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    {/* 左侧：图标和连接线 */}
                    <div className="flex flex-col items-center">
                      {/* 图标 */}
                      {renderIcon(step?.stepExecStatusCode as number)}

                      {/* 连接线 */}
                      {index < steps.length - 1 && (
                        <div
                          className={`w-1 h-[25px] transition-colors duration-300 ${getLineColor(step.stepExecStatusCode as number)}`}
                        />
                      )}
                    </div>

                    {/* 右侧：内容 */}
                    <div className="flex-1 flex items-start justify-between mt-1">
                      <span
                        className={`text-lg transition-colors duration-300 font-bold ${getTitleColor(step.stepExecStatusCode as number)}`}
                      >
                        {step.stepName}
                      </span>

                      <span
                        className={`text-lg transition-colors duration-300 ${getRightTextColor(step.stepExecStatusCode as number)}`}
                      >
                        {step.executionTime ? `${step.executionTime}s` : ""}
                        {step.stepExecStatusCode === 2 && "Running..."}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Tag color="gold" className="p-3 flex items-center justify-center space-x-2">
                <Sparkles className="w-[20px] h-[20px] text-[#fbce94]" />
                <span className="text-[14px]">分析完成后，页面将自动刷新并展示全景图表</span>
              </Tag>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default DataAccumulation
