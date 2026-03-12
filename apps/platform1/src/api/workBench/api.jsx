// api.jsx
import { Get, Post } from "@/api/server"
import { botPrefix } from "@/constants"

// WORKBENCH-获取全部的工作台
export const fetchAllWorkbenches = (params) => {
  return Get(`${botPrefix}/admin/workbench/workbenchs`, params).then((res) => res.data)
}

// WORKBENCH-工作台绑定新的空间
export const bindBotToWorkbench = ({ workbenchNo, ...params }) => {
  return Post(`${botPrefix}/admin/workbench/${workbenchNo}/bindBots`, params).then((res) => res)
}

// WORKBENCH-查询空间
export const fetchBots = () => {
  return Get(`${botPrefix}/admin/workbench/bots`).then((res) => res.data)
}

export const fetchTTSAudioFormat = () => {
  return Get(`${botPrefix}/dictionary/ttsAudioFormat`).then((res) => res.data)
}
