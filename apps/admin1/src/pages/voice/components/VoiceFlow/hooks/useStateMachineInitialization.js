import { useEffect, useCallback } from "react"
import { NODE_TYPES } from "../constants/canvasConstants"

/**
 * 状态机模式的初始化钩子
 * 负责处理状态机模式下的特殊初始化逻辑
 */
export const useStateMachineInitialization = ({
  flowType,
  flowConfig,
  setNodes,
  setEdges,
  isInitialized,
  setIsInitialized,
  reactFlowInstance,
  fitViewToContent,
  isAutoFittingRef,
  setIsDraft,
  onDraftStatusChange,
  isFirstLoadRef,
  initialDataHashRef,
  setSelectedNode,
  setDrawerOpen,
  handleDeleteEdge
}) => {
  // 获取节点实际高度的辅助函数
  const getNodeActualHeight = useCallback((nodeId) => {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`)
    if (nodeElement) {
      return nodeElement.offsetHeight
    }
    // 如果无法获取实际高度，返回预估值
    return 140
  }, [])

  // 重新排列同侧子节点位置的函数
  const rearrangeSideChildren = useCallback(
    (parentId, side, rootPosition, allNodes, excludeNodeId = null) => {
      // 获取同侧的所有子节点（排除指定节点）
      const sideChildren = allNodes.filter(
        (node) =>
          node.type === NODE_TYPES.STATE_MACHINE_CHILD &&
          node.data?.parentId === parentId &&
          node.data?.side === side &&
          node.id !== excludeNodeId
      )

      if (sideChildren.length === 0) return allNodes

      // 节点配置
      const nodeSpacing = 40 // 节点间距
      const minDistanceFromRoot = 80 // 距离根节点的最小距离

      let updatedNodes = [...allNodes]

      if (sideChildren.length === 1) {
        // 只有一个节点，放在根节点下方
        const targetY = rootPosition.y + minDistanceFromRoot
        updatedNodes = updatedNodes.map((node) =>
          node.id === sideChildren[0].id
            ? { ...node, position: { ...node.position, y: targetY } }
            : node
        )
      } else {
        // 多个节点，基于实际高度计算位置
        // 按当前Y坐标排序，保持相对顺序
        const sortedChildren = sideChildren.sort((a, b) => a.position.y - b.position.y)

        // 获取每个节点的实际高度
        const nodeHeights = sortedChildren.map((child) => getNodeActualHeight(child.id))

        // 计算所有节点的总高度（包括间距）
        const totalContentHeight = nodeHeights.reduce((sum, height) => sum + height, 0)
        const totalSpacingHeight = (sideChildren.length - 1) * nodeSpacing
        const totalHeight = totalContentHeight + totalSpacingHeight

        // 以根节点为中心，计算起始Y坐标
        const startY = rootPosition.y - totalHeight / 2

        // 逐个设置节点位置
        let currentY = startY
        sortedChildren.forEach((child, index) => {
          updatedNodes = updatedNodes.map((node) =>
            node.id === child.id ? { ...node, position: { ...node.position, y: currentY } } : node
          )
          // 下一个节点的Y坐标 = 当前节点Y + 当前节点高度 + 间距
          currentY += nodeHeights[index] + nodeSpacing
        })
      }

      return updatedNodes
    },
    [getNodeActualHeight]
  )

  // 处理编辑节点 - 允许根节点打开编辑抽屉，但会在抽屉中特殊处理
  const handleEditNode = useCallback(
    (nodeId) => {
      // 找到要编辑的节点
      setNodes((nodes) => {
        const nodeToEdit = nodes.find((node) => node.id === nodeId)

        if (nodeToEdit && setSelectedNode && setDrawerOpen) {
          setSelectedNode(nodeToEdit)
          setDrawerOpen(true)
        }
        return nodes // 不修改nodes数组
      })
    },
    [setNodes, setSelectedNode, setDrawerOpen]
  )

  // 处理删除节点
  const handleDeleteNode = useCallback(
    (nodeId) => {
      // 状态机模式下，如果是根节点（Start节点），禁止删除
      if (nodeId === "Start") {
        console.warn("根节点不能删除")
        return
      }

      setNodes((nodes) => {
        const nodeToDelete = nodes.find((node) => node.id === nodeId)

        // 删除节点
        const remainingNodes = nodes.filter((node) => node.id !== nodeId)

        // 如果删除的是子节点，需要重新排列同侧子节点
        if (nodeToDelete && nodeToDelete.type === NODE_TYPES.STATE_MACHINE_CHILD) {
          const { parentId, side } = nodeToDelete.data
          const rootNode = nodes.find((node) => node.id === parentId)

          if (rootNode) {
            // 重新排列剩余的同侧子节点
            return rearrangeSideChildren(parentId, side, rootNode.position, remainingNodes)
          }
        }

        return remainingNodes
      })

      setEdges((edges) => edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    },
    [setNodes, setEdges, rearrangeSideChildren]
  )

  // 处理添加子节点
  const handleAddChildNode = useCallback(
    (side) => {
      const newNodeId = `state_machine_child_${Date.now()}`

      // 获取当前根节点位置
      setNodes((currentNodes) => {
        // 找到状态机根节点
        const rootNode = currentNodes.find((node) => node.type === NODE_TYPES.STATE_MACHINE_ROOT)
        if (!rootNode) {
          console.error("未找到状态机根节点")
          return currentNodes
        }

        const rootNodePosition = rootNode.position
        const parentId = "Start" // 固定使用"Start"作为父节点ID

        // 获取同侧已有的子节点
        const samesideChildren = currentNodes.filter(
          (node) =>
            node.type === NODE_TYPES.STATE_MACHINE_CHILD &&
            node.data?.parentId === parentId &&
            node.data?.side === side
        )

        // 节点基础配置
        const nodeSpacing = 40 // 节点间距
        const minDistanceFromRoot = 80 // 距离根节点的最小距离
        const defaultNodeHeight = 140 // 新节点的预估高度

        // 计算新节点的Y坐标
        let newY

        if (samesideChildren.length === 0) {
          // 第一个同侧子节点
          newY = rootNodePosition.y + minDistanceFromRoot
        } else {
          // 基于现有节点的实际高度计算新节点位置
          // 获取现有节点的实际高度
          const existingNodeHeights = samesideChildren.map((child) => getNodeActualHeight(child.id))

          // 计算现有节点的总高度
          const existingContentHeight = existingNodeHeights.reduce((sum, height) => sum + height, 0)
          const existingSpacingHeight = (samesideChildren.length - 1) * nodeSpacing

          // 计算包含新节点的总高度
          const totalContentHeight = existingContentHeight + defaultNodeHeight
          const totalSpacingHeight = samesideChildren.length * nodeSpacing // 新增一个间距
          const totalHeight = totalContentHeight + totalSpacingHeight

          // 以根节点为中心，计算起始Y坐标
          const startY = rootNodePosition.y - totalHeight / 2

          // 新节点的Y坐标 = 起始Y + 所有现有节点高度 + 所有现有间距
          newY = startY + existingContentHeight + samesideChildren.length * nodeSpacing
        }

        // 计算新节点的X坐标 - 优先参考同侧现有节点的位置
        let newX
        if (samesideChildren.length > 0) {
          // 如果同侧已有节点，使用第一个同侧节点的x坐标保持对齐
          newX = samesideChildren[0].position.x
        } else {
          // 如果同侧没有节点，使用默认偏移量
          newX = side === "left" ? rootNodePosition.x - 400 : rootNodePosition.x + 400
        }

        const childPosition = {
          x: newX,
          y: newY
        }

        const childNode = {
          id: newNodeId,
          type: NODE_TYPES.STATE_MACHINE_CHILD,
          position: childPosition,
          data: {
            content: "",
            title: `子节点`,
            side: side,
            parentId: parentId,
            onEdit: handleEditNode,
            onDelete: handleDeleteNode
          },
          draggable: true,
          selectable: true
        }

        // 先添加新节点
        let updatedNodes = [...currentNodes, childNode]

        // 重新排列所有同侧子节点（包括新节点）
        updatedNodes = rearrangeSideChildren(parentId, side, rootNodePosition, updatedNodes)

        return updatedNodes
      })

      // 创建连接线 - 在setNodes外部处理，确保能获取到最新的节点信息
      setEdges((currentEdges) => {
        const newEdge = {
          id: `edge_Start_${newNodeId}`,
          source: "Start", // 使用固定的根节点ID
          target: newNodeId,
          sourceHandle: side, // 从根节点的对应side连接
          targetHandle: null, // 让子节点自动处理连接点
          type: "default", // 状态机使用默认边类型
          data: {
            onDeleteEdge: handleDeleteEdge,
            flowType: 2
          }
        }

        return [...currentEdges, newEdge]
      })
    },
    [setNodes, setEdges, handleEditNode, handleDeleteNode, rearrangeSideChildren, handleDeleteEdge]
  )

  // 创建根节点的函数
  const createStateMachineRootNode = useCallback(() => {
    const rootNode = {
      id: "Start", // 固定为Start
      type: NODE_TYPES.STATE_MACHINE_ROOT,
      position: { x: 400, y: 300 }, // 画布中心位置
      data: {
        content: "",
        title: "开场白",
        onAddChild: handleAddChildNode,
        onEdit: handleEditNode,
        onDelete: handleDeleteNode
      },
      draggable: true,
      selectable: true
    }
    return rootNode
  }, [handleAddChildNode, handleEditNode, handleDeleteNode])

  // 状态机模式的初始化
  useEffect(() => {
    if (flowType === 2) {
      // 如果已经有flowConfig，按正常流程初始化
      if (flowConfig && flowConfig.nodeCodes && flowConfig.nodeCodes.length > 0) {
        // 正常的数据初始化流程
        return
      }

      // 如果没有flowConfig或者是空的，创建默认的根节点
      const rootNode = createStateMachineRootNode()
      setNodes([rootNode])
      setEdges([])

      // 设置初始化完成
      setIsInitialized(true)
      setIsDraft(false)
      isFirstLoadRef.current = true

      // 存储初始数据快照
      initialDataHashRef.current = {
        nodes: JSON.stringify([rootNode]),
        edges: JSON.stringify([])
      }

      if (onDraftStatusChange) {
        onDraftStatusChange(false)
      }
    }
  }, [
    flowType,
    flowConfig,
    createStateMachineRootNode,
    setNodes,
    setEdges,
    setIsInitialized,
    setIsDraft,
    onDraftStatusChange,
    isFirstLoadRef,
    initialDataHashRef
  ])

  // 为从接口获取的状态机节点绑定回调函数
  useEffect(() => {
    if (flowType === 2 && flowConfig && flowConfig.nodeCodes && flowConfig.nodeCodes.length > 0) {
      setNodes((currentNodes) => {
        return currentNodes.map((node) => {
          // 为状态机根节点添加回调函数
          if (node.type === NODE_TYPES.STATE_MACHINE_ROOT) {
            return {
              ...node,
              data: {
                ...node.data,
                onAddChild: handleAddChildNode,
                onEdit: handleEditNode,
                onDelete: handleDeleteNode
              }
            }
          }
          // 为状态机子节点添加回调函数
          else if (node.type === NODE_TYPES.STATE_MACHINE_CHILD) {
            return {
              ...node,
              data: {
                ...node.data,
                onEdit: handleEditNode,
                onDelete: handleDeleteNode
              }
            }
          }
          return node
        })
      })
    }
  }, [flowType, flowConfig, handleAddChildNode, handleEditNode, handleDeleteNode, setNodes])

  // 状态机模式的视图适配
  useEffect(() => {
    if (flowType === 2 && isInitialized && reactFlowInstance) {
      isAutoFittingRef.current = true

      requestAnimationFrame(() => {
        setTimeout(() => {
          fitViewToContent()

          setTimeout(() => {
            isAutoFittingRef.current = false
          }, 1000)
        }, 100)
      })
    }
  }, [flowType, isInitialized, reactFlowInstance, fitViewToContent, isAutoFittingRef])

  return {
    handleAddChildNode,
    handleEditNode,
    handleDeleteNode
  }
}

export default useStateMachineInitialization
