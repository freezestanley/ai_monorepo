import React, { useState, useEffect, useMemo } from "react"
import NavIcon from "@/assets/img/nav.png"
import checkIcon from "@/assets/img/check.png"
import { Spin, Button, Input } from "antd"
import { LoadingOutlined, DownOutlined, RightOutlined } from "@ant-design/icons"
import MDEditor from "@uiw/react-md-editor"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"

// 主布局组件
const SplitLayout = (props) => {
  const { selectedCluster, handleQueryClusterMatchTask, chatRecordData, startPolling } = props

  // 检测到打开且没有历史数据，获取数据
  useEffect(() => {
    if (!chatRecordData || chatRecordData?.length === 0) {
      handleQueryClusterMatchTask() // 查询匹配优化案例
    }
    startPolling()
  }, [selectedCluster])

  return (
    <div className="flex h-full">
      {/* 内容区域 */}
      {selectedCluster ? (
        <LeftPanel {...props} />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <CustomEmpty description={"暂无数据"} />
        </div>
      )}
    </div>
  )
}

// AI建议组件
const LeftPanel = (props) => {
  return (
    <div className="flex-1 p-4  overflow-y-auto relative h-full border-r border-solid border-gray-200 border-t-0 border-b-0 border-l-0">
      <div className="flex flex-col h-full mx-auto">
        {/* AI 建议卡片 */}
        <div className="flex-1 overflow-y-auto mb-4 pr-2">
          <AICard {...props} />
        </div>
      </div>
    </div>
  )
}

// AI 卡片组件
const AICard = (props) => {
  const {
    chatRecordData,
    isQueryMatchTaskLoading,
    selectedCluster,
    clusters,
    matchTask,
    handleUpdateSuggestion,
    isfetchingChat,
    refetchChatRecord
  } = props
  console.log("isfetchingChat------", isfetchingChat)
  const chatRecordMatchTask = chatRecordData?.find((item) => item.msgTypeCode === 2)?.content
  const chatRecordSuggestion = chatRecordData?.find((item) => item.msgTypeCode === 3)
  const recordMatchTask = chatRecordMatchTask ? JSON.parse(chatRecordMatchTask) : null
  const recordSuggestion = chatRecordSuggestion ? JSON.parse(chatRecordSuggestion?.content) : null
  const { total = 0, caseCount = 0 } = recordMatchTask || matchTask || {}

  const {
    badSessionPieces: badCases,
    goodSessionPieces: goodCases,
    suggestion
  } = recordSuggestion || {}

  const { adoptionStatusCode: adoptionStatus, id: suggestionId } = chatRecordSuggestion || {}

  const currentCluster = clusters.find((item) => item?.id === selectedCluster)

  // 控制优化建议检索的折叠状态
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(true)

  // 切换优化建议检索的折叠状态
  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed)
  }

  // 采纳建议
  const handleAccept = (suggestionId) => {
    handleUpdateSuggestion(suggestionId)
    setTimeout(() => {
      refetchChatRecord()
    }, 2000)
  }

  return (
    <div className="bg-white rounded-lg space-y-4">
      <span className="flex justify-end">
        <span className="font-medium bg-gray-100 rounded-md p-2 text-sm text-gray-700">
          {`AI 策略备忘录： 针对 "${currentCluster?.name}"的优化方案`}
        </span>
      </span>
      <div className="flex items-center space-x-2">
        {isQueryMatchTaskLoading && <img src={NavIcon} alt="nav" className="w-[24px] h-[24px]" />}
        <div className="flex-1 items-center gap-3  border border-solid border-gray-300 rounded-[8px] p-2">
          <div className="flex items-center justify-between gap-2 text-sm text-gray-600 flex-1">
            <div className="space-x-2">
              {isQueryMatchTaskLoading && (
                <Spin indicator={<LoadingOutlined spin />} size="small" />
              )}
              <span>{isQueryMatchTaskLoading ? "建议优化正在检索..." : "优化建议检索"}</span>
            </div>

            <div>
              <span className="text-gray-400">{total} 条历史记录</span>
              <button
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                onClick={toggleRightPanel}
              >
                {isRightPanelCollapsed ? <DownOutlined /> : <RightOutlined />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 优化建议检索 */}
      {isRightPanelCollapsed && (
        <div className="flex w-full justify-center">
          <RightPanelContent {...props} caseCount={caseCount} suggestion={suggestion} />
        </div>
      )}

      {/* md文档 */}
      <div>
        <MDEditor.Markdown
          source={suggestion}
          style={{
            wordBreak: "break-word",
            background: "transparent",
            border: "none",
            padding: "0",
            color: "#181B25",
            fontSize: "14px"
          }}
        />
      </div>
      {/* 好坏案例 */}
      <div className="flex w-full space-x-4">
        <div className="felx w-[50%] space-y-4">
          {badCases &&
            badCases.length > 0 &&
            badCases.map((item, index) => (
              <div key={index} className="bg-[rgba(255,235,236,0.5)] p-4 rounded-lg space-y-4">
                <div className="font-bold mb-2 text-[14px]">AI失败案例</div>
                <div className="text-[rgba(71,84,103,1)] text-[12px]">{item?.reasonAnalysis}</div>

                <div className="overflow-y-auto bg-white p-2 rounded-lg">
                  <div
                    className="h-full max-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: item?.sessionPiece }}
                    style={{
                      whiteSpace: "pre-wrap",
                      overflow: "auto"
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
        <div className="felx w-[50%] space-y-4">
          {goodCases &&
            goodCases.length > 0 &&
            goodCases.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg space-y-4"
                style={{ background: "linear-gradient(239.76deg, #FDFCFB -10.47%, #FFE3CC 100%)" }}
              >
                <div className="font-bold mb-2 text-[14px]">金牌话术</div>
                <div className="text-[rgba(71,84,103,1)] text-[12px]">{item?.reasonAnalysis}</div>
                <div className="overflow-y-auto bg-white p-2 rounded-lg">
                  <div
                    className="h-full max-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: item?.sessionPiece }}
                    style={{
                      whiteSpace: "pre-wrap",
                      overflow: "auto"
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className="w-full flex justify-end">
        {suggestion && (
          <Button
            type="primary"
            onClick={() => handleAccept(suggestionId)}
            disabled={adoptionStatus === 1}
            loading={isfetchingChat}
          >
            {adoptionStatus === 1 ? "已采纳" : "采纳"}
          </Button>
        )}
      </div>
    </div>
  )
}

// 输入区域组件
const InputArea = () => {
  const [inputValue, setInputValue] = useState("")

  return (
    <div className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        suffix={<Button>发送</Button>}
        placeholder="需要调整，试着对AI说..."
        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
      />
    </div>
  )
}

// 优化建议检索组件
const RightPanelContent = (props) => {
  const {
    isQueryMatchTaskLoading,
    debouncedStatus,
    selectedCluster,
    handleGenerateSuggestion,
    caseCount,
    suggestion
  } = props

  const isGenerating = useMemo(() => {
    return ![3, 4].includes(debouncedStatus)
  }, [debouncedStatus])

  const handleClickNext = () => {
    handleGenerateSuggestion() // 开始生成并轮询结果
  }

  const Tag = ({ icon, bgc, content }: { icon: React.ReactNode; bgc: string; content: string }) => {
    return (
      <div
        className="flex items-center justify-center h-[52px] rounded-[8px]"
        style={{ backgroundColor: bgc }}
      >
        <div className="flex items-center space-x-2">
          {icon}
          <div className="text-[14px] text-[#475467]">{content}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mb-4 space-y-4">
        <p className="text-sm text-gray-600 mb-2">目标集群：主动退保倾向与关系解除意图凸显</p>

        <div className="space-y-4">
          {/* <div>目标集群：{}</div> */}
          <div className="text-[18px] font-bold">第一步：智能匹配成功案例</div>
          <div>
            在<span className="font-bold">人工坐席历史会话库</span>
            中寻找包含相似问题且<span className="font-bold">最终成交</span>的会话：
          </div>
          {isQueryMatchTaskLoading ? (
            <Tag
              icon={<Spin indicator={<LoadingOutlined spin />} size="small" />}
              content={`正在检索`}
              bgc={"#F5F7FA"}
            />
          ) : (
            <Tag
              icon={<img src={checkIcon} alt="checkIcon" className="w-[20px] h-[20px]"></img>}
              content={`匹配完成！共找到${caseCount}个成功案例`}
              bgc={"#E0FAEC80"}
            />
          )}
        </div>
        {!isQueryMatchTaskLoading && (
          <div className="space-y-4">
            <div className="text-[18px] font-bold">第二步：对比学习与策略提炼</div>
            <div>
              AI即将开始深度分析，预计需要1～3分钟。完成后将生成结果，期间您可切换页面，结果保留返回即看
            </div>
            <div className="w-full flex justify-end pt-2">
              {selectedCluster && !suggestion && (
                <div>
                  <Button
                    type={!isGenerating ? "primary" : "link"}
                    loading={isGenerating}
                    style={{ transition: "all 0.3s ease-in-out" }} // 添加过渡效果
                    onClick={handleClickNext}
                  >
                    {isGenerating ? "正在生成优化建议..." : "下一步"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SplitLayout
