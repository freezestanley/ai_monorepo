// 话术分组颜色配置
// 每个颜色包含：主色（用于数字和边框）、浅色背景（用于数字背景）
export const SCRIPT_GROUP_COLORS = [
  {
    value: "#a481e6",
    label: "紫色",
    primary: "#a481e6",
    light: "#f3effd"
  },
  {
    value: "#4ade80",
    label: "绿色",
    primary: "#4ade80",
    light: "#dcfce7"
  },
  {
    value: "#60a5fa",
    label: "蓝色",
    primary: "#60a5fa",
    light: "#dbeafe"
  },
  {
    value: "#fb923c",
    label: "橙色",
    primary: "#fb923c",
    light: "#ffedd5"
  },
  {
    value: "#f472b6",
    label: "粉色",
    primary: "#f472b6",
    light: "#fce7f3"
  },
  {
    value: "#facc15",
    label: "黄色",
    primary: "#facc15",
    light: "#fef9c3"
  },
  {
    value: "#f87171",
    label: "红色",
    primary: "#f87171",
    light: "#fee2e2"
  },
  {
    value: "#94a3b8",
    label: "灰色",
    primary: "#94a3b8",
    light: "#f1f5f9"
  }
]

// 根据颜色值获取颜色配置
export const getColorConfig = (colorValue) => {
  return SCRIPT_GROUP_COLORS.find((color) => color.value === colorValue) || SCRIPT_GROUP_COLORS[0]
}

// 默认颜色
export const DEFAULT_COLOR = SCRIPT_GROUP_COLORS[0].value
