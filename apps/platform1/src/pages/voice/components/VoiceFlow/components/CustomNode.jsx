import React, { useState, useRef, useEffect, useCallback, memo } from "react"
import { Handle, Position, useReactFlow, useStoreApi } from "reactflow"
import { DeleteOutlined, CopyOutlined, EditOutlined, EllipsisOutlined } from "@ant-design/icons"
import { Popconfirm, Tooltip, Typography, Dropdown, Space, Menu, Tag } from "antd"
import classNames from "classnames"
import "../styles/CustomNode.scss"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import voiceTitle from "@/assets/img/voiceTitle.png"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

// 内容组件，支持最多显示7行，超出显示省略号和tooltip
const ContentWithTooltip = memo(({ content }) => {
  // 判断内容是否为空或默认提示文案
  const isEmpty = !content

  if (isEmpty) {
    return (
      <div className="text-[12px] p-1 bg-[#F5F7FA] rounded-[4px] max-h-[120px]">
        <CustomEmpty description="点击编辑节点内容" />
      </div>
    )
  }

  // 将内容中的多个连续换行符替换为单个换行符，减少段落间距
  const formattedContent = content.replace(/\n\s*\n/g, "\n")

  return (
    <div
      className="text-[12px] text-[#181B25] font-[400] p-1 bg-[#F5F7FA] rounded-[4px] max-h-[120px] overflow-auto whitespace-pre-wrap break-words"
      style={{ lineHeight: 1.3 }}
    >
      {formattedContent}
    </div>
  )
})

// 标题组件，支持单行显示，超出显示省略号和tooltip
const TitleWithTooltip = memo(({ title }) => {
  const titleRef = useRef(null)
  const [isTruncated, setIsTruncated] = useState(false)

  // 确保title始终有值
  const displayTitle = title || "请输入节点名称"

  useEffect(() => {
    const checkTruncation = () => {
      if (titleRef.current) {
        // 检查标题是否被截断
        setIsTruncated(titleRef.current.scrollWidth > titleRef.current.clientWidth)
      }
    }

    checkTruncation()

    // 当窗口大小变化时重新检查
    window.addEventListener("resize", checkTruncation)
    return () => {
      window.removeEventListener("resize", checkTruncation)
    }
  }, [displayTitle])

  return (
    <Tooltip
      title={isTruncated ? displayTitle : null}
      placement="top"
      color="#fff"
      overlayInnerStyle={{ color: "#181B25" }}
    >
      <span
        ref={titleRef}
        className="mt-1 text-[16px] ml-2 text-[#181B25] font-[500] truncate block max-w-[200px]"
      >
        {displayTitle}
      </span>
    </Tooltip>
  )
})

const CustomNode = memo(({ data, selected, id, ...nodeProps }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [sourceConnections, setSourceConnections] = useState({}) // 存储从此节点出发的连接
  const [targetConnections, setTargetConnections] = useState({}) // 存储指向此节点的连接
  const tagsRef = useRef(null)
  const nodeRef = useRef(null)
  const reactFlowInstance = useReactFlow()
  const store = useStoreApi()

  // 通过React Flow获取完整的节点数据
  const nodes = reactFlowInstance.getNodes()
  const currentNode = nodes.find((node) => node.id === id)
  const isPrologue = currentNode?.isPrologue || false

  const { isPublishDisabled } = useStudioPublishData()

  // Effect to adjust node width based on tags width
  useEffect(() => {
    if (nodeRef.current) {
      // 对于挂机节点，或者没有标签的节点，使用默认宽度
      if (data?.isMounted || !data?.tags?.length) {
        nodeRef.current.style.width = `330px` // 设置默认宽度
        return
      }

      // 对于有标签的普通节点，计算宽度
      if (tagsRef.current) {
        // 计算整个wrapper的宽度，包括标签和添加按钮
        const tagsWidth = tagsRef.current.scrollWidth + 20
        nodeRef.current.style.width = `${Math.max(330, tagsWidth)}px`
      }
    }
  }, [data?.tags, data?.isMounted])

  // Effect to initialize tags from data
  useEffect(() => {
    // 处理初始化逻辑
  }, [data])

  // 处理删除节点
  const handleDeleteNode = (e) => {
    e.stopPropagation()

    // 检查是否有关闭抽屉的回调函数
    if (data.onCloseDrawer) {
      // 调用关闭抽屉函数
      data.onCloseDrawer()
    }

    // 先通知父组件清理所有相关连接
    if (data.onNodeRemove) {
      data.onNodeRemove(id, sourceConnections, targetConnections)
    }
    // 然后删除节点
    if (data.onDeleteNode) {
      data.onDeleteNode(id)
    }
  }

  // 处理复制节点
  const handleCopyNode = (e) => {
    e.stopPropagation()

    // 创建新的节点数据
    const newNode = {
      type: "content",
      position: {
        x: data.position?.x + 20 || 0,
        y: data.position?.y + 20 || 0
      },
      data: {
        ...data,
        nodeName: `${data.nodeName || ""} (复制)`
      }
    }

    // 通过ReactFlow实例添加节点
    if (reactFlowInstance) {
      reactFlowInstance.addNodes(newNode)
    }
  }

  // 处理编辑节点
  const handleEditNode = (e) => {
    e.stopPropagation()

    // 这里可以直接触发点击事件来打开编辑抽屉
    // 节点本身的点击事件会处理打开抽屉的逻辑
    const nodeElement = nodeRef.current
    if (nodeElement) {
      nodeElement.click()
    }
  }

  // 更多操作菜单
  const moreMenuItems = [
    {
      key: "copy",
      icon: <CopyOutlined />,
      label: "复制节点",
      onClick: handleCopyNode
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "编辑节点",
      onClick: handleEditNode
    }
  ]

  // 添加标签连接相关的事件处理
  const onConnectStart = useCallback(
    (event, { nodeId, handleId }) => {
      // 当从标签开始连线时触发
      const handleIndex = handleId?.split("-")[1]
      const tag = data.tags[handleIndex]

      console.log("当前节点ID:", id)
      console.log("Handle ID:", handleId)
      console.log("标签详细数据:", tag)

      // 如果data中有回调，执行它
      if (data.onConnectStart) {
        data.onConnectStart(event, { nodeId, handleId, tag })
      }
    },
    [id, data.tags]
  )

  // 设置连接开始的事件监听
  useEffect(() => {
    // 将回调函数添加到全局状态
    const state = store.getState()
    state.onConnectStart = onConnectStart

    return () => {
      // 清理函数，移除回调
      const state = store.getState()
      if (state.onConnectStart === onConnectStart) {
        state.onConnectStart = null
      }
    }
  }, [onConnectStart, store])

  // 添加连接完成事件处理
  const onConnectEnd = useCallback(
    (event) => {
      console.log("连接目标位置:", { x: event.clientX, y: event.clientY })

      // 如果data中有回调，执行它
      if (data.onConnectEnd) {
        data.onConnectEnd(event)
      }
    },
    [data]
  )

  // 设置连接结束的事件监听
  useEffect(() => {
    // 将回调函数添加到全局状态
    const state = store.getState()
    state.onConnectEnd = onConnectEnd

    return () => {
      // 清理函数，移除回调
      const state = store.getState()
      if (state.onConnectEnd === onConnectEnd) {
        state.onConnectEnd = null
      }
    }
  }, [onConnectEnd, store])

  // 监听连接删除事件
  const onEdgeDelete = useCallback(
    (edges) => {
      edges.forEach((edge) => {
        // 检查是否是从当前节点发出的连接
        if (edge.source === id) {
          // 从sourceConnections中删除对应的连接
          setSourceConnections((prev) => {
            const updated = { ...prev }
            if (updated[edge.sourceHandle]) {
              updated[edge.sourceHandle] = updated[edge.sourceHandle].filter(
                (conn) => conn.connectionId !== edge.id
              )
            }
            return updated
          })

          // 调用删除连接的回调（如果存在）
          if (data.onRemoveConnection) {
            data.onRemoveConnection(edge.sourceHandle, edge.id)
          }
        }

        // 检查是否是指向当前节点的连接
        if (edge.target === id) {
          // 从targetConnections中删除对应的连接
          setTargetConnections((prev) => {
            const updated = { ...prev }
            if (updated[edge.targetHandle]) {
              updated[edge.targetHandle] = updated[edge.targetHandle].filter(
                (conn) => conn.connectionId !== edge.id
              )
            }
            return updated
          })
        }
      })
    },
    [id, data]
  )

  // 使用父组件传递的onEdgesDelete回调
  useEffect(() => {
    // 如果父组件提供了onEdgesDelete回调，将我们的处理函数注册给它
    if (data.registerEdgesDeleteHandler) {
      data.registerEdgesDeleteHandler(id, onEdgeDelete)
    }

    return () => {
      // 组件卸载时取消注册
      if (data.unregisterEdgesDeleteHandler) {
        data.unregisterEdgesDeleteHandler(id)
      }
    }
  }, [id, onEdgeDelete, data])

  // 节点删除时清理连接
  useEffect(() => {
    return () => {
      // 当组件卸载（节点删除）时，通知父组件清理所有相关连接
      if (data.onNodeRemove) {
        data.onNodeRemove(id, sourceConnections, targetConnections)
      }
    }
  }, [id, sourceConnections, targetConnections, data])

  // 在Handle组件上添加事件处理
  const handleConnect = (handleId, tagData) => (params) => {
    console.log("=== 标签连接事件 ===")
    console.log("Handle ID:", handleId)
    console.log("标签数据:", tagData)
    console.log("连接参数:", params)

    // 更新连接关系
    const { source, sourceHandle, target, targetHandle } = params

    // 添加到sourceConnections中
    setSourceConnections((prev) => {
      const updated = { ...prev }
      if (!updated[sourceHandle]) {
        updated[sourceHandle] = []
      }
      // 检查是否已存在相同的连接，避免重复
      if (
        !updated[sourceHandle].some(
          (conn) => conn.target === target && conn.targetHandle === targetHandle
        )
      ) {
        updated[sourceHandle] = [
          ...updated[sourceHandle],
          {
            target,
            targetHandle,
            tagData, // 存储标签数据
            connectionId: `${sourceHandle}-${target}-${targetHandle || "default"}-${Date.now()}`
          }
        ]
      }

      console.log("当前源连接:", updated)
      return updated
    })

    // 如果有管理连接的回调函数，调用它
    if (data.onConnection) {
      data.onConnection(params, tagData)
    }
  }

  // 添加删除连接的处理函数
  const handleRemoveConnection = (sourceHandle, connectionId) => {
    setSourceConnections((prev) => {
      const updated = { ...prev }
      if (updated[sourceHandle]) {
        updated[sourceHandle] = updated[sourceHandle].filter(
          (conn) => conn.connectionId !== connectionId
        )
      }
      return updated
    })

    // 如果有删除连接的回调函数，调用它
    if (data.onRemoveConnection) {
      data.onRemoveConnection(sourceHandle, connectionId)
    }
  }

  // 将连接信息传递给父组件的函数
  useEffect(() => {
    if (data.onConnectionsChange) {
      data.onConnectionsChange(id, sourceConnections, targetConnections)
    }
  }, [sourceConnections, targetConnections, id, data])

  // 从父组件更新连接信息的处理
  useEffect(() => {
    if (data.connections) {
      if (data.connections.source) {
        setSourceConnections(data.connections.source)
      }
      if (data.connections.target) {
        setTargetConnections(data.connections.target)
      }
    }
  }, [data.connections])

  // 高亮样式
  const nodeContentHighlightStyle = data?.isHighlighted
    ? {
        borderRadius: "8px",
        border: "1px solid var(---, #7f56d9)",
        background: "rgba(220, 213, 255, 0.10)",
        boxShadow: "0px 4px 24px 0px rgba(24, 27, 37, 0.12)"
      }
    : {}

  // 标签高亮样式
  const tagHighlightStyle = data?.isHighlighted
    ? {
        boxShadow: "0 0 10px 0 rgba(127, 86, 217, 0.3)"
      }
    : {}

  return (
    <div
      style={nodeContentHighlightStyle}
      className={classNames("voice-flow-custom-node", { selected })}
      ref={nodeRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <div className="node-content-title">
          <div className="flex justify-start items-center">
            <img className="w-[24px] h-[24px]" src={voiceTitle} alt="开场白" />
            {/* {(data?.isMounted || data?.nonInterrupt === 10) && (
              <Tag className="mx-1 mt-1 text-[12px] -mr-1" color={data?.isMounted ? "#f50" : "red"}>
                {data?.isMounted && data?.nonInterrupt === 10
                  ? "挂机-打断"
                  : data?.isMounted
                    ? "挂机1"
                    : "打断"}
              </Tag>
            )} */}

            {(data?.ctiOrder || data?.isMounted || data?.nonInterrupt === 10) && (
              <Tag
                className="mx-1 mt-1 text-[12px] -mr-1"
                color={data?.ctiOrder || data?.isMounted ? "#f50" : "#f50"}
              >
                {(data?.ctiOrder === "toOver" || data?.isMounted) && data?.nonInterrupt === 10
                  ? "挂机-打断"
                  : (data?.ctiOrder === "toQueue" || data?.isMounted) && data?.nonInterrupt === 10
                    ? "转人工-打断"
                    : data?.ctiOrder === "toOver"
                      ? "挂机"
                      : data?.ctiOrder === "toQueue"
                        ? "转人工"
                        : "打断"}
              </Tag>
            )}

            {isPrologue && (
              <Tag className="mx-1 mt-1 text-[12px] -mr-1" color="#1890ff">
                开场白
              </Tag>
            )}
            <TitleWithTooltip title={data?.nodeName} />
          </div>
          {!isPublishDisabled && (isHovered || selected) && (
            <div className="flex items-center gap-1 absolute top-[15px] right-[10px] z-10">
              <Popconfirm
                title="确认删除该节点？"
                description="删除后无法恢复，确认要删除吗？"
                onConfirm={handleDeleteNode}
                okText="确认"
                cancelText="取消"
                placement="topRight"
                trigger="click"
              >
                <div className="delete-button" onClick={(e) => e.stopPropagation()}>
                  <i className="iconfont icon-shanchu text-[18px]"></i>
                </div>
              </Popconfirm>

              {/* <Dropdown
                menu={{ items: moreMenuItems }}
                trigger={["click"]}
                placement="bottomRight"
                overlayStyle={{ minWidth: "200px" }}
              >
                <div className="more-button" onClick={(e) => e.stopPropagation()}>
                  <EllipsisOutlined style={{ fontSize: "20px" }} />
                </div>
              </Dropdown> */}
            </div>
          )}
        </div>
        <div className="node-content-text mt-3">
          <ContentWithTooltip content={data?.content} />
        </div>
      </div>

      {/* 只有当不是挂机节点且有标签时才显示客户回复部分 */}
      {!data?.isMounted && !data?.ctiOrder && !!data?.tags?.length && (
        <>
          <div className="node-header flex justify-between items-center mt-[10px]">
            <span className="text-[142x] text-[#475467] font-[400]">客户回复</span>
          </div>

          <div className="node-tags-wrapper" ref={tagsRef}>
            <div className="node-tags">
              {data.tags && data.tags.length ? (
                data.tags.map((tag, index) => {
                  return (
                    <div
                      key={tag.id || index}
                      className="tag"
                      style={{
                        color: "#181B25",
                        fontSize: "12px"
                      }}
                    >
                      {tag.label || tag}
                      <Handle
                        type="source"
                        position={Position.Bottom}
                        id={`handle-${tag.id || index}`}
                        style={{
                          left: "50%",
                          transform: "translateX(-50%)",
                          top: "0px",
                          background: "transparent",
                          width: "100%",
                          height: "100%",
                          borderRadius: "4px"
                        }}
                        onConnect={handleConnect(`handle-${tag.id || index}`, tag)}
                      />
                    </div>
                  )
                })
              ) : (
                <div className="text-[12px] text-[#949494] w-[100%] text-left">请选择回复标签</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
})

export default CustomNode
