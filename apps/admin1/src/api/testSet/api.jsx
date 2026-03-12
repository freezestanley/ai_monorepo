// @ts-nocheck
import { Post, Delete, Get } from "@/api/server"
import { botPrefix } from "@/constants"
import dayjs from "dayjs"
import { getTokenAndServiceName } from "@/api/sso"
import { isStudio } from "@/config.env"
/**
 * 获取测试集列表分页数据-api
 */
export const getTestSetListByPage = (params) => {
  return Post(`${botPrefix}/bots/${params.botNo}/test-set/listByPage`, params).then(
    (res) => res.data
  )
}

/**
 * 保存测试集-api
 */
export const saveTestSet = (params) => {
  return Post(`${botPrefix}/bots/${params.botNo}/test-set/save`, params).then((res) => res)
}

/**
 * 删除测试集-api
 */
export const deleteTestSet = (params) => {
  return Get(`${botPrefix}/bots/${params.botNo}/test-set/${params.setNo}/delete`).then((res) => res)
}
/**
 * 获取数据列表分页-api
 */
export const getDataListByPage = (botNo, setNo, params) => {
  return Post(`${botPrefix}/bots/${botNo}/test-set/${setNo}/data/listByPage`, params).then(
    (res) => res.data
  )
}

/**
 * 保存数据-api
 */
export const saveData = (botNo, setNo, params) => {
  return Post(`${botPrefix}/bots/${botNo}/test-set/${setNo}/data/save`, params).then((res) => res)
}

/**
 * 删除数据-api
 */
export const deleteDataById = (botNo, setNo, dataId) => {
  return Get(`${botPrefix}/bots/${botNo}/test-set/${setNo}/data/delete/${dataId}`).then(
    (res) => res
  )
}

/**
 * 导出测试集数据
 * @param {{ botNo: string, setNo: string, [key: string]: any }} data
 * @returns {Promise<boolean>}
 */
export const exportTestSetData = (data) => {
  const { botNo, setNo, studioenv, ...body } = data
  const exportDataURL = `${botPrefix}/bots/${botNo}/test-set/${setNo}/data/export`

  return fetch(exportDataURL, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token,
      ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
    }
  })
    .then((res) => {
      if (res.status === 200) {
        return res.blob().then((blob) => {
          const link = document.createElement("a")
          link.href = window.URL.createObjectURL(blob)
          const fileName = `测试集-${dayjs().format("YYYY-MM-DD-HH:mm:ss")}.xlsx`
          link.download = fileName
          link.click()
          return true
        })
      } else {
        throw new Error("导出失败")
      }
    })
    .catch((e) => {
      console.error("导出失败:", e)
      return false
    })
}

export const importTestDataUrl = (params) => {
  const { setNo, botNo } = params
  return `${botPrefix}/bots/${botNo}/test-set/${setNo}/data/import`
}

// POST/bots/{botNo}/test-set/{setNo}/data/import
export const importTestSetData = (params) => {
  const { setNo, botNo, body } = params
  return Post(`${botPrefix}/bots/${botNo}/test-set/${setNo}/data/import`, body).then((res) => res)
}

// POST/bots/{botNo}/test-set/list
export const getTestSetList = (params) => {
  return Post(`${botPrefix}/bots/${params.botNo}/test-set/list`, params).then((res) => res)
}

// 测试变量管理列表
export const getVariableList = (params) => {
  return Post(`${botPrefix}/bots/${params.botNo}/test-set/variable/page`, params).then(
    (res) => res.data
  )
}

// 添加测试变量
export const addVariable = (params) => {
  return Post(`${botPrefix}/bots/${params?.botNo}/test-set/variable/add`, params).then((res) => res)
}
// 编辑测试变量
export const editVariable = (params) => {
  return Post(`${botPrefix}/bots/${params?.botNo}/test-set/variable/edit`, params).then(
    (res) => res
  )
}

// 调试
export const debugVariable = (params) => {
  return Post(`${botPrefix}/bots/${params?.botNo}/test-set/variableDebug`, params).then(
    (res) => res
  )
}

// 所有测试集枚举列表
export const getVariableEnumeList = (params) => {
  return Get(`${botPrefix}/bots/${params.botNo}/test-set/variable/list`, params).then(
    (res) => res.data
  )
}

// 删除变量
export const deleteVariable = (params) => {
  return Delete(
    `${botPrefix}/bots/${params.botNo}/test-set/variable/delete/${params.variableName}`
  ).then((res) => res)
}

/**
 * 智能录入测试数据
 * @param {string} botNo - 空间编号
 * @param {Object} data - 请求数据
 * @param {string} data.input - 输入的文本内容
 * @returns {Promise}
 */
export const intelligentInput = (botNo, data) => {
  return Post(`${botPrefix}/bots/${botNo}/test-set/intelligentInput`, data).then((res) => res)
}
