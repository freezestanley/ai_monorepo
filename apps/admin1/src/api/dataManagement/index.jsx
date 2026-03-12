import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listByPageDsInfo,
  saveDsInfo,
  modifyDsInfo,
  testDsInfo,
  deleteDsInfo,
  downLoadLableTemplate,
  saveLable,
  modifyLable,
  listLableOperateByDsId,
  listByPageLable,
  deleteLable,
  batchSaveLable,
  fetchDataSetInfoList,
  fetchDataSetInfoDetail,
  fetchReRunDataSetInfo,
  fetchListLableOperateByDsId,
  fetchListAllDsInfo,
  fetchSaveDataSetInfo,
  fetchQueryPortraitCardInfo,
  fetchDataSetInfoBindTask
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"

//  数据源列表
export const useFetchlistByPageDsInfo = () => {
  const queryClient = useQueryClient()
  return useMutation(listByPageDsInfo, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.DATA_MANAGEMENT_ORIGINLIST])
    }
  })
}

//保存数据源
export const useFetchSaveDataOrigin = () => {
  return useMutation(saveDsInfo)
}

//修改数据源
export const useFetchModifyDsInfo = () => {
  return useMutation(modifyDsInfo)
}

//测试链接
export const useFetchTestDsInfo = () => {
  return useMutation(testDsInfo)
}

//删除
export const useFetchDeleteDsInfo = () => {
  const queryClient = useQueryClient()
  return useMutation(deleteDsInfo, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BATCH_EXTRACTOR_SAVE])
    }
  })
}

export const useFetchSaveLable = () => {
  return useMutation(saveLable)
}
export const useFetchModifyLable = () => {
  return useMutation(modifyLable)
}
export const useFetchListLableOperateByDsId = () => {
  return useMutation(listLableOperateByDsId)
}
export const useFetchListByPageLable = () => {
  return useMutation(listByPageLable)
}
export const useFetchDeleteLable = () => {
  return useMutation(deleteLable)
}
export const useFetchBatchSaveLable = () => {
  return useMutation(batchSaveLable)
}

// 数据圈选-分页查询数据集
export const useDataSetInfoListApi = ({ ...params }) => {
  return useQuery([QUERY_KEYS.DATA_SET_INFO_LIST, params], () => {
    return fetchDataSetInfoList({ ...params })
  })
}

// 数据圈选-查询数据集详情
export const useFetchDataSetInfoDetailApi = ({ ...params }) => {
  return useQuery(
    [QUERY_KEYS.DATA_SET_INFO_DETAIL, params],
    () => {
      return fetchDataSetInfoDetail({ ...params })
    },
    {
      enabled: !!params.id
    }
  )
}

// 数据圈选-重跑
export const useFetchReRunDataSetInfoApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchReRunDataSetInfo, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.DATA_SET_INFO_LIST])
    }
  })
}

// 数据圈选-查询数据源下所有字段和对应操作符
export const useFetchListLableOperateByDsIdApi = ({ ...params }) => {
  return useQuery(
    [QUERY_KEYS.LIST_LABE_OPERATE_BY_DS_ID, params],
    () => {
      return fetchListLableOperateByDsId({ ...params })
    },
    {
      enabled: !!params.id
    }
  )
}

// 数据圈选-查询所有数据源
export const useFetchListAllDsInfoApi = (params) => {
  return useQuery([QUERY_KEYS.LIST_ALL_DS_INFO, params], () => {
    return fetchListAllDsInfo({ ...params })
  })
}

// 数据圈选-保存数据集
export const useFetchSaveDataSetInfoApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchSaveDataSetInfo, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.DATA_SET_INFO_LIST])
    }
  })
}

// 数据圈选-查询所有数据源
export const useFetchQueryPortraitCardInfoApi = (params) => {
  return useQuery(
    [QUERY_KEYS.PORTRAIT_CARD_INFO, params],
    () => {
      return fetchQueryPortraitCardInfo({ ...params })
    },
    {
      enabled: !!params
    }
  )
}

// 数据圈选-数据集绑定萃取任务
export const useFetchDataSetInfoBindTaskApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchDataSetInfoBindTask, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.DATA_SET_INFO_LIST])
    }
  })
}
