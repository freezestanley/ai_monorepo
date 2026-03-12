import React, { useRef, useState, useEffect } from "react"
import { Button, Drawer, Select, Space, Empty, Spin, Tooltip, Typography } from "antd"
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons"
import AIAgentExecutionProcess from "@/components/AIAgentExecutionProcess"
import { useFetchDebugSessions, useFetchDebugExecuteProcess } from "@/api/agent"
import dayjs from "dayjs"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import CallChain from "@/pages/dataStatistic/callLogs/LogDetailDrawer/CallChain"

const { Text } = Typography

const DebugDrawer = ({ visible, onClose, botNo, sessionId, mode, isEmbedded }) => {
  const debugRef = useRef(null)
  const intervalRef = useRef(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionOptions, setSessionOptions] = useState([])
  const [selectedDate, setSelectedDate] = useState("all")
  const [status, setStatus] = useState(null)
  const [debugSessions, setDebugSessions] = useState(null)
  const [executeProcessData, setExecuteProcessData] = useState(null)
  const [showLoading, setShowLoading] = useState(false)

  // Define status options
  const statusOptions = [
    { value: null, label: "全部状态" },
    { value: true, label: "成功" },
    { value: false, label: "失败" }
  ]

  // Generate dynamic date options for the last 7 days
  const generateDateOptions = () => {
    const options = [{ value: "all", label: "全部" }]

    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(i, "day")
      const dateStr = date.format("YYYY-MM-DD")
      options.push({ value: dateStr, label: dateStr })
    }

    return options
  }

  // Define date options
  const dateOptions = generateDateOptions()

  // Get date range based on selected date
  const getDateRange = () => {
    if (selectedDate === "all") {
      return [dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")]
    } else {
      const date = dayjs(selectedDate)
      return [date.startOf("day"), date.endOf("day")]
    }
  }

  // Fetch debug sessions using mutation
  const { mutate: fetchDebugSessionsMutate, isLoading } = useFetchDebugSessions()

  // Get selected session data for debug execute process
  const getSelectedSessionData = () => {
    if (!selectedSession || !sessionOptions.length) return null
    const session = sessionOptions.find((option) => option.value === selectedSession)
    return session?.data
  }

  // Fetch debug execute process data when session is selected
  const selectedSessionData = getSelectedSessionData()
  const { data: debugExecuteProcess, isLoading: isLoadingExecuteProcess } =
    useFetchDebugExecuteProcess(
      {
        botNo: botNo,
        requestId: selectedSessionData?.requestId,
        requestTime: selectedSessionData?.requestTime
      },
      {
        enabled: !!selectedSessionData
      }
    )

  // Effect to update execute process data when debugExecuteProcess changes
  useEffect(() => {
    if (debugExecuteProcess) {
      setExecuteProcessData(debugExecuteProcess)
    }
  }, [debugExecuteProcess])

  // Function to fetch debug sessions data
  const fetchDebugSessionsData = (shouldShowLoading = true) => {
    if (!sessionId) {
      setDebugSessions([])
      return
    }

    // 控制是否显示 loading 状态
    if (shouldShowLoading) {
      setShowLoading(true)
    }

    const params = {
      botNo: botNo,
      sessionId: sessionId,
      startTime: getDateRange()[0]?.format("YYYY-MM-DD HH:mm:ss"),
      endTime: getDateRange()[1]?.format("YYYY-MM-DD HH:mm:ss"),
      success: status,
      pageSize: 10000,
      pageNum: 1
    }

    fetchDebugSessionsMutate(params, {
      onSuccess: (data) => {
        setDebugSessions(data)
        setShowLoading(false) // 请求成功后关闭 loading
      },
      onError: (err) => {
        setShowLoading(false) // 请求失败后也要关闭 loading
      }
    })
  }

  // Effect to fetch debug sessions when drawer is visible or filters change
  useEffect(() => {
    if (visible) {
      fetchDebugSessionsData()
    }
  }, [visible, selectedDate, status])

  // Effect to handle polling when isEmbedded is true and visible is true
  useEffect(() => {
    // 清除之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // 当 isEmbedded 为 true 且 visible 为 true 时，启动定时请求
    if (isEmbedded && visible) {
      intervalRef.current = setInterval(() => {
        fetchDebugSessionsData(false) // 定时请求时不显示 loading 状态
      }, 3000) // 每3秒请求一次
    }

    // 清理函数：组件卸载或依赖变化时清除定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isEmbedded, visible, sessionId, selectedDate, status]) // 依赖项包括影响请求的所有状态

  useEffect(() => {
    if (debugSessions?.list && debugSessions.list.length > 0) {
      // Transform sessions data into options format
      const options = debugSessions.list.map((session) => ({
        value: session.requestId,
        label: (
          <div className="flex justify-between items-center w-full">
            <div className="text-sm">{session.requestContext || "调试会话"}</div>
            <div className="text-[12px] text-gray-500">{session.requestTime}</div>
          </div>
        ),
        data: session
      }))
      setSessionOptions(options)

      // 检查当前选中的 session 是否还存在于新的选项中
      const currentSessionExists =
        selectedSession && options.some((option) => option.value === selectedSession)

      if (!selectedSession || !currentSessionExists) {
        // 如果没有选中的 session 或当前选中的不存在，选择第一个
        setSelectedSession(options[0].value)
      }
    } else {
      setSessionOptions([])
      setSelectedSession(null)
    }
  }, [debugSessions, selectedSession])

  // Handle date selection change
  const handleDateChange = (value) => {
    setSelectedDate(value)
  }

  // Handle status change
  const handleStatusChange = (value) => {
    setStatus(value)
  }

  // Handle session selection change
  const handleSessionChange = (value) => {
    setSelectedSession(value)
    setExecuteProcessData(null) // 清空之前的执行过程数据
  }

  // Custom option renderer for session dropdown
  const sessionOptionRender = (option) => {
    if (!option) return null

    // Extract session data from options
    const sessionData = sessionOptions.find((item) => item.value === option.value)?.data
    const isSuccess = sessionData?.success

    return (
      <Tooltip
        title={`${sessionData?.requestContext || "调试会话"} - ${sessionData?.requestTime}`}
        placement="topLeft"
      >
        <div className="flex items-center w-full pr-2">
          {isSuccess !== undefined && (
            <span className="mr-2">
              {isSuccess ? (
                <CheckCircleFilled style={{ color: "#52c41a" }} />
              ) : (
                <CloseCircleFilled style={{ color: "#f5222d" }} />
              )}
            </span>
          )}
          <div className="flex justify-between items-center w-full">
            <div className="truncate max-w-[220px]">
              {sessionData?.requestContext || "调试会话"}
            </div>
            <div className="text-xs text-gray-400 ml-2">{sessionData?.requestTime}</div>
          </div>
        </div>
      </Tooltip>
    )
  }

  return (
    <Drawer
      getContainer={() => document.body} //document.querySelector(".preview-debug-container") ||
      width={isEmbedded ? 550 : 700}
      rootClassName={isEmbedded ? "property-confi-drawer-embedded" : "global-drawer"}
      mask={isEmbedded ? false : true}
      styles={{
        body: {
          display: "flex",
          padding: "0"
        }
      }}
      headerStyle={{
        padding: "17px"
      }}
      title={mode === "meta_agent_mode" ? "执行过程详情" : "日志详情"}
      placement={"right"}
      closable={true}
      onClose={onClose}
      open={visible}
      key={"right"}
    >
      {sessionId ? (
        <div className="p-5 w-full">
          <Space className="w-full mb-4">
            <Select
              style={{ width: 125 }}
              placeholder="选择日期"
              onChange={handleDateChange}
              value={selectedDate}
              options={dateOptions}
            />
            <Select
              style={{ width: 100 }}
              placeholder="筛选状态"
              onChange={handleStatusChange}
              value={status}
              options={statusOptions}
            />
            <Select
              showSearch
              placeholder="请选择调试会话"
              value={selectedSession}
              onChange={handleSessionChange}
              options={sessionOptions}
              loading={showLoading}
              style={isEmbedded ? { width: 270 } : { width: 425 }}
              notFoundContent={
                showLoading ? <Spin size="small" /> : <CustomEmpty description="暂无调试会话" />
              }
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              optionRender={sessionOptionRender}
              listItemHeight={30}
            />
          </Space>

          {showLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spin tip="加载执行详情中..." />
            </div>
          ) : selectedSession ? (
            executeProcessData && executeProcessData?.componentExecuteProcess?.length > 0 ? (
              // 新的调用链日志
              <CallChain ref={debugRef} record={debugExecuteProcess} />
            ) : // <AIAgentExecutionProcess
            //   showSearch={false}
            //   ref={debugRef}
            //   data={debugExecuteProcess || {}}
            // />
            !isLoadingExecuteProcess ? (
              <div className="flex justify-center items-center h-64">
                <CustomEmpty description="暂无日志详情数据" />
              </div>
            ) : (
              ""
            )
          ) : (
            <div className="flex justify-center items-center h-64">
              <CustomEmpty title="请选择一个调试会话" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center w-[100%] items-center h-[78vh]">
          <CustomEmpty description="暂无调试会话" />
        </div>
      )}
    </Drawer>
  )
}

export default DebugDrawer
