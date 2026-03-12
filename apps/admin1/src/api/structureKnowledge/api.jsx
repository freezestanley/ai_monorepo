// api.js
import { Get, Post, Put } from "@/api/server"
import { knowledgePrefix, botPrefix } from "@/constants"
import { downloadFileWithHeaders } from "../tools"
import { getTokenAndServiceName } from "@/api/sso"
import dayjs from "dayjs"

// 创建数据集
export const createStructureDataset = (params) => {
  console.log(params)
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/create`,
    params
  ).then((res) => res)
}

export const editStructureDataset = (params) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/edit`,
    params
  ).then((res) => res)
}

export const importStructureDataset = (params) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/${params.documentNo}/importData`,
    params
  ).then((res) => res)
}

export const importStructureDatasetResult = (params) => {
  return Get(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/importData/result`
  ).then((res) => res)
}

export const changeStructureDatasetStatus = (params) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/status/${params.status}/change`,
    params
  ).then((res) => res)
}

export const fetchStructureDatasetList = (params) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/structure/listByPage`,
    params
  ).then((res) => res)
}

export const fetchStructureDatasetCatalog = (params) => {
  return Get(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/list`,
    params
  ).then((res) => res)
}

export const fetchStructureDatasetRecordList = (params) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/record/listByPage`,
    params
  ).then((res) => res)
}

export const createStructureDatasetFieldLayout = ({ knowledgeBaseNo, structureNo, ...params }) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/${structureNo}/fieldLayout/create`,
    params
  ).then((res) => res)
}

export const updateStructureDatasetFieldLayout = ({ knowledgeBaseNo, structureNo, ...params }) => {
  return Put(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/${structureNo}/fieldLayout/update`,
    params
  ).then((res) => res)
}

export const fetchStructureDatasetFieldLayout = (params) => {
  return Get(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.structureNo}/fieldLayout/detail`
  ).then((res) => res)
}

export const deleteStructureDataset = (params) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/delete`,
    params
  ).then((res) => res)
}

export const fetchFieldTypes = () => {
  return Get(`${knowledgePrefix}/admin/knowledge/structure/v1/filed/type/list`).then((res) => res)
}

export const fetchStructureDatasetDetail = (params) => {
  return Get(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/detail`
  ).then((res) => res)
}

export const uploadStructureDataset = (params) => {
  return `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/upload`
}

export const fetchStructureDatasetImportData = (params) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/${params.documentNo}/importData`
  ).then((res) => res)
}

export const fetchStructureDatasetListByBotNo = (params) => {
  return Get(`${botPrefix}/bots/${params.botNo}/knowledgebase/structure/list`).then(
    (res) => res.data
  )
}

/**
 * 
  export const downloadTestSetTemplate = (params) => {
  const { botNo, skillNo, skillVersionNo } = params
  downloadFileWithHeaders(
    `${botPrefix}/bots/${botNo}/${skillNo}/test-set/download/${skillVersionNo}`,
    "测试集模板.xlsx",
    "Get"
  )
}
 * 
 */

// Get /admin/knowledge/structure/v1/{knowledgeBaseNo}/{catalogNo}/{structureNo}/downloadTemplate 下载模板, 下载数据集模板

export const downloadStructureDatasetTemplate = (params) => {
  const { knowledgeBaseNo, catalogNo, structureNo } = params
  return downloadFileWithHeaders(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/${catalogNo}/${structureNo}/downloadTemplate`,
    "数据集模板.xlsx",
    "Get"
  )
}

/**
 * 导出数据集
 * @param {*} data
 * @returns
 */
export const exportStructureDataset = (data = {}) => {
  const { knowledgeBaseNo, catalogNo, structureNo, ...body } = data
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/${catalogNo}/${structureNo}/record/export`,
    body
  ).then((res) => res)
}

/**
 * 获取导出结果
 * @param {*} data
 * @returns
 */
export const getExportResult = (data = {}) => {
  const { knowledgeBaseNo, catalogNo, structureNo } = data
  return Get(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/${catalogNo}/${structureNo}/record/export/result`
  ).then((res) => res)
}

/**
 * 删除结构化数据里的某一条记录
 */
export const deleteDatasetRecord = ({ knowledgeBaseNo, structureNo, ...restParams }) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/structure/${structureNo}/record/delete`,
    restParams
  ).then((res) => res)
}

/**
 * 批量删除结构化数据里的记录
 */
export const batchDeleteDatasetRecord = ({ knowledgeBaseNo, structureNo, ...restParams }) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/structure/${structureNo}/record/batchDelete`,
    restParams
  ).then((res) => res)
}

/**
 * 编辑结构化数据里的某一条
 */
export const editDatasetRecord = ({ knowledgeBaseNo, structureNo, ...restParams }) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/structure/${structureNo}/record/edit`,
    restParams
  ).then((res) => res)
}

/**
 * 新增结构化数据里的一条
 */
export const addDatasetRecord = ({ knowledgeBaseNo, structureNo, ...restParams }) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/structure/${structureNo}/record/add`,
    restParams
  ).then((res) => res)
}

/**
 * /admin/knowledge/structure/v1/{knowledgeBaseNo}/{catalogNo}/pretreatment/upload
 */
export const uploadStructureDatasetUrl = ({ knowledgeBaseNo, catalogNo }) => {
  return `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/${catalogNo}/pretreatment/upload`
}

/**
 * post
 * /admin/knowledge/structure/v1/{knowledgeBaseNo}/{catalogNo}/{documentNo}/parsing
 */
export const structureDatasetParsing = ({
  knowledgeBaseNo,
  catalogNo,
  documentNo,
  ...restParams
}) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/${catalogNo}/${documentNo}/parsing`,
    restParams
  ).then((res) => res)
}

/**
 * post
 * /admin/knowledge/structure/v1/{knowledgeBaseNo}/{catalogNo}/{structureNo}/{documentNo}/importDataExtend
 */
export const structureDatasetImportDataExtend = ({
  knowledgeBaseNo,
  catalogNo,
  structureNo,
  documentNo,
  ...restParams
}) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/${catalogNo}/${structureNo}/${documentNo}/importDataExtend`,
    restParams
  ).then((res) => res)
}

/**
 * post
 * /admin/knowledge/structure/v1/{knowledgeBaseNo}/{catalogNo}/{structureNo}/{documentNo}/importDataExtend/result
 */
export const structureDatasetImportDataExtendResult = ({
  knowledgeBaseNo,
  catalogNo,
  structureNo,
  documentNo,
  ...restParams
}) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/structure/v1/${knowledgeBaseNo}/${catalogNo}/${structureNo}/${documentNo}/importDataExtend/result`,
    restParams
  )
}

// /admin/authResource/{botNo}/{dataType}/list
export const fetchAuthResourceList = ({ botNo, dataType }) => {
  return Get(`${botPrefix}/admin/authResource/${botNo}/${dataType}/list`).then((res) => res.data)
}

// /admin/sourceTag/{botNo}/channelList
export const fetchChannelList = ({ botNo }) => {
  return Get(`${botPrefix}/admin/sourceTag/${botNo}/channelList`).then((res) => res.data)
}

// /admin/authResource/{botNo}/listDesignatedSourceTag
export const fetchDesignatedSourceTagList = ({ botNo }) => {
  return Get(`${botPrefix}/admin/authResource/${botNo}/listDesignatedSourceTag`).then(
    (res) => res.data
  )
}
