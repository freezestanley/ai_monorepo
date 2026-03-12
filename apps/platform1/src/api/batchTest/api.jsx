// api.jsx
import { Get, Post, Put } from "@/api/server"
import { botPrefix } from "@/constants"
import { downloadFileWithHeaders } from "../tools"

// BATCHTEST-创建测试集
export const createTestSet = (params) => {
  const { botNo, skillNo, skillVersionNo, ...res } = params
  return Post(`${botPrefix}/bots/${botNo}/${skillNo}/test-set/create/${skillVersionNo}`, {
    ...res
  }).then((res) => res)
}

// BATCHTEST-创建Agent测试集
export const createAgentTestSet = (params) => {
  const { botNo, agentNo, agentVersionNo, ...res } = params
  return Post(`${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/create/${agentVersionNo}`, {
    ...res
  }).then((res) => res)
}

// 调试测试集 /bots/{botNo}/{skillNo}/test-set/debug
export const debugTestSet = (params) => {
  const { botNo, skillNo, ...restData } = params
  return Post(`${botPrefix}/bots/${botNo}/${skillNo}/test-set/debug`, restData).then((res) => res)
}

// 调试测试集
export const debugAgentTestSet = (params) => {
  const { botNo, agentNo, ...restData } = params
  return Post(`${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/debug`, restData).then(
    (res) => res
  )
}

// BATCHTEST-删除测试集
export const deleteTestSet = (params) => {
  const { botNo, skillNo, id } = params
  return Post(`${botPrefix}/bots/${botNo}/${skillNo}/test-set/delete/${id}`).then((res) => res)
}

// BATCHTEST-删除Agent测试集
export const deleteAgentTestSet = (params) => {
  const { botNo, agentNo, id } = params
  return Post(`${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/delete/${id}`).then(
    (res) => res
  )
}

// BATCHTEST-获取单个测试集测试结果
export const fetchTestSetDetail = (params) => {
  const { botNo, skillNo, id, ...restData } = params
  return Post(`${botPrefix}/bots/${botNo}/${skillNo}/test-set/detail/${id}`, {
    pageNum: 1,
    pageSize: 5000,
    ...restData
  }).then((res) => res || {})
}

// BATCHTEST-获取单个Agent测试集测试结果
export const fetchAgentTestSetDetail = (params) => {
  const { botNo, agentNo, id, ...restData } = params
  return Post(`${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/detail/${id}`, {
    pageNum: 1,
    pageSize: 5000,
    ...restData
  }).then((res) => res || {})
}

// BATCHTEST-下载测试集模板
export const downloadTestSetTemplate = (params, body) => {
  const { botNo, skillNo, skillVersionNo } = params
  downloadFileWithHeaders(
    `${botPrefix}/bots/${botNo}/${skillNo}/test-set/download/${skillVersionNo}`,
    "测试集模板.xlsx",
    "Post",
    body
  )
}

// BATCHTEST-下载Agent测试集模板
export const downloadAgentTestSetTemplate = (params, body) => {
  const { botNo, agentNo, agentVersionNo } = params
  downloadFileWithHeaders(
    `${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/download/${agentVersionNo}`,
    "测试集模板.xlsx",
    "Post",
    body
  )
}

// BATCHTEST-获取测试集列表
export const fetchTestSetPage = (params) => {
  const { botNo, skillNo, ...queryParams } = params
  return Post(`${botPrefix}/bots/${botNo}/${skillNo}/test-set/page`, queryParams).then(
    (res) => res.data
  )
}

// BATCHTEST-获取Agent测试集列表
export const fetchAgentTestSetPage = (params) => {
  const { botNo, agentNo, ...queryParams } = params
  return Post(`${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/page`, queryParams).then(
    (res) => res.data
  )
}

// BATCHTEST-上传测试集数据
export const uploadTestSetData = (params) => {
  const { botNo, skillNo, skillVersionNo } = params
  return `${botPrefix}/bots/${botNo}/${skillNo}/test-set/${skillVersionNo}/upload`
}

// BATCHTEST-上传Agent测试集数据
export const uploadAgentTestSetData = (params) => {
  const { botNo, agentNo, agentVersionNo } = params
  return `${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/${agentVersionNo}/upload`
}

// 导出测试集excel
export const exportTestSetExcel = (params) => {
  const { botNo, skillNo, skillVersionNo, id, assertType } = params
  downloadFileWithHeaders(
    `${botPrefix}/bots/${botNo}/${skillNo}/test-set/export-excel/${skillVersionNo}/${id}/${assertType}`,
    `${skillVersionNo}-${assertType === "clause" ? "分句断言" : "总结断言"}结果集.xlsx`,
    "Get"
  )
}

// 导出Agent测试集excel
export const exportAgentTestSetExcel = (params) => {
  const { botNo, agentNo, agentVersionNo, id, assertType } = params
  downloadFileWithHeaders(
    `${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/export-excel/${agentVersionNo}/${id}/${assertType}`,
    `${agentVersionNo}-${assertType === "clause" ? "分句断言" : "总结断言"}结果集.xlsx`,
    "Get"
  )
}

//获取测试集输出schema
export const fetchTestSetOutputSchema = (params) => {
  const { botNo, skillNo, skillVersionNo } = params
  return Post(
    `${botPrefix}/bots/${botNo}/${skillNo}/test-set/output-schema/${skillVersionNo}`
  ).then((res) => res.data)
}

// 再次运行测试集
export const runTestSetAgain = (params) => {
  const { botNo, skillNo, id, skillVersionNo } = params
  return Post(`${botPrefix}/bots/${botNo}/${skillNo}/test-set/run/${id}/${skillVersionNo}`).then(
    (res) => res
  )
}

// 再次运行Agent测试集
export const runAgentTestSetAgain = (params) => {
  const { botNo, agentNo, id, agentVersionNo } = params
  return Post(
    `${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/run/${id}/${agentVersionNo}`
  ).then((res) => res)
}

// skillVersion信息列表
export const fetchSkillVersionList = (params) => {
  const { botNo, skillNo } = params
  return Post(`${botPrefix}/bots/${botNo}/${skillNo}/test-set/skill-version-list`).then(
    (res) => res.data
  )
}

// agentVersion信息列表
export const fetchAgentSkillVersionList = (params) => {
  const { agentNo } = params
  return Post(`${botPrefix}/admin/agent/${agentNo}/version/listReleaseVersion`).then(
    (res) => res.data
  )
}

// 测试集取消运行
export const cancelTestSet = (params) => {
  const { botNo, skillNo, id } = params
  return Post(`${botPrefix}/bots/${botNo}/${skillNo}/test-set/cancel/${id}`).then((res) => res)
}

// Agent测试集取消运行
export const cancelAgentTestSet = (params) => {
  const { botNo, agentNo, id } = params
  return Post(`${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/cancel/${id}`).then(
    (res) => res
  )
}

// 续跑测试集
// /bots/{botNo}/{skillNo}/test-set/continue/{id}
export const continueTestSet = (params) => {
  const { botNo, skillNo, id } = params
  return Post(`${botPrefix}/bots/${botNo}/${skillNo}/test-set/continue/${id}`).then((res) => res)
}

// 续跑Agent测试集
export const continueAgentTestSet = (params) => {
  const { botNo, agentNo, id } = params
  return Post(`${botPrefix}/bots/${botNo}/agent/${agentNo}/test-set/continue/${id}`).then(
    (res) => res
  )
}

export const fetchTagList = (params) => {
  return Get(`${botPrefix}/admin/tag/list`, params).then((res) => res.data)
}

export const fetchAdminRoles = () => {
  return Get(`${botPrefix}/admin/authRole/listAdminRoles`).then((res) => res.data)
}

export const fetchBotAuthRole = (params) => {
  const { botNo } = params
  return Get(`${botPrefix}/admin/bot/${botNo}/authRole`).then((res) => res.data)
}
