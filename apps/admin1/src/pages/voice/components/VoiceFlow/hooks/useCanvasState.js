import { useState, useCallback, useRef, useEffect } from "react"
import { useNodesState, useEdgesState, addEdge } from "reactflow"

// 生成唯一ID的工具函数
let id = 0
export const getId = () => `node_${id++}`

/**
 * 自定义钩子，用于管理画布的状态
 * 将相关的状态和处理函数封装在一起，提高代码可维护性
 */
export const useCanvasState = ({ onDraftStatusChange, onNodesEdgesChange }) => {
  // 节点和边的状态
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // 其他UI状态
  const [selectedNode, setSelectedNode] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // 引用值
  const initialDataHashRef = useRef(null)
  const isFirstLoadRef = useRef(true)
  const isAutoFittingRef = useRef(false)
  const reactFlowWrapper = useRef(null)

  // 删除边的处理函数
  const handleDeleteEdge = useCallback(
    (edgeId) => {
      console.log(`删除连接线: ${edgeId}`)
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
      setSelectedEdgeId(null) // 清除选中状态
    },
    [setEdges]
  )

  // 更新边规则的处理函数
  const handleUpdateEdgeRule = useCallback(
    (edgeId, intentionRule) => {
      console.log(`更新连接线规则: ${edgeId}, 规则: ${intentionRule}`)
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === edgeId ? { ...edge, data: { ...edge.data, intentionRule } } : edge
        )
      )
      // 标记为草稿状态
      setIsDraft(true)
      if (onDraftStatusChange) {
        onDraftStatusChange(true)
      }
    },
    [setEdges, setIsDraft, onDraftStatusChange]
  )

  // 处理连接创建
  const onConnect = useCallback(
    (params) => {
      // 用户创建了连接，标记为非首次加载状态
      isFirstLoadRef.current = false

      // 检查是否是标签到标签的连接
      const isSourceTag = params.sourceHandle && params.sourceHandle.includes("handle-")
      const isTargetTag = params.targetHandle && params.targetHandle.includes("handle-")

      // 检查是否是环形连接（自循环）
      const isSelfLoop = params.source === params.target

      // 验证连接规则
      if (isSourceTag && isTargetTag) {
        alert("不允许在两个标签之间创建连接")
        return // 不创建连接
      }

      // 禁止自循环连接
      if (isSelfLoop) {
        alert("不允许创建连接到同一节点的循环")
        return // 不创建连接
      }

      // 检查源节点和目标节点是否存在
      const sourceNode = nodes.find((node) => node.id === params.source)
      const targetNode = nodes.find((node) => node.id === params.target)

      if (!sourceNode || !targetNode) {
        return
      }

      // 确保handle存在，如果不存在则使用默认值
      const sourceHandle = params.sourceHandle || null
      const targetHandle = params.targetHandle || null

      // 使用自定义边类型
      const newEdge = {
        ...params,
        sourceHandle,
        targetHandle,
        type: "custom",
        data: { onDeleteEdge: handleDeleteEdge }
      }

      setEdges((eds) => {
        const edgeWithSameParams = eds.find(
          (e) =>
            e.source === params.source &&
            e.target === params.target &&
            e.sourceHandle === sourceHandle &&
            e.targetHandle === targetHandle
        )

        // 如果已经存在相同参数的边，则不添加新边
        if (edgeWithSameParams) {
          console.warn("已存在相同的连接，不重复添加", edgeWithSameParams)
          return eds
        }

        // 添加新边
        return addEdge(newEdge, eds)
      })
    },
    [setEdges, handleDeleteEdge, nodes]
  )

  // 检查是否有未保存的更改
  const checkForChanges = useCallback(() => {
    if (!initialDataHashRef.current || isFirstLoadRef.current) return false

    // 创建一个用于比较的节点数据副本，只保留关键属性并对位置进行取整处理
    const nodesToCompare = nodes.map((node) => {
      // 对位置坐标进行取整，忽略小数部分的微小变化
      const roundedPosition = node.position
        ? {
            x: Math.round(node.position.x),
            y: Math.round(node.position.y)
          }
        : node.position

      return {
        id: node.id,
        position: roundedPosition,
        data: {
          nodeName: node.data?.nodeName,
          content: node.data?.content,
          tags: node.data?.tags,
          isMounted: node.data?.isMounted,
          ctiOrder: node.data?.ctiOrder,
          selectedScriptIds: node.data?.selectedScriptIds,
          scriptIds: node.data?.scriptIds,
          nodeId: node.data?.nodeId,
          customerIntents: node.data?.customerIntents
        }
      }
    })

    // 创建一个用于比较的边数据副本，只保留关键属性
    const edgesToCompare = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }))

    // 计算当前数据的JSON字符串
    const currentNodesJson = JSON.stringify(nodesToCompare)
    const currentEdgesJson = JSON.stringify(edgesToCompare)

    // 检查是否有更改
    const nodesChanged = initialDataHashRef.current.nodes !== currentNodesJson
    const edgesChanged = initialDataHashRef.current.edges !== currentEdgesJson
    const hasChanges = nodesChanged || edgesChanged

    return hasChanges
  }, [nodes, edges])

  // 更新保存点的方法 - 在保存成功后调用
  const updateSavePoint = useCallback(() => {
    // 创建一个用于比较的节点数据副本，只保留关键属性并对位置进行取整处理
    const nodesToCompare = nodes.map((node) => {
      // 对位置坐标进行取整，忽略小数部分的微小变化
      const roundedPosition = node.position
        ? {
            x: Math.round(node.position.x),
            y: Math.round(node.position.y)
          }
        : node.position

      return {
        id: node.id,
        position: roundedPosition,
        data: {
          nodeName: node.data?.nodeName,
          content: node.data?.content,
          tags: node.data?.tags,
          isMounted: node.data?.isMounted,
          ctiOrder: node.data?.ctiOrder,
          selectedScriptIds: node.data?.selectedScriptIds,
          scriptIds: node.data?.scriptIds,
          nodeId: node.data?.nodeId,
          customerIntents: node.data?.customerIntents
        }
      }
    })

    // 创建一个用于比较的边数据副本，只保留关键属性
    const edgesToCompare = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }))

    // 更新初始数据快照
    initialDataHashRef.current = {
      nodes: JSON.stringify(nodesToCompare),
      edges: JSON.stringify(edgesToCompare)
    }

    // 重置草稿状态
    setIsDraft(false)
    // 确保不再是首次加载状态
    isFirstLoadRef.current = false

    // 通知父组件草稿状态变化
    if (onDraftStatusChange) {
      onDraftStatusChange(false)
    }
  }, [nodes, edges, onDraftStatusChange])

  // 删除节点的处理函数
  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))

      // 删除与该节点相关的所有边
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    },
    [setNodes, setEdges]
  )

  // 处理标签添加
  const handleTagAdd = useCallback(
    (nodeId, newTags) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                tags: newTags
              }
            }
          }
          return node
        })
      )
    },
    [setNodes]
  )

  // 添加节点数据更新处理函数
  const handleNodeUpdate = useCallback(
    (nodeId, updatedData) => {
      // 用户更新了节点数据，标记为非首次加载状态
      isFirstLoadRef.current = false

      // 检查是否需要清除选中状态
      const shouldClearSelection = updatedData.shouldClearSelection

      // 记录节点ID更新
      console.log(`节点数据更新 - 节点ID: ${nodeId}, 后端返回的nodeId: ${updatedData.nodeId}`)

      // 检查是否有节点ID更新（状态机模式下子节点ID更新）
      const hasNodeIdUpdate = updatedData.newNodeId && updatedData.oldNodeId
      const oldNodeId = hasNodeIdUpdate ? updatedData.oldNodeId : null

      console.log("节点ID更新检查:", {
        hasNodeIdUpdate,
        oldNodeId,
        newNodeId: nodeId,
        updatedDataNewNodeId: updatedData.newNodeId
      })

      // 在更新节点之前，检查客户意图(tags)的变化，并清理相关连接线
      // 如果有节点ID更新，使用旧ID查找节点；否则使用当前ID
      const currentNode = nodes.find((node) => node.id === (oldNodeId || nodeId))
      if (currentNode && updatedData.tags !== undefined) {
        const oldTags = currentNode.data?.tags || []
        const newTags = updatedData.tags || []

        // 找出被删除的标签
        const deletedTags = oldTags.filter(
          (oldTag) =>
            !newTags.find((newTag) => newTag.id === oldTag.id || newTag.value === oldTag.value)
        )

        if (deletedTags.length > 0) {
          const checkNodeId = oldNodeId || nodeId // 如果有ID更新，使用旧ID检查
          console.log(
            `检测到节点 ${checkNodeId} 删除了 ${deletedTags.length} 个客户意图:`,
            deletedTags
          )

          // 删除与这些标签相关的连接线
          setEdges((currentEdges) => {
            const filteredEdges = currentEdges.filter((edge) => {
              // 检查边的sourceHandle是否对应被删除的标签
              if (edge.source === checkNodeId && edge.sourceHandle) {
                const isDeletedTag = deletedTags.some((deletedTag) => {
                  // 检查多种可能的handle格式
                  return (
                    edge.sourceHandle === `handle-${deletedTag.id}` ||
                    edge.sourceHandle === `handle-${deletedTag.value}` ||
                    edge.sourceHandle === `handle-${deletedTag.code}` ||
                    edge.sourceHandle === deletedTag.id ||
                    edge.sourceHandle === deletedTag.value ||
                    edge.sourceHandle === deletedTag.code
                  )
                })

                if (isDeletedTag) {
                  console.log(`删除与标签相关的连接线: ${edge.id}`)
                  return false // 过滤掉这条边
                }
              }
              return true // 保留这条边
            })

            return filteredEdges
          })
        }
      }

      // 如果有节点ID更新，需要同时更新相关的边
      if (hasNodeIdUpdate) {
        console.log(`更新与节点ID相关的边: ${oldNodeId} -> ${nodeId}`)
        setEdges((currentEdges) => {
          return currentEdges.map((edge) => {
            let updatedEdge = { ...edge }

            // 更新source
            if (edge.source === oldNodeId) {
              updatedEdge.source = nodeId
            }

            // 更新target
            if (edge.target === oldNodeId) {
              updatedEdge.target = nodeId
            }

            // 更新edge id（如果edge id包含了节点ID）
            if (edge.id.includes(oldNodeId)) {
              updatedEdge.id = edge.id.replace(oldNodeId, nodeId)
            }

            console.log(`边更新: ${edge.id} -> ${updatedEdge.id}`)
            return updatedEdge
          })
        })
      }

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === (oldNodeId || nodeId)) {
            // 保留原有的回调函数
            const callbacks = {
              onTagAdd: node.data.onTagAdd,
              onDeleteNode: node.data.onDeleteNode,
              onNodeRemove: node.data.onNodeRemove,
              onConnection: node.data.onConnection,
              onConnectStart: node.data.onConnectStart,
              onConnectEnd: node.data.onConnectEnd,
              onRemoveConnection: node.data.onRemoveConnection,
              registerEdgesDeleteHandler: node.data.registerEdgesDeleteHandler,
              unregisterEdgesDeleteHandler: node.data.unregisterEdgesDeleteHandler
            }

            // 从更新数据中移除清除选中的标记和开场白清除标记以及新节点ID标记
            const {
              shouldClearSelection: _,
              clearOtherPrologues: __,
              isPrologue: ___,
              newNodeId: ____,
              oldNodeId: _____,
              ...cleanedData
            } = updatedData

            return {
              ...node,
              id: nodeId, // 更新节点ID
              selected: shouldClearSelection ? false : node.selected, // 如果需要，清除选中状态
              isPrologue:
                updatedData.isPrologue !== undefined ? updatedData.isPrologue : node.isPrologue, // 在节点根级别设置isPrologue
              data: {
                ...cleanedData,
                isHighlighted: shouldClearSelection ? false : node.data.isHighlighted, // 同时清除高亮状态
                ...callbacks
              }
            }
          } else if (updatedData.clearOtherPrologues && updatedData.isPrologue) {
            // 如果当前节点设置为开场白，清除其他节点的开场白状态
            return {
              ...node,
              isPrologue: false // 在节点根级别清除isPrologue
            }
          }
          return node
        })
      )

      // 如果节点被保存且需要清除选中状态，清除selectedNode状态
      if (shouldClearSelection && selectedNode && selectedNode.id === (oldNodeId || nodeId)) {
        setSelectedNode(null)
      } else if (hasNodeIdUpdate && selectedNode && selectedNode.id === oldNodeId) {
        // 如果节点ID更新了，同时更新selectedNode
        setSelectedNode((prevSelected) => ({
          ...prevSelected,
          id: nodeId
        }))
      }
    },
    [setNodes, selectedNode, nodes, setEdges]
  )

  // 创建一个定期去重edges的函数
  const deduplicateEdges = useCallback(() => {
    setEdges((currentEdges) => {
      const uniqueEdges = []
      const edgeMap = new Map()

      // 遍历所有边，保留id相同的最后一条记录
      currentEdges.forEach((edge) => {
        edgeMap.set(edge.id, edge)
      })

      // 从Map中提取所有唯一的边
      edgeMap.forEach((edge) => {
        uniqueEdges.push(edge)
      })

      // 检查是否有重复的边被移除
      if (uniqueEdges.length < currentEdges.length) {
        console.warn(
          `Canvas内部去重: 发现并移除了 ${currentEdges.length - uniqueEdges.length} 条重复的边连接`
        )
      }

      return uniqueEdges
    })
  }, [setEdges])

  // 定期检查是否有重复的边
  useEffect(() => {
    // 只在边数量超过1时进行去重检查
    if (edges.length > 1) {
      const uniqueIds = new Set(edges.map((edge) => edge.id))

      // 如果有重复边，进行去重
      if (uniqueIds.size < edges.length) {
        deduplicateEdges()
      }
    }
  }, [edges, deduplicateEdges])

  return {
    // 状态
    nodes,
    edges,
    selectedNode,
    drawerOpen,
    isDraggingFromSidebar,
    hoveredNodeId,
    selectedEdgeId,
    isDragging,
    isDraft,
    isInitialized,
    initialDataHashRef,
    isFirstLoadRef,
    isAutoFittingRef,
    reactFlowWrapper,

    // 设置函数
    setNodes,
    setEdges,
    setSelectedNode,
    setDrawerOpen,
    setIsDraggingFromSidebar,
    setHoveredNodeId,
    setSelectedEdgeId,
    setIsDragging,
    setIsDraft,
    setIsInitialized,

    // 事件处理函数
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleDeleteEdge,
    handleUpdateEdgeRule,
    handleDeleteNode,
    handleTagAdd,
    handleNodeUpdate,
    checkForChanges,
    updateSavePoint,
    deduplicateEdges
  }
}

export default useCanvasState
