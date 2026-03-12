import { useMemo, useState } from "react"
import { Popover } from "antd"
import { InfoCircleFilled } from "@ant-design/icons"
import { ChevronDown, FileText, ExternalLink, LogOut } from "lucide-react"
import { SSOLogOut } from "@/api/sso"
import { useSSO } from "@/components/SSOProvider"
import { useCollapsed } from "@/store"
import manAvatar from "@/assets/img/newAvatorMan.png"
import womanAvatar from "@/assets/img/newAvatorGril.png"

const UserInfo = () => {
  const { userInfo } = useSSO()
  const isCollapsed = useCollapsed((state) => state.collapsed)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const content = useMemo(() => {
    return (
      <div className="w-[210px]">
        <div className="px-3 py-3 border-0 border-b border-solid border-gray-50 mb-1">
          <div className="flex items-center gap-3">
            <img
              className="w-10 h-10"
              src={userInfo?.sex === "男" ? manAvatar : womanAvatar}
              alt="user"
            />
            <div>
              <h2 className="text-sm font-black text-slate-800">{userInfo?.name}</h2>
              <span className="text-[10px] text-slate-400">{userInfo?.email}</span>
            </div>
          </div>
        </div>
        <div className="space-y-0.5 flex flex-col">
          <div
            onClick={(event) => {
              event.stopPropagation()
              setShowUserMenu(false)
              window.open(
                "https://doc.weixin.qq.com/doc/w3_Aa0AkwaeAKoCNIoNXqg7LSSGgMw0D?scode=AE4AywdQAA4dl7lorGAeAAKwbkAGk"
              )
            }}
            className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-50 hover:text-[#7958D2] transition-all"
          >
            <div className="w-[28px] h-[28px] flex items-center justify-center bg-blue-50 rounded-lg text-blue-500">
              <FileText size={16} />
            </div>
            <span>操作手册</span>
            <ExternalLink size={12} className="ml-auto opacity-30" />
          </div>
          <div
            onClick={(event) => {
              event.stopPropagation()
              setShowUserMenu(false)
              SSOLogOut()
            }}
            className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <div className="w-[28px] h-[28px] flex items-center justify-center bg-red-50 rounded-lg text-red-500">
              <LogOut size={16} />
            </div>
            <span>退出登录</span>
          </div>
        </div>
      </div>
    )
  }, [userInfo])

  const hasUserInfo = userInfo && Object.keys(userInfo).length > 0

  return (
    <div
      className={`border-0 border-t border-gray-100 border-solid shrink-0 relative ${
        isCollapsed ? "p-0 pt-4" : "p-0 pt-2"
      }`}
    >
      {hasUserInfo && (
        <Popover
          onOpenChange={setShowUserMenu}
          content={content}
          arrow={false}
          classNames={{ body: "!p-2" }}
          placement={isCollapsed ? "right" : "topLeft"}
        >
          {isCollapsed ? (
            <div
              className={`flex items-center justify-center rounded-xl hover:bg-gray-50 cursor-pointer transition-all ${
                showUserMenu ? "bg-gray-50 ring-1 ring-gray-100 shadow-sm" : ""
              }`}
            >
              <img
                className="w-9 h-9"
                src={userInfo?.sex === "男" ? manAvatar : womanAvatar}
                alt="user"
              />
            </div>
          ) : (
            <div
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-all ${
                showUserMenu ? "bg-gray-50 ring-1 ring-gray-100 shadow-sm" : ""
              }`}
            >
              <img
                className="w-9 h-9"
                src={userInfo?.sex === "男" ? manAvatar : womanAvatar}
                alt="user"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-slate-800 truncate">{userInfo?.name}</h2>
                <span className="text-[10px] text-slate-400 truncate font-medium">
                  {userInfo?.email}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-300 transition-transform duration-300 ${
                  showUserMenu ? "rotate-180 text-[#7958D2]" : ""
                }`}
              />
            </div>
          )}
        </Popover>
      )}
      {!isCollapsed && (
        <p className="flex items-center text-[12px] gap-1 mt-2 text-[#8F959E]">
          <InfoCircleFilled className="text-[#e6a819]" />
          请务必不要泄露公司和客户资料
        </p>
      )}
    </div>
  )
}

export default UserInfo
