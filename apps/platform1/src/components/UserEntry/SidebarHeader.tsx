import { useNavigate } from "react-router-dom"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import LogoIcon from "@/components/logoIcon"
import { useCollapsed } from "@/store"

interface SidebarHeaderProps {
  isCollapsed: boolean
}

export default function SidebarHeader({ isCollapsed }: SidebarHeaderProps) {
  const navigate = useNavigate()
  const changeCollapsed = useCollapsed((state) => state.changeCollapsed)

  return (
    <div
      className="h-16 flex items-center justify-between px-2 rounded-md cursor-pointer hover:bg-gray-50 transition-all shrink-0 group"
      onClick={() => navigate("/userEntry")}
    >
      <div className="flex items-center gap-2 transform group-hover:scale-[1.02] transition-transform duration-300">
        <div className="w-9 h-9 flex items-center justify-center">
          <LogoIcon />
        </div>
        {!isCollapsed && (
          <span className="font-black text-xl text-slate-800 tracking-tighter">众有灵犀</span>
        )}
      </div>
      <div
        role="button"
        tabIndex={0}
        className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all relative z-[10000] hover:bg-white hover:text-[var(--primary-color)] px-1 bg-[#f6f6f6]"
        onClick={(event) => {
          event.stopPropagation()
          changeCollapsed(!isCollapsed)
        }}
      >
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </div>
    </div>
  )
}
