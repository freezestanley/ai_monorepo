import { useQuery, useMutation } from "@tanstack/react-query"
import {
  createStructureDataset,
  editStructureDataset,
  importStructureDataset,
  importStructureDatasetResult,
  changeStructureDatasetStatus,
  fetchStructureDatasetList,
  fetchStructureDatasetCatalog,
  fetchStructureDatasetRecordList,
  createStructureDatasetFieldLayout,
  updateStructureDatasetFieldLayout,
  fetchStructureDatasetFieldLayout,
  deleteStructureDataset,
  fetchFieldTypes,
  fetchStructureDatasetDetail,
  fetchStructureDatasetImportData,
  fetchStructureDatasetListByBotNo,
  deleteDatasetRecord,
  batchDeleteDatasetRecord,
  addDatasetRecord,
  editDatasetRecord,
  structureDatasetParsing,
  structureDatasetImportDataExtend,
  structureDatasetImportDataExtendResult,
  fetchAuthResourceList,
  fetchDesignatedSourceTagList,
  fetchChannelList
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

// 创建数据集
export const useCreateStructureDataset = () => {
  return useMutation(createStructureDataset)
}

// 编辑数据集
export const useEditStructureDataset = () => {
  return useMutation(editStructureDataset)
}

// 导入数据集
export const useImportStructureDataset = () => {
  return useMutation(importStructureDataset)
}

// 导入数据集结果
export const useImportStructureDatasetResult = () => {
  return useMutation(importStructureDatasetResult)
}

// 更改数据集状态
export const useChangeStructureDatasetStatus = () => {
  return useMutation(changeStructureDatasetStatus)
}

// 获取数据集列表
export const useFetchStructureDatasetList = (params) => {
  return useQuery([QUERY_KEYS.FETCHSTRUCTUREDATASETLIST, params], () =>
    fetchStructureDatasetList(params)
  )
}

// 获取数据集目录
export const useFetchStructureDatasetCatalog = (params) => {
  return useQuery([QUERY_KEYS.FETCHSTRUCTUREDATASETCATALOG, params], () =>
    fetchStructureDatasetCatalog(params)
  )
}

// 获取数据集记录列表
export const useFetchStructureDatasetRecordList = (params) => {
  return useQuery([QUERY_KEYS.FETCHSTRUCTUREDATASETRECORDLIST, params], () =>
    fetchStructureDatasetRecordList(params)
  )
}

// 创建结构化数据集显示布局
export const useCreateStructureDatasetFieldLayout = () => {
  return useMutation(createStructureDatasetFieldLayout)
}

// 更新结构化数据集显示布局
export const useUpdateStructureDatasetFieldLayout = () => {
  return useMutation(updateStructureDatasetFieldLayout)
}

// 结构化数据集显示布局详情
export const useFetchStructureDatasetFieldLayout = (params) => {
  return useQuery([QUERY_KEYS.FETCHSTRUCTUREDATASETFIELDLAYOUT, params], () =>
    fetchStructureDatasetFieldLayout(params)
  )
}

// 通过botNo获取数据集列表
export const useFetchStructureDatasetListByBotNo = (params) => {
  return useQuery([QUERY_KEYS.FETCH_DATASET_LIST_BY_BOT_NO, params], () =>
    fetchStructureDatasetListByBotNo(params)
  )
}

// 删除数据集
export const useDeleteStructureDataset = () => {
  return useMutation(deleteStructureDataset)
}

export const useFetchFieldTypes = () => {
  return useQuery([QUERY_KEYS.FETCHFIELDTYPES], fetchFieldTypes)
}

// 获取数据集详情
export const useFetchStructureDatasetDetail = () => {
  return useMutation(fetchStructureDatasetDetail)
}

export const useFetchStructureDatasetImportData = () => {
  return useMutation(fetchStructureDatasetImportData)
}

/**
 * 删除数据集某一条记录
 */
export const useDeleteDatasetRecord = () => {
  return useMutation(deleteDatasetRecord)
}

/**
 * 批量删除数据集记录
 */
export const useBatchDeleteDatasetRecord = () => {
  return useMutation(batchDeleteDatasetRecord)
}

/**
 * 编辑数据集某一条记录
 */
export const useEditDatasetRecord = () => {
  return useMutation(editDatasetRecord)
}

/**
 * 新增数据集一条记录
 */
export const useAddDatasetRecord = () => {
  return useMutation(addDatasetRecord)
}

export const useStructureDatasetParsing = () => {
  return useMutation(structureDatasetParsing)
}

/**
 * structureDatasetImportDataExtend
 */
export const useStructureDatasetImportDataExtend = () => {
  return useMutation(structureDatasetImportDataExtend)
}

/**
 * structureDatasetImportDataExtendResult
 */
export const useStructureDatasetImportDataExtendResult = () => {
  return useMutation(structureDatasetImportDataExtendResult)
}

// fetchAuthResourceList
export const useFetchAuthResourceList = (params) => {
  return useQuery([QUERY_KEYS.FETCH_AUTH_RESOURCE, params], () => fetchAuthResourceList(params))
}

// fetchChannelList
export const useFetchChannelList = (params) => {
  return useQuery([QUERY_KEYS.FETCH_CHANNEL_LIST, params], () => fetchChannelList(params))
}

// fetchDesignatedSourceTagList
export const useFetchDesignatedSourceTagList = (params) => {
  return useQuery([QUERY_KEYS.FETCH_DESIGNATED_SOURCE_TAG, params], () =>
    fetchDesignatedSourceTagList({ ...params, tagType: "knowledgeAnswerSource" })
  )
}
