/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-26 17:20:33
 * @FilePath: /za-aigc-platform-admin-static/src/api/knowledgeExtraction/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchExtractorList,
  fetchTaskTypeList,
  fetchAddTaskType,
  fetchDeleteTaskType,
  fetchUpdateTaskTypeDesc,
  fetchTaskTypeListSkill,
  fetchSaveExtractTask,
  fetchExtractTaskDetail,
  fetchBatchNoValid,
  fetchTaskNameValid,
  jumpExtractTaskParams
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"
const callback = (cb = () => {}) => ({
  onSuccess: (d) => {
    console.log(d)
    if (d?.code == 200) {
      // @ts-ignore
      message.success(d?.message)
      cb()
    } else {
      message.warning(d?.message)
    }
  },
  onError: (e) => {
    // @ts-ignore
    message.error(e?.message)
  }
})
// 知识萃取-首页列表
export const useExtractorListApi = ({ ...params }) => {
  return useQuery([QUERY_KEYS.EXTRACTOR_LIST, params], () => {
    return fetchExtractorList({ ...params })
  })
}
// 知识萃取-任务类型列表
export const useTaskTypeListApi = ({ ...params }) => {
  return useQuery([QUERY_KEYS.TASK_TYPE_LIST, params], () => {
    return fetchTaskTypeList({ ...params })
  })
}
// 知识萃取 - 新增任务
export const useAddTaskTypeApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchAddTaskType, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.TASK_TYPE_LIST])
    }
  })
}
// 知识萃取 - 删除任务
export const useDeleteTaskTypeApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchDeleteTaskType, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.TASK_TYPE_LIST])
    }
  })
}
// 知识萃取 - 修改任务类型描述
export const useUpdateTaskTypeDescApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchUpdateTaskTypeDesc, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.TASK_TYPE_LIST])
    }
  })
}
// 知识萃取 - 查询可使用的工作流列表
export const useTaskTypeListSkillApi = (params) => {
  return useQuery(
    [QUERY_KEYS.TASK_TYPE_LIST_SKILL, params],
    () => {
      return fetchTaskTypeListSkill({ ...params })
    },
    {
      enabled: !!params.botNo
    }
  )
}
// 知识萃取-任务详情
export const useExtractTaskDetailApi = ({ ...params }) => {
  return useQuery([QUERY_KEYS.TASK_DETAIL, params], () => fetchExtractTaskDetail(params), {
    enabled: !!(params.batchCode && params.botNo)
  })
}
// 知识萃取-任务类型列表
export const useSaveExtractTaskApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchSaveExtractTask, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.EXTRACTOR_LIST])
    },
    onError: (e) => {
      // @ts-ignore
      message.error(e?.message)
    }
  })
}
// 知识萃取-批次号校验
export const useBatchNoValidApi = () => {
  return useMutation(fetchBatchNoValid, {
    onError: (e) => {
      // @ts-ignore
      message.error(e?.message)
    }
  })
}
// 知识萃取-任务名称校验
export const useTaskNameValidApi = () => {
  return useMutation(fetchTaskNameValid, {
    onError: (e) => {
      // @ts-ignore
      message.error(e?.message)
    }
  })
}

// 知识萃取-任务跳转参数
export const useJumpExtractTaskParamsApi = () => {
  return useMutation(jumpExtractTaskParams)
}
