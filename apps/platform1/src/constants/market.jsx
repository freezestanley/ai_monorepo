/*
 * @Author: Dyton
 * @Date: 2024-04-16 20:31:45
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-23 18:56:59
 * @FilePath: /za-aigc-platform-admin-static/src/constants/market.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import Iconfont from "@/components/Icon"
import { SKILLICONTYPE } from "."
export const emptyIcon = "https://static.zhongan.com/website/cs/poseidon/empty.png"
export const marketCode = {
  ALL: "ALL",
  APP: "APP",
  SKILL: "SKILL",
  PLUG_IN: "PLUG_IN",
  ROBOT: "ROBOT",
  AGENT: "AGENT",
  TIMBRE: "TIMBRE",
  MODEL_SERIES: "MODEL_SERIES"
}

export const marketOptions = [
  {
    value: marketCode.ALL,
    label: "全部"
  },
  // {
  //   value: marketCode.APP,
  //   label: "应用"
  // },
  {
    value: marketCode.AGENT,
    label: "Agent"
  },
  {
    value: marketCode.SKILL,
    label: "工作流"
  },
  {
    value: marketCode.PLUG_IN,
    label: "工具"
  },
  {
    value: marketCode.ROBOT,
    label: "AI Lab"
  },
  {
    value: marketCode.TIMBRE,
    label: "声音"
  },
  {
    value: marketCode.MODEL_SERIES,
    label: "模型广场"
  }
]

export const marketObject = {
  [marketCode.ALL]: "全部",
  [marketCode.APP]: "应用",
  [marketCode.SKILL]: "工作流",
  [marketCode.PLUG_IN]: "工具",
  [marketCode.ROBOT]: "AI Lab",
  [marketCode.AGENT]: "Agent",
  [marketCode.TIMBRE]: "声音",
  [marketCode.MODEL_SERIES]: "模型广场"
}

/**
 * @description: 相关卡片主题色
 * @param {*} type
 * @return {*}
 */
export const getThemeConfig = (type) => {
  switch (type) {
    case marketCode.APP:
      return {
        color: "#7F56D9",
        hover: "#5cdbd3",
        border: "#b5f5ec",
        title: "应用",
        icon: <Iconfont type={"icon-yingyong"} />
      }
    case marketCode.PLUG_IN:
      return {
        color: "#1677ff",
        hover: "#4096ff",
        border: "#91caff",
        title: "工具",
        icon: <Iconfont type={"icon-chajian"} />
      }
    case marketCode.SKILL:
      return {
        color: "#7F56D9",
        hover: "#8b91fc",
        border: "#efdbff",
        title: "工作流",
        icon: <Iconfont type={"icon-APIjineng"} />
      }
    case marketCode.AGENT:
      return {
        color: "#7F56D9",
        hover: "#8b91fc",
        border: "#efdbff",
        title: "Agent",
        icon: <Iconfont type={"icon-APIjineng"} />
      }
    case marketCode.ROBOT:
      return {
        color: "#7F56D9",
        hover: "#7F56D9",
        border: "#b5f5ec",
        title: "AI Lab",
        icon: <Iconfont type={"icon-APIjineng"} />
      }
    case marketCode.TIMBRE:
      return {
        color: "#52c41a",
        hover: "#73d13d",
        border: "#b7eb8f",
        title: "声音",
        icon: <Iconfont type={"icon-shengyin"} />
      }
    case marketCode.MODEL_SERIES:
      return {
        color: "#fa8c16",
        hover: "#ffa940",
        border: "#ffd591",
        title: "模型广场",
        icon: <Iconfont type={"icon-moxing"} />
      }
    default:
      return {
        color: "#7F56D9",
        hover: "#8b91fc",
        border: "#efdbff",
        title: "",
        icon: <Iconfont type={"icon-APIjineng"} />
      }
  }
}

export const getIcon = (type, skillType) => {
  switch (type) {
    case marketCode.APP:
      return <Iconfont type={"icon-yingyong"} />
    case marketCode.PLUG_IN:
      return <Iconfont type={"icon-chajian"} />
    case marketCode.ROBOT:
      return <Iconfont type={"icon-jiqiren"} />
    case marketCode.SKILL:
      return <Iconfont type={SKILLICONTYPE?.[skillType ?? 3]} />
    case marketCode.TIMBRE:
      return <Iconfont type={"icon-shengyin"} />
    case marketCode.MODEL_SERIES:
      return <Iconfont type={"icon-moxing"} />
    default:
      return <Iconfont type={"icon-APIjineng"} />
  }
}

export const subtitleOptions = [
  { value: "AGENT", label: "众有灵犀 · 百业千面，随需而智" },
  { value: "SKILL", label: "众有灵犀 · 任务自治，效率自驱" },
  { value: "PLUG_IN", label: "众有灵犀 · 需求即达，使命必达" },
  { value: "ROBOT", label: "众有灵犀 · 所有AI智能体，一个指令调度" },
  { value: "TIMBRE", label: "众有灵犀 · 声音市集，音色丰富" },
  { value: "MODEL_SERIES", label: "众有灵犀 · 模型广场，智能选择" }
]
