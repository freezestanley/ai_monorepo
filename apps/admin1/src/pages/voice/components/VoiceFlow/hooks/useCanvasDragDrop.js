import { useCallback } from "react"
import { useReactFlow } from "reactflow"
import { getId } from "./useCanvasState"

/**
 * 自定义钩子，用于管理画布的拖放操作
 * 将拖放相关的逻辑封装在一起，提高代码可维护性
 */
export const useCanvasDragDrop = ({
  reactFlowWrapper,
  setNodes,
  setIsDraggingFromSidebar,
  handleTagAdd,
  handleDeleteNode,
  isFirstLoadRef,
  flowType
}) => {
  const { project } = useReactFlow()

  // 处理拖放操作
  const onDrop = useCallback(
    (event) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow")
      if (!type) {
        setIsDraggingFromSidebar(false)
        return
      }

      // 用户添加了新节点，标记为非首次加载状态
      isFirstLoadRef.current = false

      // 获取画布包装器的边界框
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()

      // 节点估计尺寸 - 根据CustomNode.less中的设置
      const nodeWidth = 300 // 基于min-width: 300px
      const nodeHeight = 150 // 估计的节点高度，包括内容和标签区域

      // 计算相对于画布的位置，考虑滚动和缩放，并将节点以鼠标位置为中心点
      const position = project({
        x: event.clientX - reactFlowBounds.left - nodeWidth / 2,
        y: event.clientY - reactFlowBounds.top - nodeHeight / 2
      })

      // 获取从Sidebar传递过来的节点ID，如果没有则使用默认的getId()
      const nodeId = event.dataTransfer.getData("application/node-id") || getId()

      // 根据flowType创建不同的节点数据结构
      let newNodeData = {}

      if (flowType === 1) {
        // 工作流模式 - 确保使用content类型并提供完整的默认数据
        newNodeData = {
          onTagAdd: (newTags) => handleTagAdd(nodeId, newTags),
          onDeleteNode: handleDeleteNode,
          // 初始节点数据
          tags: [], // 默认空数组，用户需要手动添加标签
          // 添加新的节点数据字段
          nodeName: "", // 初始为空，在UI中显示为"请输入节点名称"
          content: "", // 初始为空，会显示CustomEmpty组件
          // 使用脚本ID列表
          selectedScriptIds: [], // 不设置默认选中的脚本
          scriptIds: [], // 添加scriptIds字段，用于存储实际的scriptId列表
          nodeId: null, // 添加nodeId字段，初始为null，保存后会被更新为接口返回的id
          isMounted: false,
          eventRelations: [],
          // 使用新的数组格式存储客户意图
          customerIntents: [],
          // 确保节点可以正常编辑和交互
          isHighlighted: false,
          isPrologue: false // 默认不是开场白节点
        }
      } else if (flowType === 2) {
        // 状态机模式 - 使用不同的数据结构
        newNodeData = {
          content: "",
          title: "新节点",
          onEdit: () => {}, // 这些回调会在状态机初始化hook中设置
          onDelete: () => {}
        }
      } else {
        // 未知flowType，使用默认工作流模式
        newNodeData = {
          onTagAdd: (newTags) => handleTagAdd(nodeId, newTags),
          onDeleteNode: handleDeleteNode,
          tags: [],
          nodeName: "",
          content: "",
          selectedScriptIds: [],
          scriptIds: [],
          nodeId: null,
          isMounted: false,
          eventRelations: [],
          customerIntents: [],
          isHighlighted: false,
          isPrologue: false
        }
      }

      const newNode = {
        id: nodeId,
        type: flowType === 2 ? "stateMachineChild" : "content", // 根据flowType设置正确的节点类型
        position,
        data: newNodeData,
        // 确保节点具有正确的属性
        draggable: true,
        selectable: true,
        deletable: true
      }

      setNodes((nds) => nds.concat(newNode))

      // 重置拖拽状态
      setIsDraggingFromSidebar(false)
    },
    [
      project,
      setNodes,
      handleTagAdd,
      handleDeleteNode,
      reactFlowWrapper,
      setIsDraggingFromSidebar,
      isFirstLoadRef,
      flowType
    ]
  )

  return {
    onDrop
  }
}

export default useCanvasDragDrop
