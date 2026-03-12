// api.js
import { Get, Post, Upload } from "@/api/server"
import { voiceAgentPrefix } from "@/constants"
import { PAGE_CODE } from "@/constants/pageCode"
import axios from "axios"
import { getTokenAndServiceName } from "@/api/sso"

const fix = "/api/v1"

// 获取语音 agent 列表
export const getVoiceAgentList = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/task-config/page`, params)
}

// 创建或更新语音模板
export const createOrUpdateVoiceAgent = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/task-config/createOrUpdate`, params)
}

// 获取语音模板详情
export const getVoiceAgentDetail = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/task-config/detail`, params)
}

// 获取语音模板详情（支持agentNo参数）
export const getVoiceAgentDetails = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/task-config/detail`, params)
}

// 更新语音模板状态（启用/停用）
export const updateVoiceAgentStatus = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/task-config/statusUpdate`, params)
}

// 复制语音模板
export const copyVoiceAgent = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/task-config/copy`, params)
}

// 删除语音模板
export const deleteVoiceAgent = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/task-config/del`, params)
}

// 获取画布历史节点
export const getFlowConfigDetails = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/flow-config/detail`, params)
}

// 保存画布配置
export const saveFlowConfig = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/flow-config/save`, params)
}

// 创建或更新节点配置
export const createOrUpdateNodeConfig = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/node-config/createOrUpdate`, params)
}

// 已选择话术列表
export const getScriptList = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/script-config/selected/list`, params)
}

// 获取事件列表
export const getEventList = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/event-config/page`, params)
}

// 创建或更新事件
export const createOrUpdateEvent = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/event-config/createOrUpdate`, params)
}

// 删除事件
export const deleteEvent = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/event-config/del`, params)
}

// 获取意图筛选列表
export const getIntentionList = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/intention-config/list`, params)
}

// 保存新增意图
export const saveIntentionConfig = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/intention-config/save`, params)
}

// 获取话术列表（分页）
export const getScriptListByPage = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/script-config/page`, params)
}

// 保存选中的话术
export const saveSelectedScripts = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/script-config/selected/save`, params)
}

// 获取音色列表
export const getTimbreList = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/timbre-config/page`, params)
}

// 创建或更新音色
export const createOrUpdateTimbre = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/timbre-config/createOrUpdate`, params)
}

// 删除音色
export const deleteTimbre = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/timbre-config/del`, params)
}

// 语音合成
export const synthesisVoice = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/timbre-config/synthesis`, params)
}

// 保存话术类型
export const saveScriptType = (params, queryParams) => {
  // 构建查询参数字符串
  const { botNo, taskId, taskScriptId, scriptId, intentionType, faqCode } = queryParams
  let url = `${voiceAgentPrefix}${fix}/nlu/script-config/selected/script/save?botNo=${botNo}&taskId=${taskId}&taskScriptId=${taskScriptId}&scriptId=${scriptId}&intentionType=${intentionType}`

  // 如果有 faqCode 则添加到查询字符串
  if (faqCode) {
    url += `&faqCode=${faqCode}`
  }

  // 直接传递params，允许为null
  return Post(url, params)
}

// 删除已选择话术
export const deleteSelectedScript = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/script-config/selected/del`, params)
}

// 创建或更新话术
export const createOrUpdateScript = (params) => {
  if (params instanceof FormData) {
    return Upload(`${voiceAgentPrefix}${fix}/nlu/script-config/createOrUpdate`, params)
  }
  return Post(`${voiceAgentPrefix}${fix}/nlu/script-config/createOrUpdate`, params)
}

// 删除话术
export const deleteScript = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/script-config/del`, params)
}

// 更新agent和语音模板的映射关系
export const updateAgentMapping = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/agent/mapping/update`, params)
}

// 更新语音模板类型
export const updateFlowType = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/task-config/flowTypeUpdate`, params)
}

// 获取节点详情
export const getNodeConfigDetails = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/node-config/detail`, params)
}

// 获取标签配置列表（业务类型/标签）
export const getTagConfigList = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/tag-config/list`, params)
}

// 创建或更新标签配置（业务类型/标签）
export const createOrUpdateTagConfig = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/tag-config/createOrUpdate`, params)
}

// 获取话术详情
export const getScriptDetail = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/script-config/detail`, params)
}

// 语音文件上传
export const uploadVoiceFile = (formData) => {
  return Upload(`${voiceAgentPrefix}${fix}/nlu/script-config/voice/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
}

// // v2 => 话术列表
// export const getScriptListV2 = (params) => {
//   return Post(`${voiceAgentPrefix}${fix}/nlu/script-config/page`,// 创建模板工作流
export const createTemplateSkill = ({ botNo, agentNo, templateNo }) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/agent/createTemplateSkill`, {
    botNo,
    agentNo,
    templateNo
  })
}

// 获取FAQ关联话术详情
export const getFaqScriptInfo = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/intention-config/faq/info`, params)
}

// 保存FAQ关联话术
export const saveFaqScript = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/intention-config/faq/save`, params)
}

// 批量导出话术
export const exportScripts = (params) => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-service-name": "za-open-bot",
      "X-Usercenter-Session": getTokenAndServiceName().token
    },
    body: JSON.stringify(params)
  }

  return fetch(`${voiceAgentPrefix}${fix}/nlu/script-config/export`, requestOptions).then(
    (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 检查响应内容类型
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.indexOf("application/json") !== -1) {
        // 如果返回的是JSON，说明可能是错误信息
        return response.json().then((data) => {
          throw new Error(data.message || "导出失败")
        })
      }

      return response.blob().then((blob) => {
        // 检查blob大小
        if (blob.size === 0) {
          throw new Error("导出的文件为空")
        }
        return blob
      })
    }
  )
}

// 下载话术模板
export const downloadScriptTemplate = () => {
  return fetch(`${voiceAgentPrefix}${fix}/nlu/script-config/template/export`, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-service-name": "za-open-bot",
      "X-Usercenter-Session": getTokenAndServiceName().token
    }
  })
    .then((response) => {
      if (!response.ok) {
        // 检查响应内容类型
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          // 如果是JSON响应，说明是错误信息
          return response.json().then((errorData) => {
            throw new Error(errorData.message || "下载模板失败")
          })
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }
      return response.blob()
    })
    .then((blob) => {
      // 检查blob大小
      if (blob.size === 0) {
        throw new Error("模板文件为空")
      }
      return blob
    })
}

// 导入话术
export const importScripts = (formData) => {
  return Upload(`${voiceAgentPrefix}${fix}/nlu/script-config/import`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-service-name": "za-open-bot",
      "X-Usercenter-Session": getTokenAndServiceName().token
    }
  })
}

// 获取数据总览
export const getBoardOverview = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/board-config/overview`, params)
}

// 获取看板配置信息
export const getBoardConfigInfo = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/board-config/info`, params)
}

// 获取漏斗配置详情
export const getFunnelConfigDetail = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/board-config/analysis/config/query`, params)
}

// 创建或更新漏斗配置
export const createOrUpdateFunnelConfig = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/board-config/analysis/config/createOrUpdate`, params)
}

// 获取挂机阶段列表（点击漏斗图项时调用）
export const getOnHookStageList = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/board-config/onHookStage/list`, params)
}

// 删除语音数据面板配置
export const deleteBoardConfig = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/board-config/analysis/config/delete`, params)
}

// 获取音频追踪信息
export const getAudioTraceInfo = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/audio/trace/info`, params)
}

// 删除工作流录音
export const checkSkillDelete = (params) => {
  return Get(`${voiceAgentPrefix}${fix}/nlu/script-config/voice/del`, params)
}

// 检查话术内容是否重复
export const checkScriptContent = (params) => {
  return Post(`${voiceAgentPrefix}${fix}/nlu/script-config/check`, params)
}

// 检查导入文件中的重复话术
export const checkImportScript = (formData) => {
  return Upload(`${voiceAgentPrefix}${fix}/nlu/script-config/import/checkScript`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-service-name": "za-open-bot",
      "X-Usercenter-Session": getTokenAndServiceName().token
    }
  })
}

/**
 * 【导出】导出音频数据
 * POST /nlu/audio/data/export
 * @param {Object} data - 导出参数
 * @returns {Promise<boolean>}
 */
export const exportAudioData = (data = {}) => {
  return fetch(`${voiceAgentPrefix}${fix}/nlu/audio/data/export`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-service-name": "za-open-bot",
      "X-Usercenter-Session": getTokenAndServiceName().token
    }
  })
    .then((res) => {
      res.blob().then((blob) => {
        let link = document.createElement("a")
        link.href = window.URL.createObjectURL(blob)
        link.download = `音频数据-${new Date().toLocaleString()}.xlsx`
        link.click()
        window.URL.revokeObjectURL(link.href)
      })
      return true
    })
    .catch((e) => {
      console.log("导出失败:", e)
      return false
    })
}
