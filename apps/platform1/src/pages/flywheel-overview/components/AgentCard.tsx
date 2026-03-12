import { Cpu, Maximize2 } from "lucide-react"

interface AgentCardProps {
  title: string
  description: string
  prompt: string
  color: "rose" | "blue"
  lastEdited: string
  onExpand: () => void
  onHistory?: () => void
}

const AgentCard: React.FC<AgentCardProps> = ({
  title,
  description,
  prompt,
  color,
  lastEdited,
  onExpand
  // onHistory
}) => {
  const themeColor =
    color === "rose"
      ? "bg-rose-50 text-rose-600 border-rose-100"
      : "bg-blue-50 text-blue-600 border-blue-100"
  const dotColor = color === "rose" ? "bg-rose-500" : "bg-blue-500"

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      <div className="p-5 pb-3 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${themeColor} border`}
          >
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-800">{title}</h4>
            <span className="text-xs text-gray-400 font-mono">{lastEdited}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {/* <button
            onClick={onHistory}
            className="p-1.5 text-gray-400 hover:text-purple-600 rounded hover:bg-purple-50 transition-colors"
          >
            <History className="w-4 h-4" />
          </button> */}
        </div>
      </div>
      <div className="px-5 py-2">
        <div className="text-xs text-gray-500 leading-relaxed h-12 overflow-hidden">
          {description || "暂无描述"}
        </div>
      </div>
      <div className="px-5 py-3">
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 relative group/code">
          <div className="font-mono text-[10px] leading-4 text-gray-400 h-24 overflow-hidden opacity-80">
            {prompt}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
        </div>
      </div>
      <div className="p-4 pt-2 flex justify-end">
        <button
          onClick={onExpand}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${themeColor} hover:brightness-95`}
        >
          <Maximize2 className="w-4 h-4" />
          放大编辑
        </button>
      </div>
      <div className={`absolute top-0 left-0 right-0 h-1 ${dotColor}`}></div>
    </div>
  )
}
export default AgentCard
