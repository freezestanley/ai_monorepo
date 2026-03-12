import { useState } from "react"
import { Modal, Button, message } from "antd"
import { BulbOutlined, AppstoreOutlined, FileTextOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"

const VoiceModeSelectionModal = ({ visible, onConfirm, loading = false }) => {
  const navigator = useNavigate()
  const [selectedMode, setSelectedMode] = useState("")

  const handleConfirm = () => {
    if (!selectedMode) {
      message.warning("请选择一种语音模式")
      return
    }
    onConfirm(selectedMode)
  }

  const modeOptions = [
    {
      value: "voice_intelligent_mode",
      label: "Agentic",
      description: "基于AI智能对话的语音交互模式，自动理解意图",
      icon: <BulbOutlined style={{ fontSize: "20px" }} />,
      gradient: "from-blue-500 to-purple-600",
      bgColor: "#fff",
      borderColor: "!border-[#7F56D9]",
      hoverBorder: "hover:border-[#7F56D9]",
      selectedBorder: "border-blue-500",
      selectedBg: "bg-[#FCFAFF]"
    },
    {
      value: "voice_canvas_mode",
      label: "画布模式",
      description: "通过可视化画布设计对话流程，拖拽式编辑体验",
      icon: <AppstoreOutlined style={{ fontSize: "20px" }} />,
      gradient: "from-green-500 to-teal-600",
      bgColor: "#fff",
      borderColor: "!border-[#7F56D9]",
      hoverBorder: "hover:border-[#7F56D9]",
      selectedBorder: "border-green-500",
      selectedBg: "bg-[#FCFAFF]"
    },
    {
      value: "voice_script_mode",
      label: "剧本模式",
      description: "基于预设剧本的结构化对话，精确控制对话流程",
      icon: <FileTextOutlined style={{ fontSize: "20px" }} />,
      gradient: "from-orange-500 to-red-600",
      bgColor: "#fff",
      borderColor: "!border-[#7F56D9]",
      hoverBorder: "hover:border-[#7F56D9]",
      selectedBorder: "border-orange-500",
      selectedBg: "bg-[#FCFAFF]"
    }
  ]

  return (
    <Modal
      title={"选择语音模式"}
      open={visible}
      onOk={handleConfirm}
      onCancel={() => {
        navigator(-1)
      }}
      closable={false}
      maskClosable={false}
      keyboard={false}
      width={664}
      confirmLoading={loading}
      okText="确认选择"
      // cancelButtonProps={{ style: { display: "none" } }}
      // className="voice-mode-modal"
    >
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modeOptions.map((option) => (
            <div
              key={option.value}
              style={{
                border: `1px solid #ddd`
              }}
              className={`
                relative cursor-pointer transform transition-all duration-300 hover:scale-103
                ${
                  selectedMode === option.value
                    ? `${option.selectedBg} ${option.selectedBorder} ${option.borderColor}`
                    : `${option.bgColor}`
                }
                rounded-[8px] px-4 py-5 group
              `}
              onClick={() => setSelectedMode(option.value)}
            >
              {/* 图标 */}
              <div
                className={`
                w-10 h-10 mx-auto mb-4 rounded-full bg-[#D0D5DD]
                flex items-center justify-center text-white p-3
                ${selectedMode === option.value ? "scale-110 !bg-[#7F56D9]" : "group-hover:scale-105"}
                transition-transform duration-300
              `}
              >
                {option.icon}
              </div>

              {/* 标题 */}
              <h3
                className={`
                text-[16px] font-[500] text-center mb-3
              `}
              >
                {option.label}
              </h3>

              {/* 描述 */}
              <p className="text-[#475467] text-center text-[13px] leading-relaxed">
                {option.description}
              </p>

              {/* 装饰性元素 */}
              <div
                className={`
                absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300
                ${selectedMode === option.value ? "opacity-100" : "group-hover:opacity-50"}
                bg-gradient-to-r ${option.gradient}
              `}
                style={{
                  background: `linear-gradient(135deg, transparent 0%, transparent 85%, rgba(255,255,255,0.1) 100%)`
                }}
              />
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-left w-[100%]">
          <div className="inline-flex items-center px-4 py-2 bg-[#FFF1EB] border border-amber-200 rounded-[8px] w-[100%]">
            <svg className="w-5 h-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[#181B25] text-sm font-[400]">
              选择后将无法更改，请仔细考虑您的需求
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .voice-mode-modal .ant-modal-header {
          border-bottom: none;
          padding-bottom: 0;
        }
        .voice-mode-modal .ant-modal-body {
          padding-top: 0;
        }
      `}</style>
    </Modal>
  )
}

export default VoiceModeSelectionModal
