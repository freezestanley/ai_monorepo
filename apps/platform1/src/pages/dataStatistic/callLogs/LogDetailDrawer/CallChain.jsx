import { Tree, Typography, Spin, Segmented, Tooltip, message, Modal } from "antd"
import { useState, useEffect, useMemo } from "react"
import {
  ClockCircleOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CopyOutlined
} from "@ant-design/icons"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { EditorView } from "@codemirror/view"
import { indentationMarkers } from "@replit/codemirror-indentation-markers"
import { codemirrorThemeGray } from "@/utils/codeMirrorTheme"
import copy from "copy-to-clipboard"
import "./CallChain.scss"
import { fetchCallLogsExecuteProcessForStructureData } from "@/api/userFeedback/api"
import { fetchQueryOneByOrderResponse } from "@/api/optimize/api"
import dayjs from "dayjs"
import TimeLine from "./TimeLine"
import Iconfont from "@/components/Icon/index.jsx"

const { Text } = Typography

// 操作按钮组件（复制、全屏、折叠）
const SectionActions = ({
  onCopy,
  onExpand,
  onToggleCollapse,
  isCollapsed,
  copyData,
  copyType
}) => (
  <>
    <Tooltip title={`复制${copyType}`}>
      <i
        className="iconfont icon-fuzhi ml-2 cursor-pointer text-[16px] text-[#475467]"
        onClick={() => onCopy(copyData, copyType)}
      />
    </Tooltip>
    <Tooltip title="全屏">
      <i
        className="iconfont icon-a-expand ml-2 cursor-pointer text-[16px] !text-[#475467]"
        onClick={onExpand}
      />
    </Tooltip>
    <Tooltip title="折叠">
      <Iconfont
        type="icon-Down"
        className={`ml-2 operate-icon content-expand-icon ${isCollapsed ? "expanded" : ""}`}
        onClick={onToggleCollapse}
      />
    </Tooltip>
  </>
)

// 根据耗时判断颜色
const getTimeColor = (cost) => {
  if (cost >= 2000) {
    return "#ff4d4f" // 红色 - 大于等于2000ms
  } else if (cost >= 1000) {
    return "#faad14" // 黄色 - 1000-2000ms之间
  } else {
    return "#52c41a" // 绿色 - 小于1000ms
  }
}

// 生成随机6位数字
const generateRandomSuffix = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 处理组件数据，为失败状态的组件生成唯一key
const processComponentData = (componentData) => {
  if (!componentData || !Array.isArray(componentData) || componentData.length === 0) {
    return []
  }

  return componentData.map((item, index) => {
    const originalComponentNo = item.componentNo || `component-${index}`
    // 如果 success 为 false，给 componentNo 添加随机后缀
    const uniqueKey =
      item.success === false
        ? `${originalComponentNo}-${generateRandomSuffix()}`
        : originalComponentNo

    const processedItem = {
      ...item,
      originalComponentNo,
      uniqueKey
    }

    if (item.children && item.children.length > 0) {
      processedItem.children = processComponentData(item.children)
    }

    return processedItem
  })
}

// 将处理后的数据转换为树形结构
const convertToTreeData = (processedData) => {
  if (!processedData || !Array.isArray(processedData) || processedData.length === 0) {
    return []
  }

  return processedData.map((item, index) => ({
    key: item.uniqueKey,
    originalComponentNo: item.originalComponentNo,
    title: item.componentName || `组件${index + 1}`,
    cost: item.cost || 0,
    componentType: item.componentType,
    input: item.input,
    output: item.output,
    success: item.success,
    aiGatewayRespInfos: item.aiGatewayRespInfos || [],
    children:
      item.children && item.children.length > 0 ? convertToTreeData(item.children) : undefined
  }))
}

// 格式化输入输出数据
const formatInputOutput = (data) => {
  if (!data) return data

  // 如果是字符串，尝试解析为JSON
  if (typeof data === "string") {
    try {
      // 检查是否是JSON字符串
      if (
        (data.startsWith("{") && data.endsWith("}")) ||
        (data.startsWith("[") && data.endsWith("]"))
      ) {
        const parsedData = JSON.parse(data)
        return parsedData
      }

      // 如果是普通字符串，直接返回
      return data
    } catch (e) {
      // 解析失败，返回原始字符串
      return data
    }
  }

  return data
}

// 格式化元数据
const formatMetadata = (aiGatewayRespInfos) => {
  if (
    !aiGatewayRespInfos ||
    !Array.isArray(aiGatewayRespInfos) ||
    aiGatewayRespInfos.length === 0
  ) {
    return []
  }

  // 直接返回处理后的数组，不需要额外的空格
  return aiGatewayRespInfos.map((item) => ({
    ...item,
    requestId: item.requestId,
    resourceType: item.resourceType,
    lxSendRequestTimestamp: item.lxSendRequestTimestamp,
    lxReceiveRequestTimestamp: item.lxReceiveRequestTimestamp,
    receiveRequestTimestamp: item.receiveRequestTimestamp,
    sendRequestTimestamp: item.sendRequestTimestamp,
    receiveResponseTimestamp: item.receiveResponseTimestamp,
    sendResponseTimestamp: item.sendResponseTimestamp,
    providerProcessTime: item.providerProcessTime
  }))
}

// 将处理后的数据转换为详情数据
const convertToDetailData = (processedData) => {
  if (!processedData || !Array.isArray(processedData) || processedData.length === 0) {
    return {}
  }

  const detailData = {}

  const flattenData = (data) => {
    data.forEach((item) => {
      detailData[item.uniqueKey] = {
        input: formatInputOutput(item.input),
        output: formatInputOutput(item.output),
        metadata: formatMetadata(item.aiGatewayRespInfos)
      }
      if (item.children && item.children.length > 0) {
        flattenData(item.children)
      }
    })
  }

  flattenData(processedData)
  return detailData
}

// 获取所有节点的key
const getAllKeys = (processedData) => {
  let keys = []
  if (!processedData || !Array.isArray(processedData)) {
    return keys
  }
  for (const item of processedData) {
    keys.push(item.uniqueKey)
    if (item.children && item.children.length > 0) {
      keys = keys.concat(getAllKeys(item.children))
    }
  }
  return keys
}

export default ({ record, style }) => {
  const [selectedNode, setSelectedNode] = useState("")
  const [loading, setLoading] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState([])
  const [activeTab, setActiveTab] = useState("运行")
  // 删除放大查看相关的状态
  const [componentData, setComponentData] = useState([])
  const [processedData, setProcessedData] = useState([])
  //折叠
  const [isCollapsedInput, setIsCollapsedInput] = useState(false)
  const [isCollapsedOutput, setIsCollapsedOutput] = useState(false)
  const [isCollapsedMeta, setIsCollapsedMeta] = useState(false)
  // 全屏
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fullContent, setFullContent] = useState({ content: "", type: "" })
  const [extraSkillInfo, setExtraSkillInfo] = useState(null)
  // 获取请求时间
  const getRecordRequestTime = () => {
    try {
      if (record?.resourceLinks?.length > 0) {
        const extraInfo = record.resourceLinks[0].extraInfo
        if (extraInfo) {
          const parsedExtraInfo = JSON.parse(extraInfo)
          return parsedExtraInfo.requestTime
        }
      }
      return ""
    } catch (error) {
      return ""
    }
  }

  // 复制功能
  const handleCopy = (content, type) => {
    let textToCopy = content
    if (content !== null && typeof content === "object") {
      textToCopy = JSON.stringify(content, null, 2)
    }
    copy(textToCopy)
    message.success(`${type}复制成功`)
  }

  // 删除放大展示功能和关闭模态框的函数

  useEffect(() => {
    // 加载数据
    setLoading(true)

    const recordRequestTime = getRecordRequestTime()
    const queryData = {
      botNo: record.botNo,
      skillNo: record.skillNo,
      requestId: record.requestId || record.resourceLinks?.[0]?.resourceNo,
      requestTime: dayjs(recordRequestTime || record.requestTime).format("YYYY-MM-DD HH:mm:ss")
    }

    fetchCallLogsExecuteProcessForStructureData(queryData)
      .then((res) => {
        if (res && res.componentExecuteProcess && res.componentExecuteProcess.length > 0) {
          const data = res.componentExecuteProcess

          const skillInfo = {
            skillName: record?.skillName || res?.skillName || res?.agentName,
            skillNo: record?.skillNo || res?.skillNo || res?.agentNo
          }
          setExtraSkillInfo((prevState) => ({ ...prevState, ...skillInfo }))

          setComponentData(data)

          // 处理数据，为失败状态生成唯一key
          const processed = processComponentData(data)
          setProcessedData(processed)

          // 设置默认选中第一个节点（使用唯一key）
          if (processed.length > 0) {
            setSelectedNode(processed[0].uniqueKey)
          }
          // 默认不展开任何节点，只在用户交互时展开
          // const keys = getAllKeys(processed)
          // setExpandedKeys(keys)
        } else {
          // 如果没有数据，设置为空数组
          setComponentData([])
          setProcessedData([])
        }
      })
      .catch((err) => {
        console.error("获取调用链数据失败:", err)
        setComponentData([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [record])

  const handleSelect = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      const selectedKey = selectedKeys[0]
      setSelectedNode(selectedKey)
    }
  }

  const treeData = convertToTreeData(processedData)
  const detailData = convertToDetailData(processedData)
  const currentDetail = detailData[selectedNode]
  // 输入、输出、元数据内容
  const inputContent = useMemo(() => {
    if (!currentDetail?.input) return ""

    return typeof currentDetail.input === "string"
      ? currentDetail.input
      : JSON.stringify(currentDetail.input, null, 2)
  }, [currentDetail?.input])

  const outputContent = useMemo(() => {
    if (!currentDetail?.output) return ""

    return typeof currentDetail.output === "string"
      ? currentDetail.output
      : JSON.stringify(currentDetail.output, null, 2)
  }, [currentDetail?.output])

  const metaData = JSON.stringify(currentDetail?.metadata, null, 2)

  // 全屏
  const handleOk = () => {
    setIsModalOpen(false)
  }
  const handleCancel = () => {
    setIsModalOpen(false)
    setFullContent("")
  }
  const handleExpandInput = () => {
    setFullContent({ content: inputContent, type: "输入内容" })
    setIsModalOpen(true)
  }
  const handleExpandOutput = () => {
    setFullContent({ content: outputContent, type: "输出内容" })
    setIsModalOpen(true)
  }
  const handleExpandMeta = () => {
    setFullContent({ content: metaData, type: "元数据内容" })
    setIsModalOpen(true)
  }

  // 展开
  const handleToggleCollapseInput = () => {
    setIsCollapsedInput(!isCollapsedInput)
  }
  const handleToggleCollapseOutput = () => {
    setIsCollapsedOutput(!isCollapsedOutput)
  }
  const handleToggleCollapseMeta = () => {
    setIsCollapsedMeta(!isCollapsedMeta)
  }

  if (loading) {
    return (
      <div className="call-chain-loading">
        <Spin size="large" />
      </div>
    )
  }

  // 如果没有调用链数据，显示空状态
  if (!componentData || componentData.length === 0) {
    return (
      <div className="call-chain-container" style={style}>
        <div className="call-chain-empty flex items-center justify-center mt-[38%]">
          <CustomEmpty description="暂无调用链数据" />
        </div>
      </div>
    )
  }

  return (
    <div className="call-chain-container" style={style}>
      <div className="call-chain-layout">
        {/* 左侧调用链树 */}
        {/* call-chain-tree */}
        <div className="call-chain-tree">
          <div className="bg-[#f5f7fa] rounded-lg p-2 mb-5 space-y-1">
            <Tooltip title={extraSkillInfo?.skillName}>
              <div className="truncate">工作流名称：{extraSkillInfo?.skillName}</div>
            </Tooltip>
            <Tooltip title={extraSkillInfo?.skillNo}>
              <div className="truncate">工作流编号：{extraSkillInfo?.skillNo}</div>
            </Tooltip>
          </div>
          <Tree
            showLine={true}
            treeData={treeData}
            selectedKeys={[selectedNode]}
            expandedKeys={expandedKeys}
            onSelect={handleSelect}
            onExpand={setExpandedKeys}
            showIcon={false}
            titleRender={(node) => (
              <div className="call-chain-node">
                <div className="node-content">
                  <Tooltip title={node.title}>
                    <div className="node-title">{node.title}</div>
                  </Tooltip>
                  {/* 如果 success 为 false，显示失败状态，不显示耗时 */}
                  {node.success === false ? (
                    <div className="node-status" style={{ color: "#ff4d4f", fontSize: "12px" }}>
                      失败
                    </div>
                  ) : (
                    <div className="node-duration" style={{ color: getTimeColor(node.cost) }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {node.cost}ms
                    </div>
                  )}
                </div>
              </div>
            )}
            switcherIcon={({ expanded, isLeaf }) => {
              if (isLeaf) {
                return null
              }
              return expanded ? (
                <CaretDownOutlined className="tree-switcher-icon" />
              ) : (
                <CaretRightOutlined className="tree-switcher-icon" />
              )
            }}
          />
        </div>

        {/* 右侧详情面板 */}
        <div className="call-chain-detail">
          {currentDetail ? (
            <div className="detail-container">
              {/* Segmented 分段控制器 */}
              <div className="detail-header">
                <Segmented
                  value={activeTab}
                  onChange={setActiveTab}
                  options={[
                    { label: "运行", value: "运行" },
                    { label: "元数据", value: "元数据" }
                  ]}
                />
              </div>

              {/* 内容区域 */}
              <div className="detail-content">
                {activeTab === "运行" && (
                  <div className="run-content">
                    {/* 输入部分 */}
                    <div size="small" className="input-card">
                      <div className="section-header">
                        <div className="text-[14px] font-[500] color-[#181B25] flex items-center">
                          输入
                          <SectionActions
                            onCopy={handleCopy}
                            copyData={currentDetail.input}
                            copyType="输入内容"
                            onExpand={handleExpandInput}
                            onToggleCollapse={handleToggleCollapseInput}
                            isCollapsed={isCollapsedInput}
                          />
                        </div>
                      </div>
                      <div className="section-content">
                        <CodeMirror
                          value={!isCollapsedInput ? inputContent : "输入"}
                          height="auto"
                          minHeight={isCollapsedInput ? "40px" : "100px"}
                          maxHeight="200px"
                          readOnly={true}
                          extensions={[
                            json(),
                            EditorView.lineWrapping, // 启用换行
                            indentationMarkers({
                              hideFirstIndent: false,
                              markerType: "fullScope",
                              thickness: 1,
                              colors: {
                                light: "#E8E8E8",
                                dark: "#404040",
                                activeLight: "#C0C0C0",
                                activeDark: "#606060"
                              }
                            })
                          ]}
                          theme={codemirrorThemeGray}
                          basicSetup={{
                            lineNumbers: false,
                            foldGutter: false,
                            highlightActiveLine: false,
                            searchKeymap: false
                          }}
                        />
                      </div>
                    </div>

                    {/* 输出部分 */}
                    <div className="output-card">
                      <div className="section-header">
                        <div className="text-[14px] font-[500] color-[#181B25] flex items-center">
                          输出
                          <SectionActions
                            onCopy={handleCopy}
                            copyData={currentDetail.output}
                            copyType="输出内容"
                            onExpand={handleExpandOutput}
                            onToggleCollapse={handleToggleCollapseOutput}
                            isCollapsed={isCollapsedOutput}
                          />
                        </div>
                      </div>
                      <div className="section-content">
                        <CodeMirror
                          value={!isCollapsedOutput ? outputContent : "输出"}
                          height="auto"
                          minHeight={isCollapsedOutput ? "40px" : "100px"}
                          maxHeight="200px"
                          readOnly={true}
                          extensions={[
                            json(),
                            EditorView.lineWrapping, // 启用换行
                            indentationMarkers({
                              hideFirstIndent: false,
                              markerType: "fullScope",
                              thickness: 1,
                              colors: {
                                light: "#E8E8E8",
                                dark: "#404040",
                                activeLight: "#C0C0C0",
                                activeDark: "#606060"
                              }
                            })
                          ]}
                          theme={codemirrorThemeGray}
                          basicSetup={{
                            lineNumbers: false,
                            foldGutter: false,
                            highlightActiveLine: false,
                            searchKeymap: false
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "元数据" && (
                  <div className="metadata-content">
                    {/* Metadata 部分 - 只在有数据时显示 */}
                    {currentDetail.metadata && currentDetail.metadata.length > 0 ? (
                      <>
                        <TimeLine record={currentDetail.metadata} extraSkillInfo={extraSkillInfo} />
                        <div size="small" className="metadata-card">
                          <div className="section-header">
                            <div className="text-[14px] font-[500] color-[#181B25] flex items-center">
                              Metadata
                              <SectionActions
                                onCopy={handleCopy}
                                copyData={currentDetail.metadata}
                                copyType="元数据"
                                onExpand={handleExpandMeta}
                                onToggleCollapse={handleToggleCollapseMeta}
                                isCollapsed={isCollapsedMeta}
                              />
                            </div>
                          </div>
                          <div className="section-content" style={{ textAlign: "left" }}>
                            <CodeMirror
                              value={!isCollapsedMeta ? metaData : "元数据"}
                              height="auto"
                              minHeight={isCollapsedMeta ? "40px" : "150px"}
                              maxHeight="400px"
                              readOnly={true}
                              extensions={[
                                json(),
                                EditorView.lineWrapping, // 启用换行
                                indentationMarkers({
                                  hideFirstIndent: false,
                                  markerType: "fullScope",
                                  thickness: 1,
                                  colors: {
                                    light: "#E8E8E8",
                                    dark: "#404040",
                                    activeLight: "#C0C0C0",
                                    activeDark: "#606060"
                                  }
                                })
                              ]}
                              theme={codemirrorThemeGray}
                              basicSetup={{
                                lineNumbers: false,
                                foldGutter: false,
                                highlightActiveLine: false,
                                searchKeymap: false
                              }}
                              className="metadata-code-mirror"
                              style={{ textAlign: "left" }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="no-metadata flex items-center justify-center h-[200px]">
                        <CustomEmpty description="暂无元数据信息" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-detail">
              <Text type="secondary">请选择左侧节点查看详情</Text>
            </div>
          )}
        </div>
      </div>

      {/* 放大展示模态框 */}
      <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={1000} footer={null}>
        <CodeMirror
          className="mt-8"
          value={fullContent.content}
          height="auto"
          minHeight="100px"
          readOnly={true}
          extensions={[
            json(),
            EditorView.lineWrapping, // 启用换行
            indentationMarkers({
              hideFirstIndent: false,
              markerType: "fullScope",
              thickness: 1,
              colors: {
                light: "#E8E8E8",
                dark: "#404040",
                activeLight: "#C0C0C0",
                activeDark: "#606060"
              }
            })
          ]}
          theme={codemirrorThemeGray}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            searchKeymap: false
          }}
        />
        <div className="absolute top-[70px] right-8">
          <Iconfont
            onClick={() => handleCopy(fullContent.content, fullContent.type)}
            type="icon-fuzhi"
            className="operate-icon mr-2"
          />
        </div>
      </Modal>
    </div>
  )
}
