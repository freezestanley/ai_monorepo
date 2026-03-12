import { useMemo } from "react"

// 高亮和透明度样式常量
const highlightStyle = {
  opacity: 1,
  stroke: "rgba(127, 86, 217, 1)",
  strokeWidth: 1.5,
  strokeDasharray: "15, 5",
  animation: "flowAnimation 1s linear infinite",
  boxShadow: "0 0 10px 0 rgba(127, 86, 217, 0.3)"
}

const nodeHighlightClassname = "node-highlighted"

const dimStyle = { opacity: 0.6 }

/**
 * 自定义钩子，用于管理画布元素的样式和高亮
 * 将样式处理逻辑封装在一起，提高代码可维护性和性能
 */
export const useCanvasStyles = ({
  nodes,
  edges,
  hoveredNodeId,
  selectedEdgeId,
  handleDeleteEdge,
  handleDeleteNode,
  handleTagAdd,
  onDrawerClose,
  flowType,
  handleUpdateEdgeRule
}) => {
  // 处理节点高亮逻辑
  const nodesWithHighlight = useMemo(() => {
    if (!hoveredNodeId) return nodes

    // 找出与悬停节点相关的所有边
    const connectedNodeIds = new Set([hoveredNodeId])
    edges.forEach((edge) => {
      if (edge.source === hoveredNodeId) {
        connectedNodeIds.add(edge.target)
      } else if (edge.target === hoveredNodeId) {
        connectedNodeIds.add(edge.source)
      }
    })

    // 为节点添加样式和类名
    return nodes.map((node) => ({
      ...node,
      className: connectedNodeIds.has(node.id) ? nodeHighlightClassname : "",
      data: {
        ...node.data,
        isHighlighted: connectedNodeIds.has(node.id),
        onDeleteNode: handleDeleteNode,
        onTagAdd: (newTags) => handleTagAdd(node.id, newTags),
        onCloseDrawer: onDrawerClose
      },
      style: {
        ...node.style,
        ...(connectedNodeIds.has(node.id) ? {} : dimStyle)
      }
    }))
  }, [nodes, edges, hoveredNodeId, handleDeleteNode, handleTagAdd, onDrawerClose])

  // 处理边高亮逻辑
  const edgesWithHighlight = useMemo(() => {
    // 根据悬停节点或选中边更新边的样式
    if (!hoveredNodeId && !selectedEdgeId) return edges

    // 为边添加样式和删除回调函数
    return edges.map((edge) => ({
      ...edge,
      selected: edge.id === selectedEdgeId,
      type: edge.type || (flowType === 2 ? "default" : "smoothstep"), // 工作流模式使用smoothstep，状态机使用default
      data: {
        ...edge.data,
        onDeleteEdge: handleDeleteEdge,
        onUpdateEdgeRule: handleUpdateEdgeRule,
        flowType // 添加flowType到边数据中
      },
      style: {
        ...edge.style,
        ...(hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)
          ? highlightStyle
          : edge.id === selectedEdgeId
            ? highlightStyle
            : dimStyle)
      }
    }))
  }, [edges, hoveredNodeId, selectedEdgeId, handleDeleteEdge, handleUpdateEdgeRule, flowType])

  // 优化：缓存节点对象创建逻辑
  const preparedNodes = useMemo(() => {
    if (hoveredNodeId) {
      return nodesWithHighlight.map((node) => ({
        ...node,
        isPrologue: node.isPrologue,
        data: {
          ...node.data,
          onCloseDrawer: onDrawerClose
        }
      }))
    }

    return nodes.map((node) => ({
      ...node,
      id: node.id,
      isPrologue: node.isPrologue,
      data: {
        ...node.data,
        onDeleteNode: handleDeleteNode,
        onTagAdd: (newTags) => handleTagAdd(node.id, newTags),
        onCloseDrawer: onDrawerClose
      }
    }))
  }, [nodes, hoveredNodeId, nodesWithHighlight, handleDeleteNode, handleTagAdd, onDrawerClose])

  // 优化：缓存边对象创建逻辑
  const preparedEdges = useMemo(() => {
    if (hoveredNodeId || selectedEdgeId) {
      return edgesWithHighlight
    }

    return edges.map((edge) => ({
      ...edge,
      type: edge.type || (flowType === 2 ? "default" : "smoothstep"),
      data: {
        ...edge.data,
        onDeleteEdge: handleDeleteEdge,
        onUpdateEdgeRule: handleUpdateEdgeRule,
        flowType // 添加flowType到边数据中
      }
    }))
  }, [
    edges,
    hoveredNodeId,
    selectedEdgeId,
    edgesWithHighlight,
    handleDeleteEdge,
    handleUpdateEdgeRule,
    flowType
  ])

  // 流动动画CSS
  const flowAnimationStyle = `
    @keyframes flowAnimation {
      0% {
        stroke-dashoffset: 20;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }
  `

  return {
    preparedNodes,
    preparedEdges,
    flowAnimationStyle,
    highlightStyle,
    dimStyle,
    nodeHighlightClassname
  }
}

export default useCanvasStyles
