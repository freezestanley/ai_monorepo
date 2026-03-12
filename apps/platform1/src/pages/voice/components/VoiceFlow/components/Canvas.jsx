import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import ReactFlow, { Background, ReactFlowProvider, useReactFlow } from "reactflow"
import { message } from "antd"
import CustomNode from "./CustomNode"
import NodeEditDrawer from "./NodeEditDrawer"
import CustomControls from "./CustomControls"
import CustomEdge from "./CustomEdge"
import CustomConnectionLine from "./CustomConnectionLine"
import StateMachineRootNode from "./stateMachine/StateMachineRootNode"
import StateMachineChildNode from "./stateMachine/StateMachineChildNode"
import "reactflow/dist/style.css"
import "../styles/CustomEdge.scss"
import { TagsProvider } from "../context/TagsContext"
import { getLayoutedElements } from "../utils/autoLayout"

// 导入自定义钩子
import useCanvasState from "../hooks/useCanvasState"
import useCanvasCallbacks from "../hooks/useCanvasCallbacks"
import useCanvasStyles from "../hooks/useCanvasStyles"
import useCanvasDragDrop from "../hooks/useCanvasDragDrop"
import useCanvasInitialization from "../hooks/useCanvasInitialization"
import useCanvasDataMonitor from "../hooks/useCanvasDataMonitor"
import useStateMachineInitialization from "../hooks/useStateMachineInitialization"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"

// 导入常量
import { NODE_TYPES, EDGE_TYPES } from "../constants/canvasConstants"

// 注册自定义节点类型
const nodeTypes = {
  [NODE_TYPES.CONTENT]: CustomNode,
  [NODE_TYPES.STATE_MACHINE_ROOT]: StateMachineRootNode,
  [NODE_TYPES.STATE_MACHINE_CHILD]: StateMachineChildNode
}

// 注册自定义边类型
const edgeTypes = {
  [EDGE_TYPES.CUSTOM]: CustomEdge,
  smoothstep: CustomEdge // 为工作流模式注册smoothstep边类型
}

// 将CanvasContent转换为forwardRef组件
const CanvasContent = forwardRef(
  (
    {
      flowConfig,
      taskId,
      botNo,
      isEmbedded,
      onNodesEdgesChange,
      onDraftStatusChange,
      flowType,
      isOnlyRead
    },
    ref
  ) => {
    // 使用自定义钩子管理状态
    const canvasState = useCanvasState({ onDraftStatusChange, onNodesEdgesChange })

    const {
      nodes,
      edges,
      selectedNode,
      drawerOpen,
      hoveredNodeId,
      selectedEdgeId,
      isDragging,
      isDraft,
      isInitialized,
      initialDataHashRef,
      isFirstLoadRef,
      isAutoFittingRef,
      reactFlowWrapper,

      setNodes,
      setEdges,
      setSelectedNode,
      setDrawerOpen,
      setHoveredNodeId,
      setSelectedEdgeId,
      setIsDragging,
      setIsDraft,
      setIsInitialized,
      setIsDraggingFromSidebar,

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
    } = canvasState

    const reactFlowInstance = useReactFlow()

    // 使用自定义钩子管理事件回调
    const {
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
    } = useCanvasCallbacks({
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
    })

    // 使用自定义钩子管理样式
    const { preparedNodes, preparedEdges, flowAnimationStyle } = useCanvasStyles({
      nodes,
      edges,
      hoveredNodeId,
      selectedEdgeId,
      handleDeleteEdge,
      handleUpdateEdgeRule,
      handleDeleteNode,
      handleTagAdd,
      onDrawerClose,
      flowType
    })

    // 使用自定义钩子管理拖放操作
    const { onDrop } = useCanvasDragDrop({
      reactFlowWrapper,
      setNodes,
      setIsDraggingFromSidebar,
      handleTagAdd,
      handleDeleteNode,
      isFirstLoadRef
    })

    // 使用自定义钩子管理初始化
    useCanvasInitialization({
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
    })

    // 使用状态机初始化hook
    useStateMachineInitialization({
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
    })

    // 使用自定义钩子监听数据变化
    useCanvasDataMonitor({
      nodes: preparedNodes,
      edges: preparedEdges,
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
    })

    // 添加全局键盘事件监听
    useEffect(() => {
      // 为整个document添加键盘事件监听
      document.addEventListener("keydown", onKeyDown)

      // 在组件卸载时移除事件监听
      return () => {
        document.removeEventListener("keydown", onKeyDown)
      }
    }, [onKeyDown])

    // 初始化完成后执行一次去重
    useEffect(() => {
      if (isInitialized && edges.length > 1) {
        // 使用延时确保在初始化完全完成后进行去重
        const timer = setTimeout(() => {
          deduplicateEdges()
        }, 500)

        return () => clearTimeout(timer)
      }
    }, [isInitialized, edges.length, deduplicateEdges])

    // 使用useImperativeHandle暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        updateSavePoint,
        deduplicateEdges,
        fitViewToContent,
        autoLayout: () => {
          // 这是和CustomControls中相同的自动布局逻辑
          if (nodes.length === 0) {
            console.info("没有节点可以整理")
            return
          }

          console.log("执行自动布局")

          // 先修复position为null的节点，防止画布报错
          const fixedNodes = nodes.map((node, index) => {
            if (
              node.position === null ||
              node.position === undefined ||
              (node.position && (node.position?.x === null || node.position?.y === null))
            ) {
              // 给null position节点设置临时坐标，防止画布报错
              return {
                ...node,
                position: {
                  x: 100 + index * 200, // 水平排列，避免重叠
                  y: 100
                }
              }
            }
            return node
          })

          // 根据flowType决定布局方向
          // flowType === 1: 工作流模式，使用纵向布局(TB - Top to Bottom)
          // flowType === 2: 状态机模式，使用横向布局(LR - Left to Right)
          const direction = flowType === 2 ? "LR" : "TB"

          // 使用从utils/autoLayout导入的函数
          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            fixedNodes,
            edges,
            direction
          )

          // 应用新的布局
          setNodes(layoutedNodes)
        }
      }),

      [
        updateSavePoint,
        deduplicateEdges,
        fitViewToContent,
        nodes,
        edges,
        flowType,
        setNodes,
        reactFlowInstance
      ]
    )

    return (
      <div ref={reactFlowWrapper} style={{ width: "100%", height: "100%" }}>
        <ReactFlow
          nodes={preparedNodes}
          edges={preparedEdges}
          onNodesChange={isOnlyRead ? undefined : onNodesChange}
          onEdgesChange={isOnlyRead ? undefined : onEdgesChange}
          onConnect={isOnlyRead ? undefined : onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onPaneClick={onPaneClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: flowType === 2 ? "default" : "smoothstep"
          }}
          connectionMode="loose"
          connectionLineComponent={CustomConnectionLine}
          deleteKeyCode={isOnlyRead ? null : "Delete"}
          snapToGrid={false}
          snapGrid={[15, 15]}
          elevateEdgesOnSelect={!isOnlyRead}
          elementsSelectable={!isOnlyRead}
          panOnDrag={!isDragging} // 拖动节点时禁用画布平移
          nodesDraggable={!isOnlyRead}
          edgesFocusable={true}
          edgesUpdatable={!isOnlyRead}
          nodesFocusable={true}
          nodesConnectable={!isOnlyRead}
          selectNodesOnDrag={false}
          zoomOnDoubleClick={false} // 禁用双击缩放，避免与双击删除边冲突
          fitView={false}
          minZoom={0.2}
          maxZoom={2}
          // 添加更细粒度的连接验证，防止无效连接
          isValidConnection={isValidConnection}
        >
          <style>{flowAnimationStyle}</style>
          <Background />
          {!nodes?.length && (
            <div className="text-center h-full flex justify-center items-center">
              <CustomEmpty description="暂无节点, 请添加节点"></CustomEmpty>
            </div>
          )}

          <CustomControls
            isOnlyRead={isOnlyRead}
            fitViewToContent={fitViewToContent}
            flowType={flowType}
          />
        </ReactFlow>
        <NodeEditDrawer
          open={drawerOpen}
          onClose={onDrawerClose}
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          botNo={botNo}
          taskId={taskId}
          flowType={flowType}
          allNodes={nodes}
          isOnlyRead={isOnlyRead}
        />
      </div>
    )
  }
)

// Canvas组件接受props，并传递给CanvasContent
const Canvas = forwardRef(
  (
    {
      flowConfig,
      taskId,
      botNo,
      isEmbedded,
      onNodesEdgesChange,
      onDraftStatusChange,
      flowType,
      isOnlyRead
    },
    ref
  ) => {
    return (
      <TagsProvider>
        <ReactFlowProvider>
          <CanvasContent
            ref={ref}
            flowConfig={flowConfig}
            taskId={taskId}
            botNo={botNo}
            isEmbedded={isEmbedded}
            onNodesEdgesChange={onNodesEdgesChange}
            onDraftStatusChange={onDraftStatusChange}
            flowType={flowType}
            isOnlyRead={isOnlyRead}
          />
        </ReactFlowProvider>
      </TagsProvider>
    )
  }
)

export default Canvas
