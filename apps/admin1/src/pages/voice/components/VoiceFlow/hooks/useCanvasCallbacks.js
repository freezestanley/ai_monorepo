import { useCallback } from "react"
import { useReactFlow } from "reactflow"

/**
 * 自定义钩子，用于管理画布的事件回调
 * 将事件处理函数封装在一起，提高代码可维护性
 */
export const useCanvasCallbacks = ({
  nodes,
  setNodes,
  setSelectedNode,
  setDrawerOpen,
  handleDeleteEdge,
  handleDeleteNode,
  selectedNode,
  selectedEdgeId,
  setSelectedEdgeId,
  setHoveredNodeId,
  isFirstLoadRef,
  setIsDragging,
  checkForChanges,
  setIsDraft,
  onDraftStatusChange,
  flowType,
  isOnlyRead
}) => {
  const reactFlowInstance = useReactFlow()

  // 节点点击事件处理
  const onNodeClick = useCallback(
    (event, node) => {
      // 用户点击了节点，可能要编辑，标记为非首次加载状态
      isFirstLoadRef.current = false

      // 清除所有节点的选中状态
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === node.id, // 只设置当前点击的节点为选中状态
          data: {
            ...n.data,
            isHighlighted: n.id === node.id // 同时设置高亮状态
          }
        }))
      )

      // 确保节点数据中包含nodeId（如果存在）
      const nodeWithId = {
        ...node,
        data: {
          ...node.data,
          nodeId: node.nodeId || node.data?.nodeId // 优先使用节点自身的nodeId，其次使用data中的nodeId
        }
      }

      setSelectedNode(nodeWithId)
      setDrawerOpen(true)
    },
    [setNodes, setSelectedNode, setDrawerOpen, isFirstLoadRef]
  )

  // 边点击事件处理
  const onEdgeClick = useCallback(
    (event, edge) => {
      setSelectedEdgeId(edge.id)
    },
    [setSelectedEdgeId]
  )

  // 边双击事件处理
  const onEdgeDoubleClick = useCallback(
    (event, edge) => {
      // 状态机模式下禁用双击删除连接线
      if (flowType !== 2) {
        // 直接删除边，无需额外确认
        handleDeleteEdge(edge.id)
      }
    },
    [handleDeleteEdge, flowType]
  )

  // 背景点击事件处理
  const onPaneClick = useCallback(() => {
    setSelectedEdgeId(null)
  }, [setSelectedEdgeId])

  // 节点鼠标悬停事件处理
  const onNodeMouseEnter = useCallback(
    (event, node) => {
      setHoveredNodeId(node.id)
    },
    [setHoveredNodeId]
  )

  // 节点鼠标离开事件处理
  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null)
  }, [setHoveredNodeId])

  // 抽屉关闭事件处理
  const onDrawerClose = useCallback(() => {
    setDrawerOpen(false)

    // 清除所有节点的选中状态
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
        data: {
          ...node.data,
          isHighlighted: false // 同时清除高亮状态
        }
      }))
    )

    setSelectedNode(null)
  }, [setNodes, setSelectedNode, setDrawerOpen])

  // 键盘事件处理
  const onKeyDown = useCallback(
    (event) => {
      if (isOnlyRead) return
      // 检查事件目标是否为表单元素
      const isFormElement =
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "SELECT"

      // 如果抽屉正在打开或事件发生在表单元素内部，则不处理删除键事件
      if (isFormElement) {
        return
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        // 如果有选中的边，删除边（状态机模式下禁用）
        if (selectedEdgeId && flowType !== 2) {
          console.log(`通过键盘删除连接线: ${selectedEdgeId}`)
          handleDeleteEdge(selectedEdgeId)
          return
        }

        // 如果有选中的节点，删除节点
        if (selectedNode) {
          console.log(`通过键盘删除节点: ${selectedNode.id}`)
          handleDeleteNode(selectedNode.id)
          setDrawerOpen(false)
          setSelectedNode(null)
        }
      }
    },
    [
      selectedNode,
      selectedEdgeId,
      handleDeleteEdge,
      handleDeleteNode,
      setDrawerOpen,
      setSelectedNode,
      flowType,
      isOnlyRead
    ]
  )

  // 拖拽事件处理
  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"

    // 清除所有高亮效果
    document.querySelectorAll(".react-flow__node, .react-flow__edge").forEach((el) => {
      el.classList.remove("rf-highlight", "rf-dim")
    })
  }, [])

  // 节点拖动开始事件处理
  const onNodeDragStart = useCallback(() => {
    setIsDragging(true)
    // 用户拖动了节点，标记为非首次加载状态
    isFirstLoadRef.current = false
    // 启用节点拖动模式，关闭一些可能影响性能的效果
    document.body.classList.add("node-dragging")
  }, [setIsDragging, isFirstLoadRef])

  // 节点拖动结束事件处理
  const onNodeDragStop = useCallback(() => {
    setIsDragging(false)
    // 关闭节点拖动模式
    document.body.classList.remove("node-dragging")

    // 手动触发一次草稿状态检查
    setTimeout(() => {
      const hasChanges = checkForChanges()

      // 更新草稿状态
      setIsDraft(hasChanges)

      // 通知父组件草稿状态变化
      if (onDraftStatusChange) {
        onDraftStatusChange(hasChanges)
      }
    }, 10)
  }, [checkForChanges, onDraftStatusChange, setIsDragging, setIsDraft])

  // 连接验证
  const isValidConnection = useCallback(
    (connection) => {
      // 检查是否是标签到标签的连接
      const isSourceTag = connection.sourceHandle && connection.sourceHandle.includes("handle-")
      const isTargetTag = connection.targetHandle && connection.targetHandle.includes("handle-")

      // 检查是否是自循环
      const isSelfLoop = connection.source === connection.target

      // 检查源节点和目标节点是否存在
      const sourceNode = nodes.find((node) => node.id === connection.source)
      const targetNode = nodes.find((node) => node.id === connection.target)

      // 如果是标签到标签的连接，不允许
      if (isSourceTag && isTargetTag) return false

      // 不允许自循环
      if (isSelfLoop) return false

      // 如果源节点或目标节点不存在，不允许连接
      if (!sourceNode || !targetNode) return false

      return true
    },
    [nodes]
  )

  // 适配画布内容到视图
  const fitViewToContent = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({
        padding: 0.2,
        includeHiddenNodes: false,
        minZoom: 0.5,
        maxZoom: 1.5,
        duration: 400
      })
    }
  }, [reactFlowInstance])

  return {
    onNodeClick,
    onEdgeClick,
    onEdgeDoubleClick,
    onPaneClick,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onDrawerClose,
    onKeyDown,
    onDragOver,
    onNodeDragStart,
    onNodeDragStop,
    isValidConnection,
    fitViewToContent
  }
}

export default useCanvasCallbacks
