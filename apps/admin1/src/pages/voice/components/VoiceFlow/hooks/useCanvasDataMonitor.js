import { useEffect, useCallback } from "react"

/**
 * 自定义钩子，用于监听画布数据变化
 * 将数据监听相关的逻辑封装在一起，提高代码可维护性
 */
export const useCanvasDataMonitor = ({
  nodes,
  edges,
  onNodesEdgesChange,
  onDraftStatusChange,
  isInitialized,
  isDragging,
  isAutoFittingRef,
  isFirstLoadRef,
  checkForChanges,
  setIsDraft,
  setEdges,
  setNodes
}) => {
  // 处理挂机节点相关的边
  const handleHangupNodeEdges = useCallback(() => {
    // 检查是否有标记为需要删除边的节点
    const nodesNeedRemoveEdges = nodes.filter((node) => node.data?.shouldRemoveEdges)

    if (nodesNeedRemoveEdges.length > 0) {
      // 找出需要删除的所有边
      const nodeIds = nodesNeedRemoveEdges.map((node) => node.id)

      // 过滤掉与这些节点相关的边
      const filteredEdges = edges.filter((edge) => {
        return !nodeIds.includes(edge.source)
      })

      // 更新边数据
      if (filteredEdges.length !== edges.length) {
        console.log("检测到挂机节点，删除相关边:", edges.length - filteredEdges.length)
        setEdges(filteredEdges)

        // 清除节点的shouldRemoveEdges标记并更新节点
        const updatedNodes = nodes.map((node) => {
          if (node.data?.shouldRemoveEdges) {
            return {
              ...node,
              data: {
                ...node.data,
                shouldRemoveEdges: false
              }
            }
          }
          return node
        })

        // 更新节点状态
        setNodes(updatedNodes)
        return true
      }
    }
    return false
  }, [nodes, edges, setEdges, setNodes])

  // 监听并处理节点和边的变化
  useEffect(() => {
    console.log("=== 画布数据更新 ===")
    console.log("节点数据:", nodes)
    console.log("边数据:", edges)

    // 处理挂机节点的边
    const nodesUpdated = handleHangupNodeEdges()
    if (nodesUpdated) {
      // 如果有节点更新，直接返回，不进行后续处理
      // 下一次useEffect会再次执行
      return
    }

    // 检查是否有数据变化，更新草稿状态
    // 只有在初始化完成且不是由自动适配视图导致的变化时才检查
    // 并且不在拖动节点过程中
    if (isInitialized && !isAutoFittingRef.current && !isDragging) {
      // 如果是首次加载状态，且检测到变化，说明用户进行了实际操作
      const hasChanges = checkForChanges()

      if (isFirstLoadRef.current && hasChanges) {
        isFirstLoadRef.current = false
      }

      // 只有在不是首次加载状态时，才更新草稿状态
      if (!isFirstLoadRef.current) {
        setIsDraft(hasChanges)

        // 通知父组件草稿状态变化
        if (onDraftStatusChange) {
          onDraftStatusChange(hasChanges)
        }
      }
    }

    // 向父组件传递最新的nodes和edges数据
    if (onNodesEdgesChange) {
      // 过滤掉空节点（content为空且tags为空数组的节点）
      const filteredNodes = nodes.filter((node) => {
        const nodeData = node.data || {}
        // 判断节点是否为空节点：content为空且tags为空数组
        const isEmpty = !nodeData.content && (!nodeData.tags || nodeData.tags.length === 0)
        return !isEmpty // 只保留非空节点
      })

      onNodesEdgesChange(filteredNodes, edges)
    }
  }, [
    nodes,
    edges,
    onNodesEdgesChange,
    onDraftStatusChange,
    isInitialized,
    isDragging,
    isAutoFittingRef,
    isFirstLoadRef,
    checkForChanges,
    setIsDraft,
    handleHangupNodeEdges
  ])
}

export default useCanvasDataMonitor
