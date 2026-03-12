import Iconfont from "@/components/Icon"

const styleItems = ["正式", "轻松", "活泼", "营销", "科普", "邮件", "文言", "诗歌"]

export const menuItemsConfig = [
  {
    label: "配图",
    icon: <Iconfont type={"icon-a-1peitu"} style={{ fontSize: 18 }} />
  },
  {
    label: "改写",
    icon: <Iconfont type={"icon-a-2gaixie"} style={{ fontSize: 18 }} />,
    submenu: styleItems
  },
  {
    label: "续写",
    icon: <Iconfont type={"icon-a-3xuxie"} style={{ fontSize: 18 }} />,
    submenu: styleItems
  },
  {
    label: "翻译",
    icon: <Iconfont type={"icon-a-4fanyi"} style={{ fontSize: 18 }} />,
    submenu: ["简体中文", "英文"]
  }
]
