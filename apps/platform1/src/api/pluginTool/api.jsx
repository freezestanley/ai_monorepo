import { Get, Post, Put, Delete, Patch } from "@/api/server"
import { botPrefix } from "@/constants"

/***
 * GET /admin/bot/{pluginNo}/{toolNo}/toolInfo
 */
export const fetchToolInfo = ({ pluginNo, toolNo }) => {
  return Get(`${botPrefix}/admin/bot/${pluginNo}/${toolNo}/toolInfo`).then((res) => res.data || {})
}

/**
 * GET /admin/{botNo}/plugin/base/{pluginNo}
 */
export const fetchPluginInfo = ({ botNo, pluginNo }) => {
  return Get(`${botPrefix}/admin/${botNo}/plugin/base/${pluginNo}`).then((res) => res.data || {})
}

/***
 * GET /admin/bot/{pluginNo}/tool/listByPage
 */
export const fetchToolList = ({ pluginNo, ...data }) => {
  return Post(`${botPrefix}/admin/bot/${pluginNo}/tool/listByPage`, data).then(
    (res) => res.data || {}
  )
}

/***
 * POST /admin/bot/{pluginNo}/tool/operate
 */
export const updateToolStatus = ({ pluginNo, ...data }) => {
  return Post(`${botPrefix}/admin/bot/${pluginNo}/tool/operate`, data).then((res) => res || {})
}

/***
 * POST /admin/{botNo}/{pluginNo}/tool/save
 */
export const saveTool = ({ botNo, pluginNo, ...data }) => {
  return Post(`${botPrefix}/admin/${botNo}/${pluginNo}/tool/save`, data).then((res) => res || {})
}

/***
 * POST /admin/bot/{pluginNo}/{toolNo}/inputVariables/save
 */
export const saveInputVariables = ({ pluginNo, toolNo, ...data }) => {
  return Post(`${botPrefix}/admin/bot/${pluginNo}/${toolNo}/inputVariables/save`, data).then(
    (res) => res || {}
  )
}

/***
 * POST /admin/bot/{pluginNo}/{toolNo}/outputVariables/save
 */
export const saveOutputVariables = ({ pluginNo, toolNo, ...data }) => {
  return Post(`${botPrefix}/admin/bot/${pluginNo}/${toolNo}/outputVariables/save`, data).then(
    (res) => res || {}
  )
}

/***
 * POST /admin/bot/{pluginNo}/{toolNo}/debug
 */
export const debugTool = ({ pluginNo, toolNo, ...data }) => {
  return Post(`${botPrefix}/admin/bot/${pluginNo}/${toolNo}/debug`, data).then((res) => res || {})
}

/**
 * GET /admin/bot/{botNo}/getAvailablePluginTools
 */
export const fetchAvailablePluginTools = ({ botNo, ...params }) => {
  return Get(`${botPrefix}/admin/bot/${botNo}/getAvailablePluginTools`, params).then(
    (res) => res.data || {}
  )
}

/**
 * POST /admin/{pluginNo}/mcpToolList
 * 获取MCP工具列表
 */
export const fetchMcpToolList = ({ pluginNo }) => {
  return Post(`${botPrefix}/admin/${pluginNo}/mcpToolList`).then((res) => res || {})
}

/**
 * POST /admin/{botNo}/{pluginNo}/mcpToolInit
 * 初始化MCP工具
 */
export const initMcpTool = ({ botNo, pluginNo, data }) => {
  return Post(`${botPrefix}/admin/${botNo}/${pluginNo}/mcpToolInit`, data).then((res) => res || {})
}

export const fetchPluginToolReference = (params) => {
  const { botNo, pluginNo, toolNo } = params
  return Get(`${botPrefix}/admin/${botNo}/${pluginNo}/${toolNo}/getReferences`).then(
    (res) => res || {}
  )
}
