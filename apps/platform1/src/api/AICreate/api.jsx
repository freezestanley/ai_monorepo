import { Get, Post, Put, Delete } from "@/api/server"
import { botPrefix } from "@/constants"
import { isStudio } from "@/config.env"

const prefix = botPrefix

/**
 * 获取历史会话
 * GET /session/session/messages-for-generating-skill
 * @param {*} params
 */
export const fetchSessionMessages = (params) => {
  return Get(`${prefix}/session/session/messages-for-generating-skill`, params).then(
    (res) => res.data
  )
}

/**
 * 【增C】保存智能创建工作流
 * POST /admin/bot/skill/{versionNo}/save-generating-skill-def
 * @param {*} params
 */
export const saveGeneratingSkillDef = ({ versionNo, skillNo, ...data }) => {
  const url = isStudio()
    ? `${prefix}/admin/bot/skill/${skillNo}/${versionNo}/save-generating-skill-def`
    : `${prefix}/admin/bot/skill/${versionNo}/save-generating-skill-def`
  return Post(url, data).then((res) => res)
}

/**
 * 拉取工作流定义内容
 * GET /admin/bot/{skillNo}/version/query-generating-skill-def
 * @param {*} params
 */
export const fetchSkillDefinition = ({ skillNo, ...params }) => {
  return Get(`${prefix}/admin/bot/${skillNo}/version/query-generating-skill-def`, params).then(
    (res) => res.data
  )
}

/**
 * 请求生成CHAT
 * POST /bots/{botNo}/{skillNo}/{skillVersionNo}/chat-for-generating-skill
 * @param {*} params
 */
export const generateCodeChat = ({ botNo, skillNo, skillVersionNo, ...data }) => {
  return Post(
    `${prefix}/bots/${botNo}/${skillNo}/${skillVersionNo}/chat-for-generating-skill`,
    data
  ).then((res) => res)
}

/**
 * 添加工作流/工具/知识库
 * POST /admin/bot/{skillNo}/version/{versionNo}/save-tools
 * @param {*} params
 */
export const addSkillOrPluginOrKnowledgeBase = ({ skillNo, versionNo, ...data }) => {
  return Post(`${prefix}/admin/bot/${skillNo}/version/${versionNo}/save-tools`, data).then(
    (res) => res
  )
}

/**
 * 拉取queryTools
 * GET /admin/bot/{skillNo}/version/{versionNo}/query-tools
 * @param {*} params
 */
export const fetchQueryTools = ({ skillNo, versionNo, ...params }) => {
  return Get(`${prefix}/admin/bot/${skillNo}/version/${versionNo}/query-tools`, params).then(
    (res) => res.data
  )
}

/**
 * 调试AI创建流程
 * POST /bots/bots/{botNo}/{skillNo}/{skillVersionNo}/debug-generating-skill
 * @param {*} params
 */
export const debugGeneratingSkill = ({ botNo, skillNo, skillVersionNo, ...data }) => {
  return Post(
    `${prefix}/bots/${botNo}/${skillNo}/${skillVersionNo}/debug-generating-skill`,
    data
  ).then((res) => res)
}
