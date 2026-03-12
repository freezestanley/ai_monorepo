import { Get, Post, Put, Delete, Patch } from "@/api/server"
import { botPrefix } from "@/constants"
import { message } from "antd"
import { getTokenAndServiceName } from "../sso"
import { customDownload } from "@/utils"
import { isStudio } from "@/config.env"

const prefix = botPrefix

// 查询工作流版本模板
export const fetchSkillTemplate = (params) => {
  return Post(`${prefix}/admin/skill/draft/skill/template/queryList`, params).then(
    (res) => res.data
  )
}

// 修改工作流
export const updateSkill = ({ skillNo, ...data }) => {
  return Put(`${prefix}/admin/bot/${skillNo}/update`, data).then((res) => res)
}

// 创建工作流并新增版本
export const createSkill = ({ botNo, ...data }) => {
  return Post(`${prefix}/admin/${botNo}/skill/insert`, data).then((res) => res)
}

// 获取dify token
export const fetchDifyToken = ({ botNo }) => {
  return Get(`${prefix}/bots/bot/${botNo}/difyToken`).then((res) => res)
}

// 分页查询
export const fetchSkillListByPage = (params) => {
  return Get(`${prefix}/admin/${params.botNo}/skill/listByPage`, params).then((res) => res.data)
}

// 分页查询已订阅工作流/组件列表
export const fetchSubscribeSkillListByPage = ({ botNo, ...params }) => {
  return Get(`${prefix}/admin/bot/${botNo}/page-subscribed-resource`, params).then(
    (res) => res.data
  )
}

// 更新已订阅工作流使用设置
export const updateSubscribeSkill = ({ botNo, skillNo, ...data }) => {
  return Post(`${prefix}/admin/${botNo}/${skillNo}/subscribe-settings`, data).then((res) => res)
}

// 工作流管理-查询 工作流/插件 共享设置
export const fetchShareSettings = ({ botNo, ...params }) => {
  return Get(`${prefix}/admin/bot/${botNo}/share/settings`, params).then((res) => res)
}

// 工作流管理-保存 工作流/插件 共享设置
export const updateShareSettings = ({ botNo, ...data }) => {
  return Put(`${prefix}/admin/bot/${botNo}/share/settings`, data).then((res) => res)
}

// SKILL版本-查询工作流最新版本的编排定义
export const fetchLatestDefinition = (skillNo, botNo) => {
  return Get(`${prefix}/admin/bot/${skillNo}/version/queryLatestDefinition`, {
    botNo
  }).then((res) => res.data)
}

// SKILL版本-获取全局变量
export const fetchGlobalVariable = (versionNo) => {
  return Get(`${prefix}/admin/bot/skill/${versionNo}/listGlobalVariable`).then((res) => res.data)
}

// SKILL版本-发布
export const releaseSkill = (params) => {
  const url = isStudio()
    ? `${prefix}/admin/bot/skill/${params.skillNo}/${params.versionNo}/release`
    : `${prefix}/admin/bot/skill/${params.versionNo}/release`
  return Put(url, params).then((res) => res)
}

// SKILL版本-保存定义
export const saveDefinition = ({ versionNo, ...data }) => {
  const url = isStudio()
    ? `${prefix}/admin/bot/skill/${data.skillNo}/${versionNo}/save`
    : `${prefix}/admin/bot/skill/${versionNo}/save`
  return Post(url, data).then((res) => res)
}

// SKILL版本-启用指定版本
export const enableSkill = ({ skillNo, versionNo }) => {
  return Put(`${prefix}/admin/bot/${skillNo}/${versionNo}/enable`).then((res) => res)
}
// SKILL-历史版本列表
export const fetchSkillVersionList = (skillNo) => {
  return Get(`${prefix}/admin/bot/skill/${skillNo}/list`).then((res) => res.data)
}

// SKILL-版本对比接口
export const fetchSkillVersionCompare = (skillNo, bizNo, componentType = "PROMPT_TEMPLATE") => {
  return Post(`${prefix}/admin/bot/${skillNo}/version/compare`, {
    skillNo,
    componentType,
    bizNo
  }).then((res) => res.data)
}

// SKILL-获取版本内容详情
export const fetchVersionContent = (extraInfo) => {
  return Get(`${prefix}/content`, { extraInfo }).then((res) => res.data)
}

// SKILL-获取指定版本内容详情
export const fetchSkillVersionContent = (extraInfo, componentType = "PROMPT_TEMPLATE") => {
  return Post(`${prefix}/admin/bot/skill/version/${extraInfo}/content`, { componentType }).then(
    (res) => res.data
  )
}

// SKILL-删除指定版本
export const deleteSkillVersion = (params) => {
  return Delete(`${prefix}/admin/bot/skill/${params.versionNo}`, params).then((res) => res)
}

// SKILL-另存为模板
export const saveAsTemplate = (params) => {
  return Post(
    `${prefix}/admin/bot/skill/${params.skillNo}/${params.versionNo}/saveAsTemplate`,
    params
  ).then((res) => res)
}

// SKILL-版本载入
export const copySkillVersionNo = ({ versionNo, skillNo, ...data }) => {
  const url = isStudio()
    ? `${prefix}/admin/bot/skill/${skillNo}/${versionNo}/copySkillVersionNo`
    : `${prefix}/admin/bot/skill/${versionNo}/copySkillVersionNo`
  return Post(url, data).then((res) => res)
}

// SKILL-查询基本信息
export const fetchSkillInfo = (skillNo) => {
  return Get(`${prefix}/admin/bot/${skillNo}/query`).then((res) => res.data)
}

// SKILL-删除
export const deleteSkill = (skillNo) => {
  return Delete(`${prefix}/admin/skill/${skillNo}`).then((res) => res)
}

// 工作流被应用于Agent时删除/停用提醒
export const fetchAgentReference = ({ skillNo }) => {
  return Get(`${prefix}/admin/bot/skill/${skillNo}/agentsReference`).then((res) => res)
}

// SKILL-复制
export const copySkill = ({ skillNo }) => {
  return Post(`${prefix}/admin/bot/${skillNo}/copy`).then((res) => res)
}

// SKILL-组件调试
// POST /{botNo}/{skillNo}/{versionNo}/{componentNo}/debug
// 这些将用SSE调用
export const debugComponent = ({ botNo, skillNo, versionNo, ...data }) => {
  return Post(`${prefix}/admin/bot/${botNo}/${skillNo}/${versionNo}/debug`, data).then((res) => res)
}

// SKILL-工作流调试
// POST /{botNo}/{skillNo}/{versionNo}/debug
export const debugSkill = ({ botNo, skillNo, versionNo, ...data }) => {
  return Post(`${prefix}/admin/bot/${botNo}/${skillNo}/${versionNo}/debug`, data).then((res) => res)
}

// SKILL锁-上锁
export const lockSkill = ({ skillNo }) => {
  return Put(`${prefix}/admin/bot/skill/${skillNo}/lock`).then((res) => res)
}

// SKILL锁-开锁
export const unlockSkill = ({ skillNo }) => {
  return Put(`${prefix}/admin/bot/skill/${skillNo}/unlock`).then((res) => res)
}

// 获取表格输出类型
//Get /dictionary/tableFileType
export const fetchTableFileType = () => {
  return Get(`${prefix}/dictionary/tableFileType`).then((res) => res.data)
}

//get /admin/bot/skill/{{skillNo}}/{{versionNo}}/import
export const importSkill = ({ skillNo, versionNo }) => {
  return `${prefix}/admin/bot/skill/${skillNo}/${versionNo}/import`
}

//get /admin/bot/skill/{{skillNo}}/{{versionNo}}/export
export const exportSkill = ({ botNo, studioenv, skillNo, versionNo, defaultFilename, ...data }) => {
  // 写成fetch获取文件流,并且post
  return fetch(`${prefix}/admin/bot/skill/${skillNo}/${versionNo}/export`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token,
      ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
    }
  }).then((res) =>
    res.blob().then(async (blob) => {
      customDownload({
        blob,
        defaultFilename: defaultFilename ?? `${skillNo}-${versionNo}-copy.json`
      })
    })
  )
}

export const exportApiSkill = ({ versionNo, studioenv, botNo, ...data }) => {
  // 写成fetch获取文件流,并且post
  // /admin/bot/skill/version/{skillVersionNo}/exportApiDoc
  return fetch(`${prefix}/admin/bot/skill/version/${versionNo}/exportApiDoc`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token,
      ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
    }
  }).then((res) => {
    const contentType = res.headers.get("Content-Type")
    // 如果contentType是json,则报错
    if (contentType.indexOf("application/json") !== -1) {
      return res.json().then((data) => {
        message.error(data.message)
      })
    }
    res.blob().then((blob) => {
      let link = document.createElement("a")
      link.href = window.URL.createObjectURL(blob)
      // 昵称为
      link.download = `api-${versionNo}.html`
      link.click()
      return true
    })
  })
}

// 新版获取全局变量
export const fetchGlobalVariableNew = (versionNo) => {
  return Get(`${prefix}/admin/bot/skill/${versionNo}/listVariables`).then((res) => res.data)
}

/**
 * GET /admin/bot/{botNo}/getAvailableSkills
 */
export const fetchAvailableSkills = ({ botNo, ...params }) => {
  return Get(`${prefix}/admin/bot/${botNo}/getAvailableSkills`, params).then((res) => res.data)
}

/**
 * GET /admin/bot/skill/bottomOption
 */
export const fetchBottomOption = () => {
  return Get(`${prefix}/admin/bot/skill/bottomOption`).then((res) => res.data)
}

// 删除模版
export const deleteTemplateSkill = (id) => {
  return Delete(`${prefix}/admin/skill/draft/skill/template/${id}/del`, {
    id
  }).then((res) => res.data)
}

// 获取是否启用重排序
export const fetchEnableRerank = ({ botNo, ...params }) => {
  return Get(`${prefix}/admin/bot/${botNo}/enable-rerank`, params).then((res) => res.data)
}

// 获取工作流用户列表
export const fetchSkillUserList = ({ botNo, skillNo, ...params }) => {
  return Get(`${prefix}/admin/${botNo}/skill/${skillNo}/userList`, params).then((res) => res.data)
}

export const fetchAgentUserList = ({ botNo, agentNo, ...params }) => {
  return Get(`${prefix}/admin/${botNo}/agent/${agentNo}/userList`, params).then((res) => res.data)
}
