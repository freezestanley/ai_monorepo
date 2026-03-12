import { useMutation, useQuery } from "@tanstack/react-query"

import {
  getTestSetListByPage,
  saveTestSet,
  deleteTestSet,
  getDataListByPage,
  saveData,
  deleteDataById,
  importTestSetData,
  getTestSetList,
  getVariableList,
  addVariable,
  editVariable,
  debugVariable,
  getVariableEnumeList,
  deleteVariable,
  intelligentInput
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

/**
 * 保存测试集-hooks
 */
export const useSaveTestSet = () => {
  return useMutation(saveTestSet)
}
/*
删除测试集-hooks
*/
export const useDeleteTestSet = () => {
  return useMutation(deleteTestSet)
}
/*
获取测试集列表分页数据-hooks
QUERY_KEYS.TEST_SET_LIST: testSetList
*/
export const useGetTestSetListByPage = (params) => {
  return useQuery([QUERY_KEYS.TEST_SET_LIST, params], () => getTestSetListByPage(params))
}

/**
 * 保存数据 - hooks
 */
export const useSaveData = () => {
  return useMutation((params) => saveData(params.botNo, params.setNo, params))
}

/**
 * 删除数据 - hooks
 */
export const useDeleteDataById = (botNo, setNo) => {
  return useMutation((dataId) => deleteDataById(botNo, setNo, dataId))
}

/**
 * 获取数据列表分页 - hooks
 */
export const useGetDataListByPage = (botNo, setNo, params) => {
  return useQuery(
    [QUERY_KEYS.TEST_SET_LIST_BY_PAGE, botNo, setNo, params],
    () => getDataListByPage(botNo, setNo, params),
    { keepPreviousData: true } // Optional: Keep previous data while loading new data
  )
}

export const useGetTestSetList = () => {
  return useMutation(getTestSetList)
}

export const useImportTestSetData = () => {
  return useMutation(importTestSetData)
}

// 测试变量管理列表
export const useVariableListByPage = (params) => {
  // return useMutation(getVariableList)
  return useQuery([QUERY_KEYS.TEST_SET_LIST, params], () => getVariableList(params))
}
// 新增测试变量
export const useAddVariable = () => {
  return useMutation(addVariable)
}
// 编辑测试变量
export const useEditVariable = () => {
  return useMutation(editVariable)
}
// 脚本内容调试
export const useDebugVariable = () => {
  return useMutation(debugVariable)
}

// 所有测试集合枚举列表
export const useVariableEnumeList = () => {
  return useMutation(getVariableEnumeList)
}

//删除测试集
export const useDeleteVariable = () => {
  return useMutation(deleteVariable)
}

/**
 * 智能录入测试数据 - hooks
 */
export const useIntelligentInput = (botNo) => {
  return useMutation((data) => intelligentInput(botNo, data))
}
