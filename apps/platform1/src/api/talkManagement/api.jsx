import { Get, Post, Put, Upload } from "@/api/server"
import { knowledgeExtractorPrefix } from "@/constants"
import { downloadFileWithHeaders, infoInterceptors } from "../tools"
const prefix = knowledgeExtractorPrefix

//话术知识启用/禁用
export const dialogueUsableSwitch = (params) => {
  return Post(`${prefix}/finance/intention/usable/dialogueUsable/switch`, params).then((res) => res)
}
//查询
export const dialogueUsableQuery = (params) => {
  return Post(`${prefix}/finance/intention/usable/dialogueUsable/query`, params).then(
    (res) => res.data
  )
}
//导入
export const dialogueUsableImport = (params) => {
  return Post(
    `${prefix}/finance/intention/usable/dialogueUsable/${params.botNo}/import`,
    params.file
  ).then((res) => res)
}
//编辑
export const dialogueUsableEdit = (params) => {
  return Post(`${prefix}/finance/intention/usable/dialogueUsable/edit`, params).then((res) => res)
}
//新增
export const dialogueUsableCreate = (params) => {
  return Post(`${prefix}/finance/intention/usable/dialogueUsable/create`, params).then((res) => res)
}

export const listByDialogueId = (params) => {
  return Post(`${prefix}/knowledgeTemplate/listByDialogueId/${params.templateId}`).then(
    (res) => res.data
  )
}

export const fetchDownLoadExcludeTemplate = (params) => {
  return downloadFileWithHeaders(
    `${prefix}/finance/intention/usable/${params.botNo}/downLoadImportTemplate`,
    "模板.xlsx",
    "Post"
  )
}

// 话术知识批量启用/禁用
export const fetchBatchSwitch = (params) => {
  return Post(`${prefix}/finance/intention/usable/dialogueUsable/batchSwitch`, params).then((res) =>
    infoInterceptors(res)
  )
}

// 话术知识删除/批量删除
export const dialogueUsableDelete = (params) => {
  return Post(`${prefix}/finance/intention/usable/dialogueUsable/delete`, params).then((res) =>
    infoInterceptors(res)
  )
}

// 查询话术关联模板
export const fetchQueryTemplateCount = (params) => {
  return Post(`${prefix}/finance/intention/usable/dialogueUsable/queryTemplateCount`, params).then(
    (res) => infoInterceptors(res)
  )
}

// 编辑话术和模版绑定关系
export const fetchEditBindWithDialogueAndTemplate = (params) => {
  return Post(
    `${prefix}/finance/intention/usable/dialogueUsable/editBindWithDialogueAndTemplate`,
    params
  ).then((res) => infoInterceptors(res))
}

// 话术知识操作日志查询
export const fetchListLogByPage = (params) => {
  return Post(`${prefix}/finance/operationLog/listLogByPage`, params).then(
    (res) => infoInterceptors(res).data
  )
}
