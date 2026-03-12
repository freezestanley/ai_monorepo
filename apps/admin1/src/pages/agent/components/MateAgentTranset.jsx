import { useState, useEffect, useRef } from "react"
import { Button, Dropdown, message, Tooltip, Badge, Space } from "antd"
import dayjs from "dayjs"
import { trainMetaAgent, fetchTrainsetList, fetchTrainProgress } from "@/api/agent/api"
import MateAgentTrainingDrawer from "./MateAgentTrainingDrawer"
import "../detail.scss"

const MateAgentTranset = ({ agentDetail, agentNo, botNo, handleToolApproveChange }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [trainsetList, setTrainsetList] = useState([])
  const [trainData, setTrainData] = useState({})
  const [trainingDrawerData, setTrainingDrawerData] = useState({})
  const [trainProgressTaskId, setTrainProgressTaskId] = useState("")
  const timerRef = useRef(null)
  const trainTimerRef = useRef(null)

  const fetchTrainset = async () => {
    if (!agentDetail?.versionNo || !agentNo || !botNo) return
    const response = await fetchTrainsetList({ botNo, agentNo, versionNo: agentDetail.versionNo })
    if (response?.success) {
      setTrainsetList(response?.data || [])
      if (isHistoryOpen && !response?.data?.length) {
        message.info("暂无训练日志")
      }
    } else {
      response.message && message.error(response.message)
    }
  }

  useEffect(() => {
    ;(isHistoryOpen || !trainProgressTaskId) && fetchTrainset()
  }, [isHistoryOpen, agentDetail?.versionNo, agentNo, botNo, trainProgressTaskId])

  useEffect(() => {
    const taskId = trainsetList?.find((item) => item.status === 1)?.[0]?.taskId
    taskId && setTrainProgressTaskId((preState) => preState || taskId)
  }, [trainsetList])

  const handleTrainProgress = async (taskId, cb, isDetail) => {
    const timer = isDetail ? trainTimerRef : timerRef
    clearTimeout(timer.current)
    if (!botNo || !agentDetail?.versionNo || !agentNo || !taskId) return
    const res = await fetchTrainProgress({
      botNo,
      taskId,
      agentNo,
      versionNo: agentDetail?.versionNo
    })
    cb?.(res?.data)
    if (res?.data?.status === 1) {
      timer.current = setTimeout(() => {
        handleTrainProgress(taskId, cb, isDetail)
      }, 10000)
    }
  }

  useEffect(() => {
    handleTrainProgress(trainProgressTaskId, (res) => {
      if (res?.status !== 1) {
        handleToolApproveChange()
        setTrainProgressTaskId("")
        res?.status === 2 && message.success("训练完成")
      }
      setTrainData(res)
    })
  }, [botNo, agentDetail?.versionNo, agentNo, trainProgressTaskId])

  useEffect(() => {
    !isHistoryOpen && clearTimeout(trainTimerRef.current)
  }, [isHistoryOpen])

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(trainTimerRef.current)
    }
  }, [])

  // 训练
  const train = async () => {
    const response = await trainMetaAgent({ botNo, agentNo, versionNo: agentDetail?.versionNo })
    if (response.success) {
      message.success("训练开始")
      setTrainProgressTaskId(response.data)
    } else {
      message.error(response.message || "训练失败")
    }
  }
  return (
    <Space size="small">
      <Badge dot={false}>
        <Dropdown
          open={isHistoryOpen}
          onOpenChange={(open, info) => {
            info.source !== "menu" && setIsHistoryOpen(open)
          }}
          trigger={["click"]}
          menu={{
            selectable: false,
            items: trainsetList.map((item) => ({
              key: item.id,
              label: (
                <div className="flex items-center justify-between">
                  <span className="mr-[35px] text-[#000000]">
                    {item.gmtCreated && dayjs(item.gmtCreated).format("YYYY-MM-DD HH:mm:ss")}
                  </span>
                  <Button
                    type="link"
                    className="!p-0 !h-auto"
                    onClick={() => {
                      setIsHistoryOpen(false)
                      handleTrainProgress(
                        item.taskId,
                        (res) => {
                          setTrainingDrawerData({ visible: true, data: res })
                        },
                        true
                      )
                    }}
                  >
                    查看
                  </Button>
                </div>
              )
            }))
          }}
        >
          <Tooltip title="训练日志" placement="left">
            <Button icon={<div className="iconfont icon-lishijilu" />} />
          </Tooltip>
        </Dropdown>
      </Badge>
      <Button className="trainBtn" onClick={train} loading={!!trainProgressTaskId}>
        {trainProgressTaskId ? `训练中...${Number(trainData?.progress || 0).toFixed(0)}%` : "训练"}
      </Button>
      <MateAgentTrainingDrawer
        visible={trainingDrawerData.visible}
        data={trainingDrawerData.data}
        onCancel={() => setTrainingDrawerData({ visible: false })}
      />
    </Space>
  )
}

export default MateAgentTranset
