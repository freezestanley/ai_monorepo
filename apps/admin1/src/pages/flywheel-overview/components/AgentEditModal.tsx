import React, { useState } from "react"
import { Cpu, X, History, Play, Terminal, Loader2, FileText, Send } from "lucide-react"

const AgentEditModal: React.FC<{
  title: string
  prompt: string
  onClose: () => void
  onSave: (val: string) => void
  onOpenHistory: () => void
}> = ({ title, prompt, onClose, onSave, onOpenHistory }) => {
  // Debugger State
  const [debugInput, setDebugInput] = useState("")
  const [debugOutput, setDebugOutput] = useState("")
  const [isRuningDebug, setIsRuningDebug] = useState(false)

  const processedValue = prompt?.replace(/\\n/g, "\n") // 替换\n字符串为真的换行符
  const [value, setValue] = useState(processedValue)

  const handleRunDebug = () => {
    if (!debugInput.trim()) return
    setIsRuningDebug(true)
    setDebugOutput("")

    // Mocking an AI call response based on delay
    setTimeout(() => {
      setIsRuningDebug(false)
      setDebugOutput(
        `{\n  "analysis": "Success",\n  "tag_id": "cat_l_3_1",\n  "confidence": 0.98,\n  "reasoning": "Detected explicit refusal of app download based on keyword 'complicated'."\n}`
      )
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              <p className="text-xs text-gray-500">提示词工程与调试控制台</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* <button
              onClick={onOpenHistory}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 px-3 py-1.5 rounded hover:bg-purple-50 transition-colors"
            >
              <History className="w-3 h-3" />
              版本历史
            </button> */}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split View Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Code Editor */}
          <div className="flex-1 flex flex-col bg-[#1e1e1e] border-r border-gray-700">
            <div className="bg-[#252526] px-4 py-2 text-[10px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-2 border-b border-gray-700">
              <FileText className="w-3 h-3" /> System Instruction (Prompt)
            </div>
            <textarea
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
              }}
              className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm leading-relaxed p-6 focus:outline-none resize-none custom-scrollbar"
            />
          </div>

          {/* RIGHT: Debugger */}
          <div className="w-[420px] bg-gray-50 flex flex-col border-l border-gray-200">
            <div className="bg-white px-4 py-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-gray-200">
              <Terminal className="w-3 h-3" /> 实时调试
            </div>

            <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
              {/* Input Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600">测试会话原文</label>
                <textarea
                  value={debugInput}
                  onChange={(e) => setDebugInput(e.target.value)}
                  className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none bg-white"
                  style={{ whiteSpace: "pre-wrap" }}
                  placeholder="在此输入一段客户对话或异议，测试 Agent 的识别结果..."
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleRunDebug}
                    disabled={!debugInput.trim() || isRuningDebug}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                  >
                    {isRuningDebug ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    运行测试
                  </button>
                </div>
              </div>

              {/* Output Area */}
              <div className="flex-1 flex flex-col">
                <label className="text-xs font-bold text-gray-600 mb-2">调试结果 (Output)</label>
                <div className="flex-1 bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-y-auto relative border border-gray-800">
                  {debugOutput ? (
                    <pre className="whitespace-pre-wrap">{debugOutput}</pre>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 italic">
                      暂无输出结果
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-white flex-shrink-0">
          <div className="text-xs text-gray-400">修改未保存时不会生效，建议先运行测试。</div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 border border-transparent"
            >
              取消
            </button>
            <button
              onClick={() => onSave(value)}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white font-bold shadow hover:bg-purple-700"
            >
              确认并应用
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentEditModal
