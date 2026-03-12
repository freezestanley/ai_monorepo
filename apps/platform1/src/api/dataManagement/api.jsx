import { Get, Post, Put, Upload } from "@/api/server"
import { knowledgeExtractorPrefix } from "@/constants"
import { downloadFileWithHeaders, infoInterceptors } from "../tools"
const prefix = knowledgeExtractorPrefix

//数据源列表
export const listByPageDsInfo = (params) => {
  return Post(`${prefix}/finance/dsInfo/listByPageDsInfo`, params).then((res) => res.data)
}

//新增数据源
export const saveDsInfo = (params) => {
  return Post(`${prefix}/finance/dsInfo/saveDsInfo`, params).then((res) => res)
}
//修改数据源
export const modifyDsInfo = (params) => {
  return Post(`${prefix}/finance/dsInfo/modifyDsInfo`, params).then((res) => res)
}

//测试数据源
export const testDsInfo = (params) => {
  return Post(`${prefix}/finance/dsInfo/testDsInfo`, params).then((res) => res)
}

//删除数据源
export const deleteDsInfo = (params) => {
  return Post(`${prefix}/finance/dsInfo/deleteDsInfo`, params).then((res) => res.data)
}

export const downLoadLableTemplate = (params) => {
  // return Post(`${prefix}/finance/lable/downLoadLableTemplate`, params).then((res) => res)
  return downloadFileWithHeaders(
    `${prefix}/finance/lable/downLoadLableTemplate`,
    "模版.xlsx",
    "Post"
  )
}
export const saveLable = (params) => {
  return Post(`${prefix}/finance/lable/saveLable`, params).then((res) => res)
}
export const modifyLable = (params) => {
  return Post(`${prefix}/finance/lable/modifyLable`, params).then((res) => res)
}
export const listLableOperateByDsId = (params) => {
  return Post(`${prefix}/finance/lable/listLableOperateByDsId`, params).then((res) => res.data)
}
export const listByPageLable = (params) => {
  return Post(`${prefix}/finance/lable/listByPageLable`, params).then((res) => res.data)
}
export const deleteLable = (params) => {
  return Post(`${prefix}/finance/lable/deleteLable`, params).then((res) => res)
}
//   export const batchSaveLable = (params) => {
//     return Post(`${prefix}/finance/lable/batchSaveLable`, params).then((res) => res)
//   }
// 上传图片
export const batchSaveLable = (formData) => {
  return Upload(`${prefix}/finance/lable/batchSaveLable`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }).then((res) => res.data)
}

// 数据圈选-分页查询数据集
export const fetchDataSetInfoList = (params) => {
  return Post(`${prefix}/finance/dataSetInfo/listByPageDataSetInfo`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 数据圈选-查询数据集详情
export const fetchDataSetInfoDetail = (params) => {
  return Post(`${prefix}/finance/dataSetInfo/queryDataSetDetail`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 数据圈选-重跑
export const fetchReRunDataSetInfo = (params) => {
  return Post(`${prefix}/finance/dataSetInfo/reRunDataSetInfo`, params).then((res) =>
    infoInterceptors(res)
  )
}

// 数据圈选-查询数据源下所有字段和对应操作符
export const fetchListLableOperateByDsId = (params) => {
  return Post(`${prefix}/finance/lable/listLableOperateByDsId`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 数据圈选-查询所有数据源
export const fetchListAllDsInfo = (params) => {
  return Post(`${prefix}/finance/dsInfo/listAllDsInfo`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 数据圈选-客群排除模板下载
export const fetchDownLoadExcludeTemplate = () => {
  return downloadFileWithHeaders(
    `${prefix}/finance/dataSetInfo/downLoadExcludeTemplate`,
    "客户排除模板.xlsx",
    "Post"
  )
}

// 数据圈选-客群排除模板解析
export const fetchParsingExcludeTemplate = (params) => {
  return Post(`${prefix}/finance/dataSetInfo/parsingExcludeTemplate`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 数据圈选-保存数据集
export const fetchSaveDataSetInfo = (params) => {
  return Post(`${prefix}/finance/dataSetInfo/saveDataSetInfo`, params).then((res) =>
    infoInterceptors(res)
  )
}

// 数据圈选-查看画像
export const fetchQueryPortraitCardInfo = (params) => {
  return Post(`${prefix}/finance/dataSetInfo/queryPortraitCardInfo`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 数据圈选-数据集绑定萃取任务
export const fetchDataSetInfoBindTask = (params) => {
  return Post(`${prefix}/finance/dataSetInfo/${params.botNo}/bindTask`, params).then((res) =>
    infoInterceptors(res)
  )
}
