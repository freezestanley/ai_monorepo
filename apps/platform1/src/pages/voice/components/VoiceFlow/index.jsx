import React, { useState, useCallback, useRef, useEffect } from "react"
import { ReactFlowProvider } from "reactflow"
import Canvas from "./components/Canvas"
import "reactflow/dist/style.css"
import "./index.less"
import Header from "./components/Header"
import PropertyConfigDrawer from "./components/PropertyConfigDrawer"
import { message } from "antd"
import { useSaveFlowConfig } from "@/api/voiceAgent"
import { useLocation } from "react-router-dom"
import queryString from "query-string"

const VoiceFlow = ({
  flowConfig,
  taskId,
  botNo,
  taskName,
  status,
  agentNo,
  refreshFlowConfig,
  isEmbedded = false,
  flowTypePro = undefined,
  // 当 isEmbedded 为 true 时，从外部传入的 Header 功能方法
  onEmbeddedSave,
  onEmbeddedImport,
  onEmbeddedExport,
  embeddedSaveLoading = false,
  embeddedIsDraft = false,
  embeddedShowAutoLayoutTip = false,
  // 新增：用于暴露保存方法的回调
  onSaveMethodReady,
  // 新增：状态变化回调
  onDraftStatusChange,
  onAutoLayoutTipChange,
  isOnlyRead = false
}) => {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [showAutoLayoutTip, setShowAutoLayoutTip] = useState(false)
  const [currentFlowConfig, setCurrentFlowConfig] = useState(null)

  // 属性配置抽屉状态
  const [propertyDrawerOpen, setPropertyDrawerOpen] = useState(false)

  // 添加一个ref用于存储Canvas组件的方法
  const canvasRef = useRef(null)

  const saveFlowConfig = useSaveFlowConfig()
  const location = useLocation()

  // 从URL获取flowType参数
  const searchParams = queryString.parse(location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const flowType = flowTypePro
    ? parseInt(flowTypePro)
    : parseInt(searchParams.flowType || hashParams.flowType || "1") // 默认为工作流模式

  // 确保初始状态为非草稿状态
  useEffect(() => {
    setIsDraft(false)
    // 重新请求
    currentFlowConfig && currentFlowConfig === "success" && refreshFlowConfig()
  }, [currentFlowConfig])

  // 更新currentFlowConfig当flowConfig变化时
  useEffect(() => {
    setCurrentFlowConfig(flowConfig)
  }, [flowConfig])

  // 检测position为null的节点并自动调用自动布局
  useEffect(() => {
    if (
      currentFlowConfig &&
      currentFlowConfig.nodeCodes &&
      Array.isArray(currentFlowConfig.nodeCodes)
    ) {
      // 检查是否有position为null的节点
      const hasNullPositionNodes = currentFlowConfig.nodeCodes.some((node) => {
        return (
          node.position === null ||
          node.position === undefined ||
          (node.position && Object.keys(node.position).length === 0) || // 正确判断空对象
          (node.position &&
            (node.position?.x === null ||
              node.position?.y === null ||
              node.position?.x === undefined ||
              node.position?.y === undefined))
        )
      })

      if (hasNullPositionNodes) {
        // 延迟调用自动布局，确保Canvas组件已经完成初始化和坐标修复
        const timer = setTimeout(() => {
          if (canvasRef.current && canvasRef.current.autoLayout) {
            console.log("坐标修复完成，执行自动布局")
            canvasRef.current.autoLayout()
            // 显示自动布局提示
            setShowAutoLayoutTip(true)
          }
        }, 100) // 延迟100确保数据已加载和坐标修复完成

        return () => clearTimeout(timer)
      }
    }
  }, [currentFlowConfig])

  // 从Canvas组件获取最新的nodes和edges数据
  const handleNodesEdgesChange = useCallback(
    (newNodes, newEdges) => {
      if (isOnlyRead) return
      setNodes(newNodes)
      setEdges(newEdges)
    },
    [isOnlyRead]
  )

  // 处理保存按钮点击
  const handleSave = useCallback(async () => {
    if (!taskId || !botNo) {
      message.error("缺少必要参数，无法保存")
      return
    }

    if (nodes.length === 0) {
      message.warning("画布为空，请先添加节点")
      return
    }

    // 在保存前执行去重操作
    if (canvasRef.current && canvasRef.current.deduplicateEdges) {
      canvasRef.current.deduplicateEdges()
    }

    setIsSaving(true)

    try {
      // 转换nodes数据，处理tags
      const formattedNodes = nodes.map((node) => {
        const newNode = { ...node }

        // 如果有customerIntents，则使用它来生成tags
        if (newNode.data && newNode.data.customerIntents) {
          newNode.data.tags = newNode.data.customerIntents.map((intent) => ({
            code: intent?.intentionCode?.toString(),
            id: intent?.intentionCode?.toString(),
            label: intent?.intentionName,
            value: intent?.intentionCode?.toString()
          }))
        }

        // 确保节点包含content字段（话术内容）
        if (
          newNode.data &&
          newNode.data.selectedScriptIds &&
          newNode.data.selectedScriptIds.length > 0
        ) {
          // 如果content字段不存在，则从其他地方获取
          if (!newNode.data.content) {
            console.log("节点缺少content字段，将使用空字符串替代")
            newNode.data.content = ""
          }

          // 修正脚本ID字段，确保使用scriptId而不是taskScriptId
          if (newNode.data.scriptIds) {
            console.log("修正scriptIds字段，从taskScriptId转换为scriptId")
            // 这里我们不能直接修改，因为可能没有必要的数据
            // 如果需要转换，后端应该处理这种情况
          }
        }

        return newNode
      })

      // 对节点进行排序：开场白节点排在第一位
      const sortedNodes = [...formattedNodes].sort((a, b) => {
        // 如果a是开场白节点，排在前面
        if (a.data?.isPrologue && !b.data?.isPrologue) {
          return -1
        }
        // 如果b是开场白节点，排在前面
        if (!a.data?.isPrologue && b.data?.isPrologue) {
          return 1
        }
        // 如果都是或都不是开场白节点，保持原有顺序
        return 0
      })

      // 对edges进行去重处理，确保不会有重复id的边数据
      const uniqueEdges = []
      const edgeMap = new Map()

      // 先过滤掉无效的边数据，再进行去重处理
      const validEdges = edges.filter((edge) => {
        const isValid =
          edge &&
          edge.source &&
          edge.target &&
          edge.source !== null &&
          edge.target !== null &&
          edge.source !== "" &&
          edge.target !== "" &&
          edge.source !== undefined &&
          edge.target !== undefined &&
          typeof edge.source === "string" &&
          typeof edge.target === "string" &&
          edge.source.trim() !== "" &&
          edge.target.trim() !== "" &&
          edge.id &&
          !edge.id.endsWith("-") // 过滤掉ID以"-"结尾的异常边数据
        if (!isValid) {
          console.warn("发现无效的边数据，保存时将被过滤掉:", edge)
        }
        return isValid
      })

      // 遍历所有有效的边，保留id相同的最后一条记录（最新的）
      validEdges.forEach((edge) => {
        edgeMap.set(edge.id, edge)
      })

      // 从Map中提取所有唯一的边
      edgeMap.forEach((edge) => {
        uniqueEdges.push(edge)
      })

      console.log(
        `原始边数量: ${edges.length}, 有效边数量: ${validEdges.length}, 去重后边数量: ${uniqueEdges.length}`
      )

      // 如果发现有无效或重复的边，输出警告日志
      if (validEdges.length < edges.length) {
        console.warn(`发现并移除了 ${edges.length - validEdges.length} 条无效的边连接`)
      }
      if (uniqueEdges.length < validEdges.length) {
        console.warn(`发现并移除了 ${validEdges.length - uniqueEdges.length} 条重复的边连接`)
      }

      // 处理边数据，将intentionRule字段从data中提取到顶层
      const processedEdges = uniqueEdges.map((edge) => {
        const { data, ...edgeWithoutData } = edge
        const { onDeleteEdge, onUpdateEdgeRule, flowType, showAllRules, ...cleanData } = data || {}

        // 将intentionRule提取到顶层
        const processedEdge = {
          ...edgeWithoutData,
          ...cleanData
        }

        // 如果有intentionRule，确保它在顶层
        if (data?.intentionRule) {
          processedEdge.intentionRule = data.intentionRule
        }

        return processedEdge
      })

      const params = {
        botNo,
        taskId,
        nodeCodes: sortedNodes,
        relationship: processedEdges, // 使用处理后的边数据
        // 添加话术内容标记，表示前端已发送话术内容
        includeScriptContent: true
      }

      const res = await saveFlowConfig(params)

      if (res.status === 200) {
        message.success("画布保存成功")
        // 保存成功后重置草稿状态
        setIsDraft(false)
        // 隐藏自动布局提示
        setShowAutoLayoutTip(false)

        // 更新Canvas组件的保存点
        if (canvasRef.current && canvasRef.current.updateSavePoint) {
          canvasRef.current.updateSavePoint()
        }
      } else {
        message.error(res.message || "保存失败")
      }
    } catch (error) {
      console.error("保存画布失败:", error)
      message.error("保存失败，请稍后重试")
    } finally {
      setIsSaving(false)
    }
  }, [botNo, taskId, nodes, edges, saveFlowConfig])

  // 处理保存完成的回调
  const handleSaveComplete = useCallback(() => {
    setShowAutoLayoutTip(false)
  }, [])

  // 处理属性配置按钮点击
  const handlePropertyConfigClick = useCallback(() => {
    setPropertyDrawerOpen(true)
  }, [])

  // 当嵌入模式时，使用外部传入的状态和方法
  const actualSaveLoading = isEmbedded ? embeddedSaveLoading : isSaving
  const actualIsDraft = isEmbedded ? embeddedIsDraft : isDraft
  const actualShowAutoLayoutTip = isEmbedded ? embeddedShowAutoLayoutTip : showAutoLayoutTip
  const actualSaveHandler = isEmbedded ? onEmbeddedSave : handleSave

  // 暴露方法给外部（用于嵌入模式）
  useEffect(() => {
    if (isEmbedded && onSaveMethodReady) {
      // 将内部的保存方法传递给外部
      onSaveMethodReady(handleSave)
    }
  }, [isEmbedded, onSaveMethodReady, handleSave])

  // 监听草稿状态变化并通知外部（仅在嵌入模式下）
  useEffect(() => {
    if (isEmbedded && onDraftStatusChange) {
      onDraftStatusChange(isDraft)
    }
  }, [isEmbedded, isDraft, onDraftStatusChange])

  // 监听自动布局提示状态变化并通知外部（仅在嵌入模式下）
  useEffect(() => {
    if (isEmbedded && onAutoLayoutTipChange) {
      onAutoLayoutTipChange(showAutoLayoutTip)
    }
  }, [isEmbedded, showAutoLayoutTip, onAutoLayoutTipChange])

  return (
    <div className={!isEmbedded ? "voice-flow-container" : "voice-flow-container-embedded"}>
      {/* 当 isEmbedded 为 true 时隐藏 Header */}
      {!isEmbedded && (
        <Header
          taskName={taskName}
          taskId={taskId}
          botNo={botNo}
          agentNo={agentNo}
          status={status}
          flowType={flowType}
          onSave={handleSave}
          loading={isSaving}
          isDraft={isDraft}
          showAutoLayoutTip={showAutoLayoutTip}
          onSaveComplete={handleSaveComplete}
          setCurrentFlowConfig={setCurrentFlowConfig}
          onPropertyConfigClick={handlePropertyConfigClick}
          isOnlyRead={isOnlyRead}
        />
      )}
      <div className="voice-flow-canvas">
        <ReactFlowProvider>
          <Canvas
            flowConfig={currentFlowConfig}
            taskId={taskId}
            botNo={botNo}
            isEmbedded={isEmbedded}
            onNodesEdgesChange={handleNodesEdgesChange}
            onDraftStatusChange={setIsDraft}
            flowType={flowType}
            ref={canvasRef}
            isOnlyRead={isOnlyRead}
          />
        </ReactFlowProvider>
      </div>
      {/* 属性配置抽屉 */}
      <PropertyConfigDrawer
        open={propertyDrawerOpen}
        onClose={() => setPropertyDrawerOpen(false)}
      />
    </div>
  )
}

export default VoiceFlow
