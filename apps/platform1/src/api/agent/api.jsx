import { Get, Post, Put, Delete, Upload } from "@/api/server"
import { botPrefix } from "@/constants"
import { getTokenAndServiceName } from "../sso"
import { customDownload } from "@/utils"
import { message } from "antd"
import { isStudio } from "@/config.env"
const prefix = botPrefix

/**
 * 【增C】创建agent
 */
export const createAgent = ({ botNo, ...data }) => {
  return Post(`${prefix}/admin/${botNo}/agents`, data).then((res) => res)
}

/**
 * 【增C】新增agent
 */
export const addAgent = ({ botNo, ...data }) => {
  return Post(`${prefix}/admin/${botNo}/agent/add`, data).then((res) => res)
}

/**
 * 【查R】拉取agent列表
 * @param {*} params
 */
export const fetchAgentListByPage = ({ botNo, ...params }) => {
  return Get(`${prefix}/admin/${botNo}/agents`, params).then((res) => res)
}

/**
 * 【查R】拉取agent列表（只有可用已发布状态的列表）
 * @param {*} params
 */
export const fetchAgentListForReleased = ({ botNo, ...params }) => {
  return Get(`${prefix}/bots/${botNo}/agents`, params).then((res) => res.data)
}

/**
 * 【改U】更新agent
 */
export const updateAgent = ({ botNo, agentNo, ...data }) => {
  return Put(`${prefix}/admin/${botNo}/agents/${agentNo}`, data).then((res) => res)
}

/**
 * 【改U】更新agent（新）
 */
export const updateAgentNew = ({ botNo, agentNo, ...data }) => {
  return Put(`${prefix}/admin/${botNo}/agent/${agentNo}/update`, data).then((res) => res)
}

/**
 * 【删D】删除agent
 */
export const deleteAgent = ({ botNo, agentNo, ...restParams }) => {
  return Delete(`${prefix}/admin/${botNo}/agents/${agentNo}`, restParams).then((res) => res)
}

/**
 * 【删D】删除agent（新）
 */
export const deleteAgentByNo = ({ botNo, agentNo }) => {
  return Delete(`${prefix}/admin/${botNo}/agent/delete/${agentNo}`).then((res) => res)
}

/**
 * 【增C】复制agent
 */
export const copyAgent = ({ botNo, agentNo }) => {
  return Post(`${prefix}/admin/${botNo}/agent/${agentNo}/copy`).then((res) => res)
}

/**
 * 导入agent版本地址
 */
export const importAgentUrl = ({ agentNo, versionNo }) => {
  return `${prefix}/admin/agents/${agentNo}/versions/${versionNo}/import`
}

/**
 * 导出agent版本
 */
export const exportAgent = ({ agentNo, versionNo, defaultFilename, ...data }) => {
  return fetch(`${prefix}/admin/agents/${agentNo}/versions/${versionNo}/export`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token
    }
  }).then((res) =>
    res.blob().then((blob) => {
      customDownload({
        blob,
        defaultFilename: defaultFilename ?? `${agentNo}-${versionNo}-copy.json`
      })
    })
  )
}

/**
 * 导出Agent API文档
 * @param {Object} params
 * @param {string} params.agentNo
 * @param {boolean} [params.previewMode] - true: 只返回html文本用于预览，false: 直接下载
 * @returns {Promise<string|void>} previewMode=true时返回html字符串，否则无返回值
 */
export const exportAgentApiDoc = async ({
  botNo,
  studioenv,
  agentNo,
  skillNo,
  previewMode = false
}) => {
  if (!agentNo) return
  const res = await fetch(`${prefix}/admin/agent/${agentNo}/version/exportApiDoc`, {
    method: "POST",
    body: JSON.stringify({ agentNo, skillNo }),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token,
      ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
    }
  })
  if (previewMode) {
    // 预览模式，返回html字符串
    return await res.text()
  } else {
    // 下载模式，和原来一样
    const blob = await res.blob()
    // 处理文件名
    let fileName = "AgentApiDoc.html"
    const disposition = res.headers.get("content-disposition")
    if (disposition) {
      const match = disposition.match(/filename="?([^";]+)"?/)
      if (match) fileName = decodeURIComponent(match[1])
    }
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }
}

// agent-版本载入
// `${prefix}/admin/agents/${agentNo}/versions/${versionNo}/enable`

export const copyAgentVersionNo = ({ agentNo, versionNo, ...data }) => {
  return Post(`${prefix}/admin/agents/${agentNo}/versions/${versionNo}/load`, data).then(
    (res) => res
  )
}

/**
 * 拉取agent版本
 * /admin/agents/{agentNo}/versions/latest
 */
export const fetchAgentVersion = (params) => {
  const { agentNo, ...restParams } = params
  return Get(`${prefix}/admin/agents/${agentNo}/versions/latest`, restParams).then(
    (res) => res.data || {}
  )
}

/**
 * 【改U】保存agent版本
 */
export const saveAgentVersion = ({ agentNo, versionNo, ...data }) => {
  return Post(`${prefix}/admin/agent/${agentNo}/version/${versionNo}/save`, data).then((res) => res)
}

/**
 * 【增C】发布agent版本
 */
export const releaseAgent = ({ agentNo, versionNo, ...restParams }) => {
  return Put(`${prefix}/admin/agents/${agentNo}/versions/${versionNo}/release`, restParams).then(
    (res) => res
  )
}

export const releaseAgentPro = ({ agentNo, versionNo, ...restParams }) => {
  return Put(`${prefix}/admin/agent/${agentNo}/version/${versionNo}/release`, restParams).then(
    (res) => res
  )
}

/**
 * 【查R】拉取agent版本列表
 */
export const fetchAgentVersionList = ({ agentNo }) => {
  return Get(`${prefix}/admin/agents/${agentNo}/versions`).then((res) => res.data)
}

/**
 * 【删D】删除agent指定版本
 */
export const deleteAgentVersion = ({ agentNo, versionNo }) => {
  return Delete(`${prefix}/admin/agents/${agentNo}/versions/${versionNo}`).then((res) => res)
}

/**
 * 【U】使用agent指定版本
 */
export const enableAgentVersion = ({ agentNo, versionNo }) => {
  return Post(`${prefix}/admin/agents/${agentNo}/versions/${versionNo}/setToCurrent`).then(
    (res) => res
  )
}

/**
 * 【改U】设为当前agent版本
 * @param {Object} params
 * @param {string} params.agentNo
 * @param {string} params.versionNo
 */
export const enableAgentReleaseVersion = ({ agentNo, versionNo }) => {
  return Put(`${prefix}/admin/agent/${agentNo}/version/${versionNo}/enable`)
}

// 获取Agent列表
export const fetchAgentList = ({ botNo, agentName, agentMode, ...restParams }) => {
  return Post(`${prefix}/admin/${botNo}/agent/list`, {
    agentName,
    agentMode,
    ...restParams
  }).then((res) => res.data)
}

/**
 * 【查R】获取agent最新版本详情
 */
export const getAgentLatestVersion = (agentNo, params) => {
  return Get(`${prefix}/admin/agent/${agentNo}/version/latest`, params).then((res) => res)
}

export const getAgentInUseVersion = (agentNo, params) => {
  return Get(`${prefix}/admin/agent/${agentNo}/version/inUse`, params).then((res) => res)
}

// AGENT锁-上锁
export const lockAgent = ({ botNo, agentNo }) => {
  return Put(`${prefix}/admin/${botNo}/agent/${agentNo}/lock`).then((res) => res)
}

// AGENT锁-开锁
export const unlockAgent = ({ botNo, agentNo }) => {
  return Put(`${prefix}/admin/${botNo}/agent/${agentNo}/unlock`).then((res) => res)
}

/**
 * 【查R】获取agent最新调试会话ID
 */
export const fetchLatestDebugSession = ({ botNo, agentNo, agentVersionNo }) => {
  return Get(`${prefix}/session/session/agent-latest-debug-session`, {
    botNo,
    agentNo,
    agentVersionNo
  }).then((res) => res.data)
}

/**
 * 【查R】获取会话聊天记录
 */
export const fetchSessionMessages = (sessionId, botNo) => {
  return Get(`${prefix}/openapi/session/${sessionId}/messages`, {
    pageSize: 100,
    pageNum: 1,
    botNo
  }).then((res) => res)
}

export const fetchSessionAgentOsMessages = (sessionId) => {
  return Get(`${prefix}/session/session/${sessionId}/agent-messages`, {
    pageSize: 100,
    pageNum: 1
  }).then((res) => res)
}

/**
 * 【查R】获取调试会话列表
 */
export const fetchDebugSessions = ({ ...data }) => {
  return Post(`${prefix}/admin/sessionResponse/CALL_RECORDS`, data).then((res) => res.data)
}

/**
 * 【查R】获取调试执行详情
 */
export const fetchDebugExecuteProcess = ({ botNo, requestId, requestTime }) => {
  return Get(`${prefix}/admin/sessionResponse/execute-process`, {
    botNo,
    requestId,
    requestTime
  }).then((res) => res.data)
}

/**
 * 【改U】切换Agent类型
 */
export const changeAgentType = ({ agentNo, versionNo, type }) => {
  return Put(`${prefix}/admin/agent/${agentNo}/version/${versionNo}/changeType/${type}`).then(
    (res) => res
  )
}

/**
 * 【改U】更新工具授权状态
 */
export const updateToolApprove = ({ agentNo, versionNo, ...data }) => {
  return Put(`${prefix}/admin/agent/${agentNo}/version/${versionNo}/updateToolApprove`, data).then(
    (res) => res
  )
}

export const appendAgentMemory = (sessionId, data) => {
  return Post(`${prefix}/session/session/${sessionId}/append-agent-memory`, data)
}

export const trainMetaAgent = ({ botNo, agentNo, versionNo }) => {
  return Post(`${prefix}/bots/${botNo}/agents/${agentNo}/${versionNo}/train`)
}

export const fetchTrainsetList = ({ botNo, agentNo, versionNo }) => {
  return Get(`${prefix}/bots/${botNo}/agents/${agentNo}/${versionNo}/trainset`)
}

export const fetchTrainProgress = ({ botNo, taskId, agentNo, versionNo }) => {
  return Post(`${prefix}/bots/${botNo}/agents/${agentNo}/${versionNo}/${taskId}/train-progress`)
}

export const fetchMetaAgentModels = ({ botNo }) => {
  return Get(`${prefix}/bots/${botNo}/agents/meta-agent-models`).then((res) => res.data)
}

export const fetchAgentLockInfo = ({ botNo, agentNo }) => {
  return Get(`${prefix}/admin/${botNo}/agent/${agentNo}/lockInfo`).then((res) => res.data)
}

/**
 * 【增C】全链路复制agent
 */
export const deepCopyAgent = ({ botNo, agentNo }) => {
  return Post(`${prefix}/admin/${botNo}/agent/${agentNo}/deepCopy`).then((res) => res)
}

/**
 * 【查R】获取全局常量分页列表
 * @param {Object} params
 * @param {string} params.botNo
 * @param {string} params.agentNo
 * @param {number} params.pageNum
 * @param {number} params.pageSize
 * @param {string} [params.query]
 */
export const fetchAgentConstantList = (params) => {
  return Get(
    `${prefix}/admin/${params?.botNo}/agent/${params?.agentNo}/constant/page`,
    params
  ).then((res) => res.data)
}

/**
 * 【查R】获取工作流关系列表
 * @param {Object} params
 * @param {string} params.botNo
 * @param {string} params.agentNo
 */
export const fetchAgentSkillRelationList = (params) => {
  return Post(`${prefix}/admin/${params.botNo}/agent/${params.agentNo}/skillList`, params).then(
    (res) => res.data
  )
}

/**
 * 【查R】获取Agent历史发布版本列表
 * @param {Object} params
 * @param {string} params.agentNo
 */
export const fetchAgentReleaseVersionList = ({ agentNo }) => {
  return Post(`${prefix}/admin/agent/${agentNo}/version/listReleaseVersion`, { agentNo }).then(
    (res) => res
  )
}

/**
 * 【删D】删除agent历史发布版本
 * @param {Object} params
 * @param {string} params.agentNo
 * @param {string} params.versionNo
 */
export const deleteAgentReleaseVersion = ({ agentNo, versionNo }) => {
  return Delete(`${prefix}/admin/agent/${agentNo}/version/${versionNo}`)
}

// 载入历史版本
export const getAgentReleaseVersionByVersionNo = ({ agentNo, versionNo }) => {
  console.log("getAgentReleaseVersionByVersionNo =>>> ", agentNo, versionNo)
  return Put(`${prefix}/admin/agent/${agentNo}/version/${versionNo}/getByVersionNo`).then(
    (res) => res
  )
}

/**
 * 【查R】判断当前用户是否为bot管理员
 * @param {Object} params
 * @param {string} params.botNo
 * @returns {Promise<Object>} 后端返回的数据，data为true表示是管理员
 */
export const isAdmin = ({ botNo }) => {
  return Get(`${prefix}/admin/authUser/isAdmin`, { botNo }).then((res) => res)
}

// 载入历史版本
export const loadAgentVersion = ({ agentNo, versionNo }) => {
  return Put(`${prefix}/admin/agent/${agentNo}/version/${versionNo}/loadAgentVersion`).then(
    (res) => res
  )
}

// 查询agent的工作流列表
export const fetchWorkerSkills = ({ agentNo, botNo }) => {
  return Post(`${prefix}/admin/${botNo}/agent/${agentNo}/workerSkills`).then((res) => res.data)
}

// 批量保存AB实验
export const batchSaveABExperiment = (params) => {
  return Post(`${prefix}/admin/bot/ab-experiment/batchSave`, params).then((res) => res)
}

// 分页查询AB实验
export const fetchABExperimentPage = (params) => {
  return Get(`${prefix}/admin/bot/ab-experiment/page`, params).then((res) => res.data)
}

/**
 * 【增C】导入agent版本
 * @param {Object} params
 * @param {string} params.agentNo
 * @param {string} params.versionNo
 * @param {FormData} params.formData
 */
export const importAgentVersion = ({ agentNo, versionNo, formData }) => {
  return Upload(
    `${prefix}/admin/agent/${agentNo}/version/${versionNo}/importAgentVersion`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  )
}

/**
 * 【增C】导出agent版本
 * @param {Object} params
 * @param {string} params.agentNo
 * @param {string} params.versionNo
 * @param {FormData} params.formData
 */
export const exportAgentVersion = ({
  botNo,
  studioenv,
  agentNo,
  versionNo,
  defaultFilename,
  ...data
}) => {
  return fetch(`${prefix}/admin/agent/${agentNo}/version/${versionNo}/export`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token,
      ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
    }
  }).then((res) =>
    res.blob().then((blob) => {
      customDownload({
        blob,
        defaultFilename: defaultFilename ?? `${agentNo}-${versionNo}.json`
      })
    })
  )
}
