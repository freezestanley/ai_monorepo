import React, { useCallback, useEffect, useState, memo } from "react"
import { useReactFlow, useViewport, Panel, ControlButton } from "reactflow"
import { message, Tooltip, Popover, Button } from "antd"
import Sidebar from "./Sidebar"
import { useTags } from "../context/TagsContext"
import { getLayoutedElements } from "../utils/autoLayout"

// 添加全局样式
const addGlobalStyle = () => {
  const styleElement = document.createElement("style")
  styleElement.textContent = `
    .react-flow__pane--locked {
      cursor: not-allowed;
      pointer-events: none;
    }
    .react-flow__controls-button {
      border: none;
    }
      .react-flow__controls-button {
        font-size:16px;
      }
  `
  document.head.appendChild(styleElement)
  return () => {
    document.head.removeChild(styleElement)
  }
}

// 使用memo包装控制按钮组件以避免不必要的重新渲染
const ZoomButton = memo(({ onClick, title, icon, className }) => (
  <Tooltip title={title} placement="top">
    <ControlButton
      onClick={onClick}
      className={
        className ||
        "bg-transparent border-none p-0 cursor-pointer rounded-md outline-none hover:text-[#7F56D9]"
      }
    >
      {icon}
    </ControlButton>
  </Tooltip>
))

// 添加一个专门的文本按钮组件
const TextButton = memo(({ onClick, title, text, isDisabled }) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen) => {
    if (!isDisabled) {
      setOpen(newOpen)
    }
  }

  const handleConfirm = () => {
    setOpen(false)
    onClick()
  }

  const handleCancel = () => {
    setOpen(false)
  }

  // 确认弹窗的内容
  const content = (
    <div className="flex flex-col gap-2 max-w-[220px]">
      <p className="text-[13px] text-[#344054] mb-1">原来的布局可能会被覆盖，确定自动整理吗？</p>
      <div className="flex justify-end gap-2">
        <Button size="small" onClick={handleCancel}>
          取消
        </Button>
        <Button size="small" type="primary" onClick={handleConfirm}>
          确定
        </Button>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="top"
      overlayStyle={{ width: "auto" }}
    >
      <Tooltip title={title} placement="left">
        <ControlButton
          className={`bg-transparent border-none !px-1 !py-1 cursor-pointer rounded-md !w-[38px] h-[20px] !text-[#fff] outline-none !bg-[#e0d3fe] ${
            isDisabled ? "opacity-60 cursor-not-allowed" : "hover:text-[#7F56D9]"
          }`}
        >
          <span className="text-[11px] font-[400] text-[#7F56D9]">
            <i className="iconfont icon-cebian-lingxijishi text-[12px] font-[400] text-[#7F56D9] mr-[1px]"></i>
            {text}
          </span>
        </ControlButton>
      </Tooltip>
    </Popover>
  )
})

const CustomControls = memo(({ fitViewToContent, flowType, isOnlyRead }) => {
  const {
    zoomIn,
    zoomOut,
    fitView,
    setViewport,
    zoomTo,
    addNodes,
    getNodes,
    setNodes,
    getEdges,
    setEdges
  } = useReactFlow()
  const { x, y, zoom } = useViewport()
  const [isInteractive, setIsInteractive] = useState(true)
  const [currentZIndex, setCurrentZIndex] = useState(0)
  const [isLayoutProcessing, setIsLayoutProcessing] = useState(false)
  const [showAllRules, setShowAllRules] = useState(false)

  // 使用标签Context
  const { tags } = useTags()

  // 添加全局样式
  useEffect(() => {
    return addGlobalStyle()
  }, [])

  // 处理锁定/解锁交互状态
  const toggleInteractivity = useCallback(() => {
    setIsInteractive((prevState) => !prevState)
  }, [])

  // 监听交互状态变化
  useEffect(() => {
    const reactFlowPane = document.querySelector(".react-flow__pane")
    if (reactFlowPane) {
      if (isInteractive) {
        reactFlowPane.classList.remove("react-flow__pane--locked")
      } else {
        reactFlowPane.classList.add("react-flow__pane--locked")
      }
    }
  }, [isInteractive])

  // 缓存事件处理函数
  const handleZoomIn = useCallback(() => zoomIn({ duration: 300 }), [zoomIn])
  const handleZoomOut = useCallback(() => zoomOut({ duration: 300 }), [zoomOut])
  const handleFitView = useCallback(() => {
    // 如果提供了自定义的fitViewToContent函数，优先使用它
    if (fitViewToContent) {
      fitViewToContent()
    } else {
      // 否则使用默认的fitView函数
      fitView({ padding: 0.2 })
    }
  }, [fitView, fitViewToContent])

  // 添加自动布局功能 - 使用导入的getLayoutedElements函数
  const handleAutoLayout = useCallback(() => {
    // 如果正在处理布局，则不允许再次触发
    if (isLayoutProcessing) {
      return
    }

    const nodes = getNodes()
    const edges = getEdges()

    if (nodes.length === 0) {
      message.info("没有节点可以整理")
      return
    }

    // 设置状态为处理中
    setIsLayoutProcessing(true)

    // 根据flowType决定布局方向
    // flowType === 1: 工作流模式，使用纵向布局(TB - Top to Bottom)
    // flowType === 2: 状态机模式，使用横向布局(LR - Left to Right)
    const direction = flowType === 2 ? "LR" : "TB"

    // 使用从utils/autoLayout导入的函数
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction
    )

    // 应用新的布局
    setNodes(layoutedNodes)

    // 延迟调整视图以显示所有节点
    setTimeout(() => {
      fitView({ padding: 0.2 })
      message.success("画布已经自动整理完成", 2)

      // 设置一个延迟，防止快速连续点击
      setTimeout(() => {
        setIsLayoutProcessing(false)
      }, 1500) // 1.5秒冷却时间
    }, 100)
  }, [getNodes, getEdges, setNodes, fitView, isLayoutProcessing])

  // 切换显示所有规则
  const handleToggleShowAllRules = useCallback(() => {
    const newShowAllRules = !showAllRules
    setShowAllRules(newShowAllRules)

    // 更新所有边的数据，添加showAllRules标志
    const edges = getEdges()
    const updatedEdges = edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        showAllRules: newShowAllRules
      }
    }))
    setEdges(updatedEdges)
  }, [showAllRules, getEdges, setEdges])

  // 添加节点处理函数
  const handleAddNode = useCallback(
    (nodeType) => {
      const position = {
        x: Math.random() * 500,
        y: Math.random() * 500
      }

      const nodeId = `node_${Date.now()}`

      // 根据flowType创建不同的节点数据结构，与useCanvasDragDrop保持一致
      let newNodeData = {}

      if (flowType === 1) {
        // 工作流模式 - 确保使用content类型并提供完整的默认数据
        newNodeData = {
          // 注意：这里缺少回调函数，需要在样式处理中补充
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
        deletable: true,
        zIndex: currentZIndex + 1
      }

      setCurrentZIndex((prev) => prev + 1)
      addNodes(newNode)
    },
    [addNodes, currentZIndex, flowType]
  )

  return (
    <Panel position="bottom-left">
      <div className="flex items-center bg-white border border-gray-200 rounded-[8px] shadow-md p-1.5">
        <div className="flex items-center gap-3 px-3 py-1">
          {/* 缩小按钮 */}
          <ZoomButton
            title="缩小画布"
            onClick={handleZoomOut}
            icon={<i className="iconfont icon-a-1 text-[27px] font-[300] text-[#475467]"></i>}
          />

          {/* 放大按钮 */}
          <ZoomButton
            title="放大画布"
            onClick={handleZoomIn}
            icon={<i className="iconfont icon-a-4 text-[27px] font-[300] text-[#475467]"></i>}
          />

          <div className="h-[15px] w-[1px] bg-[#D0D5DD]"></div>
          {flowType !== 2 && (
            <ZoomButton
              title={showAllRules ? "隐藏所有连线规则" : "显示所有连线规则"}
              onClick={handleToggleShowAllRules}
              icon={
                <i
                  className={`iconfont icon-eye text-[20px] font-[300] ${
                    showAllRules ? "icon-eye-close text-[#7F56D9]" : "text-[#475467]"
                  }`}
                ></i>
              }
            />
          )}
          {/* 显示/隐藏所有规则按钮 */}

          <ZoomButton
            title="适配画布内容到视图"
            onClick={handleFitView}
            icon={<i className="iconfont icon-a-7 text-[25px] font-[300] text-[#475467]"></i>}
          />

          {/* <ZoomButton
            title={isInteractive ? "锁定画布，禁止拖拽" : "解锁画布，允许拖拽"}
            onClick={toggleInteractivity}
            icon={
              isInteractive ? (
                <i className="iconfont icon-unlock text-[17px] font-[300] text-[#475467]" />
              ) : (
                <i className="iconfont icon-lock text-[17px] font-[300] text-[#475467]" />
              )
            }
          /> */}

          {/* <div className="h-[15px] w-[1px] bg-[#D0D5DD]"></div> */}

          {/* 自动布局按钮 - 使用新的TextButton组件 */}
          <TextButton
            title={isLayoutProcessing ? "布局整理中，请稍候..." : "自动画布布局，优化节点位置"}
            onClick={handleAutoLayout}
            text="布局"
            isDisabled={isLayoutProcessing}
          />
          {!isOnlyRead && (
            <>
              {flowType !== 2 && <div className="h-[15px] w-[1px] bg-[#D0D5DD]"></div>}
              {/* 侧边栏节点添加按钮 */}
              {flowType !== 2 && (
                <Tooltip title="添加新节点，可拖拽添加到画布任意位置" placement="top">
                  <span>
                    <Sidebar onAddNode={handleAddNode} flowType={flowType} />
                  </span>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>
    </Panel>
  )
})

export default CustomControls
