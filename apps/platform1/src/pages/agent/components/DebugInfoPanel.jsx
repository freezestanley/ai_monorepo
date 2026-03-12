import React, { useState, useMemo, useEffect } from "react"
import { Tabs, Tree, Empty, Spin, Tag, Tooltip, message as messageAnt } from "antd"
import {
  ApartmentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  CodeOutlined,
  DatabaseOutlined,
  UserOutlined,
  LoadingOutlined,
  CopyOutlined
} from "@ant-design/icons"
import { Bar } from "@ant-design/plots"
import dayjs from "dayjs"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import CopyToClipboard from "react-copy-to-clipboard"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import LoadingPlaceholder from "@/components/LoadingPlaceholder"
import HtmlPreview from "./HtmlPreview"
import "./debugInfoPanel.less"

// 统一的甘特颜色盘（多色）
const GANTT_COLORS = [
  "#5B8FF9",
  "#5AD8A6",
  "#5D7092",
  "#F6BD16",
  "#6F5EF9",
  "#6DC8EC",
  "#945FB9",
  "#FF9845",
  "#1E9493",
  "#FF99C3"
]

// 格式化JSON字符串（兼容字符串/对象）
const formatJsonString = (value) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return String(value ?? "")
  }
}

// 中间省略式截断字符串，避免 y 轴过长
const truncateMiddle = (str = "", maxLen = 18) => {
  if (!str || str.length <= maxLen) return str
  const head = Math.ceil((maxLen - 1) / 2)
  const tail = Math.floor((maxLen - 1) / 2)
  return `${str.slice(0, head)}…${str.slice(-tail)}`
}

// 毫秒格式化为 mm:ss.SSS（若 < 60s 则 ss.SSS）
const formatMs = (ms = 0) => {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const msRemain = ms % 1000
  const pad = (n, l = 2) => String(n).padStart(l, "0")
  if (m > 0) return `${pad(m)}:${pad(s)}.${String(msRemain).padStart(3, "0")}`
  return `${s}.${String(msRemain).padStart(3, "0")}s`
}

// 简单字符串哈希用于配色索引
const hashStr = (str = "") => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h)
}

// 根据节点类型获取图标和背景色
const getNodeIcon = (node) => {
  const iconStyle = { color: "#fff", padding: "3px", borderRadius: "4px" }
  if (node.actionType === "USER_INPUT")
    return <UserOutlined style={{ ...iconStyle, background: "#1890ff" }} />
  if (node.actionType === "RECALL_KNOWLEDGE")
    return <DatabaseOutlined style={{ ...iconStyle, background: "#faad14" }} />
  if (node.actionType === "INVOKE_AGENT_TOOL") {
    if (node.agentType === "PLUGIN_TOOL")
      return <AppstoreOutlined style={{ ...iconStyle, background: "#52c41a" }} />
    if (node.agentType === "SKILL")
      return <CodeOutlined style={{ ...iconStyle, background: "#722ed1" }} />
    return <ApiOutlined style={{ ...iconStyle, background: "#13c2c2" }} />
  }
  return <ApartmentOutlined style={{ ...iconStyle, background: "#eb2f96" }} />
}

const CallTree = ({ treeData, onSelectNode }) => {
  const renderTitle = (node) => {
    const title = node.agentToolName || node.name || node.actionType
    const isRunning = node.actionType === "INVOKE_AGENT_TOOL" && node.processStatus !== "END"
    const hasErrorMsg = Boolean(node?.executeResult?.errorMsg || node?.errorMsg)
    const innerCode = node?.executeResult?.result?.code ?? node?.executeResult?.code
    const badCode = typeof innerCode !== "undefined" && String(innerCode) !== "200"
    const explicitFail = node?.executeResult?.result?.success === false
    const httpError = typeof node?.statusCode === "number" && node.statusCode >= 400
    const isFailed =
      node.actionType === "INVOKE_AGENT_TOOL" &&
      node.processStatus === "END" &&
      (hasErrorMsg || badCode || explicitFail || httpError)
    return (
      <div className="flex items-center gap-2">
        {getNodeIcon(node)}
        {isFailed && (
          <Tag color="#ff4d4f" style={{ marginLeft: 0 }}>
            失败
          </Tag>
        )}
        <span
          className={`text-[13px] truncate max-w-[180px] ${isFailed ? "text-red-500" : "text-gray-600"}`}
          title={title}
        >
          {title}
        </span>
        {isRunning && (
          <>
            <Tag color={"purple"} style={{ marginLeft: 4 }}>
              <Spin className="mr-1" size="small" />
              <span className="text-xs ml-1">运行中</span>
            </Tag>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <Tree
        treeData={treeData}
        titleRender={renderTitle}
        blockNode
        defaultExpandAll
        showLine
        onSelect={(selectedKeys, { node }) => onSelectNode?.(node)}
      />
    </>
  )
}

const FlameGanttChart = ({ data, isLoading }) => {
  if (isLoading) {
    return <LoadingPlaceholder title="火焰图正在准备中..." />
  }
  if (!Array.isArray(data) || data.length === 0) return <Empty description="暂无数据" />

  // 修复：使用 startTime 和 endTime，或者用 cost 计算
  const validData = data.filter((item) => {
    // 如果有 startTime 和 endTime，使用它们
    if (typeof item.startTime === "number" && typeof item.endTime === "number") {
      return true
    }
    // 否则，如果有 endTime 和 cost，可以计算 startTime
    if (typeof item.endTime === "number" && typeof item.cost === "number") {
      return true
    }
    // 备用方案：如果只有 cost，使用 cost 作为时间跨度
    if (typeof item.cost === "number" && item.cost > 0) {
      return true
    }
    return false
  })

  if (validData.length === 0) {
    console.warn("No valid data for Gantt chart. Data items:", data)
    return (
      <Empty
        description={
          <div>
            <div>无有效的图表数据（缺少时间戳信息）</div>
            <div style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
              需要 startTime 和 endTime，或 endTime 和 cost
            </div>
          </div>
        }
      />
    )
  }

  // 构建甘特图数据（x 轴为时间区间，y 轴为工具名称）
  const chartData = validData
    .map((item) => {
      let startTime, endTime

      // 优先使用 startTime 和 endTime
      if (typeof item.startTime === "number" && typeof item.endTime === "number") {
        startTime = item.startTime
        endTime = item.endTime
      } else if (typeof item.endTime === "number" && typeof item.cost === "number") {
        // 如果只有 endTime 和 cost，计算 startTime
        endTime = item.endTime
        startTime = item.endTime - item.cost
      }

      if (typeof startTime !== "number" || typeof endTime !== "number") return null

      const nameFull = item.agentToolName || item.name || item.actionType || "未知工具"
      return {
        name: nameFull,
        nameShort: truncateMiddle(nameFull, 8),
        startTime,
        endTime,
        timeRange: [startTime, endTime],
        duration: endTime - startTime
      }
    })
    .filter(Boolean)

  // 按 startTime 排序，便于展示并行执行（保持 y 轴顺序稳定）
  chartData.sort((a, b) => a.startTime - b.startTime)

  // 记录全局起点，便于时间轴从首个开始
  const t0 = chartData.length ? chartData[0].startTime : undefined
  const config = {
    data: chartData,
    isRange: true,
    xField: "timeRange", // x 轴为时间区间
    yField: "name", // y 轴为工具名称
    // 多色：按名称哈希映射到统一色盘
    color: (d) => GANTT_COLORS[hashStr(d.name) % GANTT_COLORS.length],
    // 单系列渲染，避免按照 name 拆分多系列导致“堆叠/分组”错觉
    legend: false,
    xAxis: {
      type: "time",
      min: t0,
      nice: true,
      label: {
        autoHide: true,
        autoRotate: false,
        formatter: (v) => (dayjs(Number(v)).isValid() ? dayjs(Number(v)).format("HH:mm:ss") : "")
      },
      tickCount: 4,
      grid: null
    },
    yAxis: {
      label: {
        formatter: (v) => truncateMiddle(String(v), 8),
        style: { fontSize: 10 },
        autoHide: true
      }
    },
    tooltip: {
      customContent: (title, items) => {
        if (!items || !items.length) return ""
        const d = items[0]?.data || {}
        const st = d.startTime ? dayjs(d.startTime).format("HH:mm:ss.SSS") : "-"
        const et = d.endTime ? dayjs(d.endTime).format("HH:mm:ss.SSS") : "-"
        const dur = typeof d.duration === "number" ? formatMs(d.duration) : "-"
        return `
          <div class="gantt-tooltip">
            <div class="tt-title">${d.name || "-"}</div>
            <div class="tt-row"><span>开始</span><span>${st}</span></div>
            <div class="tt-row"><span>结束</span><span>${et}</span></div>
            <div class="tt-row"><span>耗时</span><span>${dur}</span></div>
          </div>
        `
      }
    },
    scrollbar: { y: {} },
    appendPadding: [8, 0, 8, 0]
  }

  return (
    <div className="gantt-wrap">
      <Bar {...config} />
    </div>
  )
}

const NodeDetail = ({ node }) => {
  if (!node) return <Empty description="请在调用树中选择一个节点以查看详情" />
  const rows = [
    { k: "类型", v: node.agentType || node.knowledgeType || node.actionType || "-" },
    { k: "请求耗时", v: typeof node.cost === "number" ? `${node.cost}ms` : "-" }
  ]
  return (
    <div className="flex flex-col gap-2 text-sm">
      {rows.map((r) => (
        <div className="flex" key={r.k}>
          <span className="text-gray-500 w-24 flex-shrink-0">{r.k}:</span>
          <span className="text-gray-800">{r.v}</span>
        </div>
      ))}
    </div>
  )
}

const InputDetail = ({ node }) => {
  const content = node?.actionType === "USER_INPUT" ? node?.userInput : node?.args
  if (!content) return <Empty description="当前节点没有输入信息" />
  return (
    <CodeMirror
      className="cm-thin"
      value={formatJsonString(content)}
      height="auto"
      minHeight="10px"
      maxHeight="500px"
      extensions={[json()]}
      readOnly
      theme="light"
    />
  )
}

const OutputDetail = ({ node }) => {
  if (!node?.executeResult) return <Empty description="当前节点没有输出信息" />
  return (
    <CodeMirror
      className="cm-thin"
      value={formatJsonString(node.executeResult)}
      height="auto"
      minHeight="10px"
      maxHeight="500px"
      extensions={[json()]}
      readOnly
      theme="light"
    />
  )
}

const DebugInfoPanel = ({ messages = [], isLoading }) => {
  const [collapsedMessages, setCollapsedMessages] = useState({})

  // 获取所有包含 serverActions 的 AI 消息
  const debugMessages = useMemo(() => {
    return (messages || []).filter((msg) => {
      const hasServerActions = Array.isArray(msg.serverActions) && msg.serverActions.length > 0
      const hasToolInvoke =
        hasServerActions && msg.serverActions.some((a) => a.actionType === "INVOKE_AGENT_TOOL")
      return msg.status === "ai" && hasToolInvoke
    })
  }, [messages])

  // 获取最新的 AI 消息 ID（用于判断哪条消息正在 loading）
  const latestMessageId = useMemo(() => {
    const aiMsgs = (messages || []).filter((m) => m.status === "ai")
    return aiMsgs.length ? aiMsgs[aiMsgs.length - 1].id : null
  }, [messages])

  // 仅展开一个：点击展开某条时，自动折叠其他；若再次点击已展开的，则折叠之
  const handleToggleMessageCollapse = (messageId, isCurrentlyCollapsed, allIds = []) => {
    if (isCurrentlyCollapsed) {
      const next = {}
      allIds.forEach((id) => (next[id] = true))
      next[messageId] = false
      setCollapsedMessages(next)
    } else {
      setCollapsedMessages((prev) => ({ ...prev, [messageId]: true }))
    }
  }

  // 当出现新的 AI 调试消息时，自动折叠老的、展开最新
  useEffect(() => {
    const aiDebugIds = debugMessages.map((m) => m.id)

    if (aiDebugIds.length === 0) return

    const hasNew = aiDebugIds.some((id) => !(id in collapsedMessages))
    if (!hasNew) return

    const next = {}
    aiDebugIds.forEach((id, idx) => {
      next[id] = idx !== aiDebugIds.length - 1 // 仅最新一条展开
    })
    setCollapsedMessages(next)
  }, [debugMessages, collapsedMessages])

  // 获取当前选中消息的用户输入
  const getCurrentUserInput = (messageId) => {
    const idx = messages.findIndex((m) => m.id === messageId)
    if (idx > -1) {
      const prevUser = [...messages]
        .slice(0, idx)
        .reverse()
        .find((m) => m.status === "local")
      return prevUser?.message
    }
    return messages.find((m) => m.status === "local")?.message
  }

  // 获取消息的简短用户输入文本
  const getUserInputPreview = (messageId) => {
    const ui = getCurrentUserInput(messageId) || ""
    const clean = String(ui).replace(/\s+/g, " ").trim()
    if (!clean) return null
    return clean.length > 30 ? clean.slice(0, 30) + "…" : clean
  }

  // 若没有任何 INVOKE_AGENT_TOOL 相关的调试消息，完全不渲染（避免“展开”空面板）
  if (debugMessages.length === 0) {
    return null
  }

  return (
    <div className="w-[100%] h-[calc(100vh-115px)] flex flex-col transition-all duration-300 ease-in-out overflow-auto">
      <div className="flex flex-col gap-3">
        {debugMessages.map((msg, index) => {
          const userInputPreview = getUserInputPreview(msg.id)
          const userInputFull = getCurrentUserInput(msg.id)

          return (
            <div key={msg.id || index}>
              {/* 消息头部 */}
              <div className="px-2 py-2 bg-gray-50 text-xs text-gray-500 sticky top-0 flex justify-between items-center z-10">
                <span className="flex items-center gap-2">
                  <span>对话 #{index + 1}</span>
                  {userInputPreview && (
                    <span className="text-gray-400 max-w-[70%] truncate" title={userInputFull}>
                      {userInputPreview}
                    </span>
                  )}
                </span>
                <div
                  onClick={() =>
                    handleToggleMessageCollapse(
                      msg.id,
                      !!collapsedMessages[msg.id],
                      debugMessages.map((m) => m.id)
                    )
                  }
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <i
                    className={`iconfont ${collapsedMessages[msg.id] ? "icon-Up" : "icon-Down"}`}
                  />
                </div>
              </div>

              {/* 调试信息面板 */}
              {!collapsedMessages[msg.id] && (
                <DebugInfoContent
                  serverActions={msg.serverActions}
                  userInput={getCurrentUserInput(msg.id)}
                  isLoading={isLoading && msg.id === latestMessageId}
                  messageId={msg.id}
                  latestMessageId={latestMessageId}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 单个调试信息内容组件
const DebugInfoContent = ({ serverActions, userInput, isLoading, messageId, latestMessageId }) => {
  const [selectedNode, setSelectedNode] = useState(null)
  const [activeTab, setActiveTab] = useState(null)

  // 过滤掉 REASONING（思考过程）类型的节点，仅展示真正的工具/工作流调用
  const filteredActions = useMemo(
    () => (serverActions || []).filter((a) => a?.actionType !== "REASONING"),
    [serverActions]
  )

  const treeData = useMemo(() => {
    const children = (filteredActions || []).map((a, idx) => ({
      key: a.uniqueId || `tool-${idx}`,
      ...a,
      title: a.agentToolName || a.name || a.actionType,
      children: []
    }))
    const root = {
      key: "user-input",
      actionType: "USER_INPUT",
      name: "用户输入 UserInput",
      userInput,
      children
    }
    return [root]
  }, [filteredActions, userInput])

  useEffect(() => {
    if (!selectedNode && treeData.length > 0) {
      setSelectedNode(treeData[0])
    }
  }, [treeData, selectedNode])

  const inputText = useMemo(() => {
    const c =
      selectedNode?.actionType === "USER_INPUT" ? selectedNode?.userInput : selectedNode?.args
    return c ? formatJsonString(c) : ""
  }, [selectedNode])

  const outputText = useMemo(() => {
    const r = selectedNode?.executeResult
    return r ? formatJsonString(r) : ""
  }, [selectedNode])

  // 判断是否需要显示预览结果 Tab：通过 data 是否包含 <!DOCTYPE html>（兼容无空格写法）
  const isDoctypeHtml = (s = "") => typeof s === "string" && /<!doctype\s*html/i.test(s)

  const isNodeHtmlByData = (n) =>
    isDoctypeHtml(n?.executeResult?.data) || isDoctypeHtml(n?.executeResult?.result?.data)

  const previewCapableNodes = useMemo(
    () => (filteredActions || []).filter((n) => isNodeHtmlByData(n)),
    [filteredActions]
  )
  const hasPreview = previewCapableNodes.length > 0

  // 选中的可预览节点：优先当前选中节点，否则取最新一个可预览节点
  const activePreviewNode = useMemo(() => {
    if (isNodeHtmlByData(selectedNode)) return selectedNode
    return previewCapableNodes[previewCapableNodes.length - 1]
  }, [selectedNode, previewCapableNodes])

  // 如果没有 serverActions，显示加载状态或空状态
  if (!serverActions || serverActions.length === 0) {
    if (isLoading) {
      return <LoadingPlaceholder title="火焰图正在生成中..." />
    }
    return (
      <div className="p-2 text-center text-gray-400">
        <div className="mb-2">暂无调试信息</div>
        <div className="text-xs">当开始对话后，这里将显示详细的执行过程</div>
      </div>
    )
  }

  // 解析可预览内容
  const isProbablyHtml = (str = "") => {
    if (typeof str !== "string") return false
    const s = str.trim().toLowerCase()
    return (
      s.startsWith("<!doctype") || s.includes("<html") || s.includes("<div") || s.includes("<body")
    )
  }
  const isImageUrl = (str = "") =>
    typeof str === "string" && /^https?:\/\/[^\s]+\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(str)

  const responseFormat = activePreviewNode?.extraInfo?.responseFormat
  const er = activePreviewNode?.executeResult || {}
  const erRes = er?.result || {}

  const htmlCandidates = [
    er.htmlContent,
    er.html,
    erRes.htmlContent,
    erRes.html,
    er.data,
    erRes.data
  ]
  const imageCandidates = [
    er.imageUrl,
    er.image,
    er.img,
    er.url,
    er.data,
    erRes.imageUrl,
    erRes.image,
    erRes.img,
    erRes.url,
    erRes.data
  ]

  const htmlString = htmlCandidates.find((c) => typeof c === "string" && isProbablyHtml(c)) || ""
  const imageUrl = imageCandidates.find((c) => typeof c === "string" && isImageUrl(c)) || ""

  const tabItems = [
    ...(hasPreview
      ? [
          {
            key: "0",
            label: "预览结果",
            children: (
              <HtmlPreview
                htmlContent={htmlString}
                imageUrl={imageUrl}
                contentType={responseFormat === "IMAGE" && imageUrl ? "image" : "html"}
                isLoading={isLoading && messageId === latestMessageId && !htmlString && !imageUrl}
              />
            )
          }
        ]
      : []),
    {
      key: "1",
      label: "调用树",
      children: (
        <CallTree
          treeData={treeData}
          onSelectNode={setSelectedNode}
          isLoading={isLoading}
          messageId={messageId}
          latestMessageId={latestMessageId}
        />
      )
    },
    {
      key: "2",
      label: "火焰图",
      children: (
        <FlameGanttChart
          data={filteredActions}
          isLoading={isLoading && messageId === latestMessageId}
        />
      )
    }
  ]

  // 根据 hasPreview 动态设置默认 tab
  const defaultTab = hasPreview ? "0" : "1"
  const currentTab = activeTab ?? defaultTab

  return (
    <div className="p-4 flex flex-col gap-4">
      <Tabs
        className="-mt-[20px]"
        activeKey={currentTab}
        items={tabItems}
        onChange={setActiveTab}
      />
      {currentTab === "1" && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-md font-semibold mb-2 text-gray-600">节点详情</h3>
            <div className="p-2 bg-gray-50 rounded-md">
              <NodeDetail node={selectedNode} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-semibold text-gray-600">输入</h3>
              <CopyToClipboard
                text={inputText}
                onCopy={() => inputText && messageAnt.success("已复制输入")}
              >
                <Tooltip title={inputText ? "复制" : "无可复制内容"}>
                  <span
                    className={
                      inputText
                        ? "text-[#722ED1] cursor-pointer hover:opacity-80"
                        : "text-gray-300 cursor-not-allowed"
                    }
                  >
                    <CopyOutlined />
                  </span>
                </Tooltip>
              </CopyToClipboard>
            </div>
            <div className="p-2 bg-gray-50 rounded-md">
              <InputDetail node={selectedNode} />
            </div>
          </div>
          {selectedNode?.actionType !== "USER_INPUT" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-semibold text-gray-600">输出</h3>
                <CopyToClipboard
                  text={outputText}
                  onCopy={() => outputText && messageAnt.success("已复制输出")}
                >
                  <Tooltip title={outputText ? "复制" : "无可复制内容"}>
                    <span
                      className={
                        outputText
                          ? "text-[#722ED1] cursor-pointer hover:opacity-80"
                          : "text-gray-300 cursor-not-allowed"
                      }
                    >
                      <CopyOutlined />
                    </span>
                  </Tooltip>
                </CopyToClipboard>
              </div>
              <div className="p-2 bg-gray-50 rounded-md">
                <OutputDetail node={selectedNode} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(DebugInfoPanel)
