import { useState, useMemo } from "react"
import { Dropdown, Modal, message } from "antd"
import { useChangeAgentType } from "@/api/agent"
import { updateFlowType } from "@/api/voiceAgent/api"
import { modeEnum } from "../detail"

const DetailAgentMode = ({
  mode,
  agentMode,
  setMode,
  fetchLatestVersion,
  agentDetail,
  isOnlyRead,
  isVoiceModeSelected = false
}) => {
  const [pendingMode, setPendingMode] = useState(null)
  const [isModeChangeModalVisible, setIsModeChangeModalVisible] = useState(false)
  const [isModeChanging, setIsModeChanging] = useState(false)

  const { mutate: changeAgentType } = useChangeAgentType()

  // 处理模式切换
  const handleModeChange = (newMode) => {
    if (newMode !== mode) {
      setPendingMode(newMode)
      setIsModeChangeModalVisible(true)
    }
  }

  // 获取当前模式的颜色
  const getCurrentModeColor = useMemo(() => {
    if (agentMode == 2) {
      switch (mode) {
        case "voice_intelligent_mode":
          return "bg-blue-500"
        case "voice_canvas_mode":
          return "bg-purple-500"
        case "voice_script_mode":
          return "bg-orange-500"
        default:
          return "bg-blue-500"
      }
    } else {
      switch (mode) {
        case "single_agent_llm_mode":
          return "bg-green-500"
        case "single_agent_skill_mode":
          return "bg-yellow-500"
        case "meta_agent_mode":
          return "bg-[#7f56d9]"
        default:
          return "bg-green-500"
      }
    }
  }, [agentMode, mode])

  // 根据agentMode生成模式菜单项
  const getModeMenuItems = useMemo(() => {
    if (agentMode == 2) {
      // 语音类型Agent的专用模式
      return [
        {
          key: "voice_intelligent_mode",
          label: (
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              <span>{modeEnum["voice_intelligent_mode"]}</span>
            </div>
          ),
          style: mode === "voice_intelligent_mode" ? { backgroundColor: "#F9F5FF" } : {}
        },
        {
          key: "voice_canvas_mode",
          label: (
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
              <span>{modeEnum["voice_canvas_mode"]}</span>
            </div>
          ),
          style: mode === "voice_canvas_mode" ? { backgroundColor: "#F9F5FF" } : {}
        },
        {
          key: "voice_script_mode",
          label: (
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
              <span>{modeEnum["voice_script_mode"]}</span>
            </div>
          ),
          style: mode === "voice_script_mode" ? { backgroundColor: "#F9F5FF" } : {}
        }
      ]
    } else {
      // 标准Agent的模式
      return [
        {
          key: "single_agent_llm_mode",
          label: (
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <span>{modeEnum["single_agent_llm_mode"]}</span>
            </div>
          ),
          style: mode === "single_agent_llm_mode" ? { backgroundColor: "#F9F5FF" } : {}
        },
        {
          key: "single_agent_skill_mode",
          label: (
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
              <span>{modeEnum["single_agent_skill_mode"]}</span>
            </div>
          ),
          style: mode === "single_agent_skill_mode" ? { backgroundColor: "#F9F5FF" } : {}
        }
        // {
        //   key: "meta_agent_mode",
        //   label: (
        //     <div className="flex items-center">
        //       <span className="w-2 h-2 rounded-full bg-[#7f56d9] mr-2"></span>
        //       <span>{modeEnum["meta_agent_mode"]}</span>
        //     </div>
        //   ),
        //   style: mode === "meta_agent_mode" ? { backgroundColor: "#F9F5FF" } : {}
        // }
      ]
    }
  }, [agentMode, mode])

  // 确认模式切换
  const confirmModeChange = async () => {
    if (pendingMode) {
      setIsModeChanging(true)
      try {
        // 使用新的API切换模式
        await changeAgentType(
          {
            agentNo: agentDetail?.agentNo,
            versionNo: agentDetail?.versionNo,
            type: pendingMode
          },
          {
            onSuccess: async (response) => {
              if (response.success) {
                // 如果是语音模式，还需要调用updateFlowType接口
                if (agentMode == 2) {
                  try {
                    // 根据模式映射flowType
                    let flowType = 1 // 默认画布模式
                    if (pendingMode === "voice_canvas_mode") {
                      flowType = 1 // 画布模式
                    } else if (pendingMode === "voice_script_mode") {
                      flowType = 2 // 剧本模式
                    } else if (pendingMode === "voice_intelligent_mode") {
                      flowType = 3 // Agentic
                    }

                    await updateFlowType({
                      botNo: agentDetail?.botNo,
                      agentNo: agentDetail?.agentNo,
                      agentVersionNo: agentDetail?.versionNo,
                      flowType
                    })
                  } catch (error) {
                    console.error("更新语音模板类型失败:", error)
                    // 这里不阻断主流程，只是记录日志
                  }
                }

                // 更新UI状态
                setMode(pendingMode)
                setPendingMode(null)
                setIsModeChangeModalVisible(false)
                message.success("模式切换成功")

                // 重新获取最新版本
                fetchLatestVersion()
              } else {
                message.error(response.message || "模式切换失败")
              }
            },
            onError: (error) => {
              message.error(error.message || "模式切换失败")
            }
          }
        )
      } finally {
        setIsModeChanging(false)
      }
    }
  }

  // 取消模式切换
  const cancelModeChange = () => {
    setPendingMode(null)
    setIsModeChangeModalVisible(false)
  }

  return (
    <>
      <Dropdown
        menu={{
          items: getModeMenuItems,
          onClick: ({ key }) => handleModeChange(key)
        }}
        disabled={
          mode === "meta_agent_mode" || isOnlyRead || (agentMode == 2 && isVoiceModeSelected)
        }
      >
        <div
          className={`ml-[20px] text-[14px] text-[#181B25] font-[400] flex items-center group ${mode === "meta_agent_mode" || isOnlyRead || (agentMode == 2 && isVoiceModeSelected) ? "cursor-not-allowed" : "cursor-pointer hover:text-[#7f56d9] "}`}
        >
          <span className="mr-1 flex items-center">
            <span className={`w-2 h-2 rounded-full ${getCurrentModeColor} mr-2`}></span>
            {modeEnum[mode]}
          </span>
          <span className="ml-[8px] flex flex-col">
            <i
              className={`iconfont icon-Up text-[10px] text-[#475467] font-[600] mt-[1px] ${mode === "meta_agent_mode" ? "" : "group-hover:text-[#7f56d9]"}`}
            ></i>
            <i
              className={`iconfont icon-Down text-[10px] text-[#475467] font-[600] -mt-[3px] ${mode === "meta_agent_mode" ? "" : "group-hover:text-[#7f56d9]"}`}
            ></i>
            {/* <UpOutlined className="text-[10px] text-[#475467] font-[600] mt-[1px] group-hover:text-[#7f56d9]" />
                      <DownOutlined className="text-[10px] text-[#475467] font-[600] -mt-[3px] group-hover:text-[#7f56d9]" /> */}
          </span>
        </div>
      </Dropdown>
      {/* Mode Change Confirmation Modal */}
      <Modal
        title="切换模式确认"
        open={isModeChangeModalVisible}
        onOk={confirmModeChange}
        onCancel={cancelModeChange}
        okText="确认"
        cancelText="取消"
        width={400}
        confirmLoading={isModeChanging}
      >
        <div className="py-2">
          <p className="mb-3">
            您确定要从
            <span className="font-medium">{modeEnum[mode]}</span>
            切换到
            <span className="font-medium">{modeEnum[pendingMode]}</span>
            吗？
          </p>
          {pendingMode === "meta_agent_mode" && (
            <p className="mb-3">切换后将无法切换回其他的模式！</p>
          )}
          <p className="text-[#475467]">切换模式后，当前内容会自动保存。</p>
        </div>
      </Modal>
    </>
  )
}

export default DetailAgentMode
