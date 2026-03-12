import { useEffect } from "react"
import { NODE_TYPES } from "../constants/canvasConstants"

/**
 * 自定义钩子，用于管理画布的初始化
 * 将初始化相关的逻辑封装在一起，提高代码可维护性
 */
export const useCanvasInitialization = ({
  flowConfig,
  setNodes,
  setEdges,
  handleDeleteEdge,
  initialDataHashRef,
  setIsDraft,
  isFirstLoadRef,
  onDraftStatusChange,
  setIsInitialized,
  isInitialized,
  reactFlowInstance,
  fitViewToContent,
  isAutoFittingRef,
  flowType
}) => {
  // 修改初始化流程图数据的useEffect
  useEffect(() => {
    if (flowConfig && flowConfig.nodeCodes) {
      // 转换节点数据
      const initialNodes = flowConfig.nodeCodes.map((node) => {
        // 处理节点数据，确保格式正确
        let processedNode = {
          ...node,
          data: {
            ...node.data,
            // 确保tags存在
            tags: node.data?.tags || [],
            // 确保scriptIds字段也被保留和初始化
            scriptIds: node.data?.scriptIds || [],
            // 保留selectedScriptIds字段用于前端显示
            selectedScriptIds: node.data?.selectedScriptIds || [],
            // 保留nodeId字段，用于后续编辑节点
            nodeId: node.data?.nodeId || null
          }
        }

        // 状态机模式下，确保根节点ID为"Start"
        if (flowType === 2 && node.type === NODE_TYPES.STATE_MACHINE_ROOT) {
          processedNode.id = "Start"
        }

        // 状态机模式下，确保子节点的parentId指向"Start"
        if (flowType === 2 && node.type === NODE_TYPES.STATE_MACHINE_CHILD) {
          processedNode.data.parentId = "Start"
        }

        return processedNode
      })

      // 在工作流模式下，检查是否有开场白节点，如果没有则将第一个节点设为开场白
      if (flowType === 1 && initialNodes.length > 0) {
        const hasProlog = initialNodes.some((node) => node.isPrologue === true)

        if (!hasProlog) {
          // 如果没有开场白节点，将第一个节点设为开场白
          initialNodes[0] = {
            ...initialNodes[0],
            isPrologue: true // 设置在节点根级别，不是data下
          }
          console.log("工作流模式下未找到开场白节点，已将第一个节点设为开场白")
        }
      }

      // 设置初始节点
      setNodes(initialNodes)

      // 在状态机模式下特殊处理连接线
      if (flowType === 2) {
        // 状态机模式下，即使relationship为null，也要根据节点结构重建连接线
        const stateMarehineEdges = []

        // 查找根节点
        const rootNode = initialNodes.find((node) => node.type === NODE_TYPES.STATE_MACHINE_ROOT)

        if (rootNode) {
          // 查找所有子节点并重建连接线
          const childNodes = initialNodes.filter(
            (node) =>
              node.type === NODE_TYPES.STATE_MACHINE_CHILD && node.data?.parentId === rootNode.id
          )

          childNodes.forEach((child) => {
            const edge = {
              id: `edge_${rootNode.id}_${child.id}`,
              source: rootNode.id,
              target: child.id,
              sourceHandle: child.data?.side || "right", // 从子节点的side确定连接点
              targetHandle: null,
              type: "default", // 状态机使用默认边类型
              data: {
                onDeleteEdge: handleDeleteEdge,
                flowType: flowType
              }
            }
            stateMarehineEdges.push(edge)
          })
        }

        setEdges(stateMarehineEdges)

        // 存储初始数据的完整快照
        initialDataHashRef.current = {
          nodes: JSON.stringify(initialNodes),
          edges: JSON.stringify(stateMarehineEdges)
        }
        setIsDraft(false)
        isFirstLoadRef.current = true
        if (onDraftStatusChange) {
          onDraftStatusChange(false)
        }

        setIsInitialized(true)
        return
      }

      // 非状态机模式的原有逻辑
      // 处理边数据
      if (!flowConfig.relationship) {
        setEdges([]) // 清空所有连接线

        // 存储初始数据的完整快照
        initialDataHashRef.current = {
          nodes: JSON.stringify(initialNodes),
          edges: JSON.stringify([])
        }
        setIsDraft(false) // 初始状态不是草稿
        // 强制设置为首次加载状态
        isFirstLoadRef.current = true
        // 通知父组件草稿状态
        if (onDraftStatusChange) {
          onDraftStatusChange(false)
        }

        setIsInitialized(true)
        return
      }

      // 设置edges
      if (Array.isArray(flowConfig.relationship) && flowConfig.relationship.length > 0) {
        // 检查边数据是否有效，过滤掉target为null、undefined或空字符串的边
        const validEdges = flowConfig.relationship.filter((edge) => {
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
            console.warn("发现无效的边数据，将被过滤掉:", edge)
          }
          return isValid
        })

        if (validEdges.length !== flowConfig.relationship.length) {
          console.warn(
            `过滤掉了 ${flowConfig.relationship.length - validEdges.length} 条无效的边数据`
          )
        }

        // 确保每条边都有必要的属性
        const formattedEdges = validEdges.map((edge) => {
          // 提取intentionRule字段到data中
          const { intentionRule, data, ...edgeProps } = edge

          // 确保边有正确的类型和删除回调
          const formattedEdge = {
            id: edge.id || `edge-${edge.source}-${edge.target}-${Date.now()}`,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || null,
            targetHandle: edge.targetHandle || null,
            type: edge.type || (flowType === 2 ? "default" : "smoothstep"), // 工作流模式使用smoothstep，状态机使用default
            data: {
              ...(data || {}), // 处理data为null的情况
              onDeleteEdge: handleDeleteEdge, // 添加删除回调
              flowType: flowType, // 添加flowType信息
              // 如果有intentionRule字段，将其放入data中
              ...(intentionRule ? { intentionRule } : {})
            }
          }

          return formattedEdge
        })

        setEdges(formattedEdges)

        // 存储初始数据的完整快照
        initialDataHashRef.current = {
          nodes: JSON.stringify(initialNodes),
          edges: JSON.stringify(formattedEdges)
        }
        setIsDraft(false) // 初始状态不是草稿
        // 强制设置为首次加载状态
        isFirstLoadRef.current = true
        // 通知父组件草稿状态
        if (onDraftStatusChange) {
          onDraftStatusChange(false)
        }
      } else {
        setEdges([]) // 确保清空连接线

        // 存储初始数据的完整快照
        initialDataHashRef.current = {
          nodes: JSON.stringify(initialNodes),
          edges: JSON.stringify([])
        }
        setIsDraft(false) // 初始状态不是草稿
        // 强制设置为首次加载状态
        isFirstLoadRef.current = true
        // 通知父组件草稿状态
        if (onDraftStatusChange) {
          onDraftStatusChange(false)
        }
      }

      // 设置一个标记，表示数据已经初始化完成
      setIsInitialized(true)
      // 首次加载完成后，重置草稿状态
      if (isFirstLoadRef.current) {
        setIsDraft(false)
        if (onDraftStatusChange) {
          onDraftStatusChange(false)
        }
        // 不要在这里重置isFirstLoadRef，让它在第一次数据变化后再重置
      }
    } else {
      // 如果flowConfig或nodeCodes不存在，也清空所有数据
      setNodes([])
      setEdges([])

      // 重置初始数据快照
      initialDataHashRef.current = {
        nodes: JSON.stringify([]),
        edges: JSON.stringify([])
      }
      setIsDraft(false)
      // 强制设置为首次加载状态
      isFirstLoadRef.current = true
      // 通知父组件草稿状态
      if (onDraftStatusChange) {
        onDraftStatusChange(false)
      }
    }
  }, [
    flowConfig,
    handleDeleteEdge,
    onDraftStatusChange,
    setEdges,
    setIsDraft,
    setIsInitialized,
    setNodes,
    flowType
  ])

  // 单独使用useEffect监听初始化完成状态，并在适当时机调用fitView
  useEffect(() => {
    if (isInitialized && reactFlowInstance) {
      // 在适配视图前，确保不会检测草稿状态
      isAutoFittingRef.current = true

      // 使用RAF确保DOM已经完全渲染
      requestAnimationFrame(() => {
        // 添加一个小延迟，确保节点已经正确渲染
        setTimeout(() => {
          fitViewToContent()

          // 在适配完成后，延迟一段时间再开始检测草稿状态
          setTimeout(() => {
            isAutoFittingRef.current = false
            // 此时仍保持isFirstLoadRef为true，直到用户实际进行操作
          }, 1000) // 给足够的时间让所有初始化操作完成
        }, 100)
      })
    }
  }, [isInitialized, reactFlowInstance, fitViewToContent, isAutoFittingRef])
}

export default useCanvasInitialization
