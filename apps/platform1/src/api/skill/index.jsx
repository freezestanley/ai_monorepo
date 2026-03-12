import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query"
import {
  updateSkill,
  createSkill,
  fetchSkillListByPage,
  updateShareSettings,
  updateSubscribeSkill,
  fetchSubscribeSkillListByPage,
  fetchLatestDefinition,
  fetchGlobalVariable,
  releaseSkill,
  saveDefinition,
  enableSkill,
  fetchSkillVersionList,
  deleteSkillVersion,
  copySkillVersionNo,
  fetchSkillInfo,
  fetchSkillTemplate,
  fetchTableFileType,
  saveAsTemplate,
  deleteSkill,
  copySkill,
  fetchGlobalVariableNew,
  fetchAvailableSkills,
  fetchBottomOption,
  deleteTemplateSkill,
  fetchEnableRerank,
  fetchSkillUserList,
  fetchAgentUserList
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"

export const useFetchSkillTemplate = (params) => {
  return useQuery([QUERY_KEYS.SKILL_TEMPLATE], () => fetchSkillTemplate(params))
}

export const useUpdateSkill = (v) => {
  return useMutation(updateSkill, v)
}

export const useDeleteSkill = () => {
  const queryClient = useQueryClient()

  return useMutation(deleteSkill, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.SKILL_LIST_BY_PAGE])
      // @ts-ignore
      message.info(d?.message)
    },
    onError: (e) => {
      // @ts-ignore
      message.error(e.message)
    }
  })
}

export const useCopySkill = () => {
  const queryClient = useQueryClient()

  return useMutation(copySkill, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.SKILL_LIST_BY_PAGE])
      // @ts-ignore
      message.success(d?.message || "复制工作流成功")
    },
    onError: (e) => {
      // @ts-ignore
      message.error(e?.message || "复制工作流失败")
    }
  })
}

export const useCreateSkill = () => {
  return useMutation(createSkill)
}

export const useUpdateShareSettings = (v) => {
  return useMutation(updateShareSettings, v)
}

export const useFetchSkillListByPage = (params) => {
  return useQuery([QUERY_KEYS.SKILL_LIST_BY_PAGE, params], () => fetchSkillListByPage(params), {
    enabled: params.disabledInit ? false : true
  })
}

export const useFetchSubscribeSkillListByPage = (params) => {
  return useQuery(
    [QUERY_KEYS.SUBSCRIBE_SKILL_LIST_BY_PAGE, params],
    () => fetchSubscribeSkillListByPage(params),
    {
      enabled: params.disabledInit ? false : true
    }
  )
}

export const useUpdateSubscribeSkill = (v) => {
  return useMutation(updateSubscribeSkill, v)
}

export const useFetchLatestDefinition = (skillNo, botNo) => {
  return useQuery(
    [QUERY_KEYS.LATEST_DEFINITION, skillNo, botNo],
    () => fetchLatestDefinition(skillNo, botNo),
    {
      enabled: !!skillNo,
      cacheTime: 0
    }
  )
}

export const useFetchGlobalVariable = (versionNo) => {
  return useQuery([QUERY_KEYS.GLOBAL_VARIABLE, versionNo], () => fetchGlobalVariable(versionNo), {
    enabled: !!versionNo
  })
}
// 新版获取全局变量
export const useFetchGlobalVariableNewCustom = (versionNo) => {
  return useQuery(
    [QUERY_KEYS.NEW_GLOBAL_VARIABLE, versionNo],
    () => fetchGlobalVariableNew(versionNo),
    {
      enabled: !!versionNo
    }
  )
}

export const useFetchGlobalVariableCustom = (versionNo) => {
  return useQuery([QUERY_KEYS.GLOBAL_VARIABLE, versionNo], () => fetchGlobalVariable(versionNo), {
    enabled: false
  })
}

export const useReleaseSkill = () => {
  return useMutation(releaseSkill)
}

export const useSaveDefinition = () => {
  return useMutation(saveDefinition)
}

export const useEnableSkill = () => {
  return useMutation(enableSkill)
}

export const useFetchSkillVersionList = (skillNo) => {
  return useQuery([QUERY_KEYS.SKILL_VERSION_LIST, skillNo], () => fetchSkillVersionList(skillNo), {
    enabled: !!skillNo
  })
}

export const useDeleteSkillVersion = () => {
  return useMutation(deleteSkillVersion)
}

/**
 * 另存为模板
 */
export const useSaveAsTemplate = () => {
  return useMutation(saveAsTemplate)
}

export const useCopySkillVersionNo = () => {
  return useMutation(copySkillVersionNo)
}

export const useFetchSkillInfo = (skillNo) => {
  return useQuery([QUERY_KEYS.SKILL_INFO, skillNo], () => fetchSkillInfo(skillNo), {
    enabled: !!skillNo
  })
}

export const useFetchTableFileType = () => {
  return useQuery([QUERY_KEYS.TABLE_FILE_TYPE], () => fetchTableFileType())
}

/**
 * useFetchAvailableSkills
 */
export const useFetchAvailableSkills = ({ botNo, ...params }) => {
  return useQuery(
    [QUERY_KEYS.SUBSCRIBE_SKILL_LIST, botNo, params],
    () => fetchAvailableSkills({ botNo, ...params }),
    {
      enabled: !!botNo
    }
  )
}

/**
 * fetchBottomOption
 */
export const useFetchBottomOption = () => {
  return useQuery([QUERY_KEYS.SKILL_BOTTOM_OPTION], () => fetchBottomOption())
}

// // 新版获取全局变量
// export const useFetchGlobalVariableNewCustom = (versionNo) => {
//   return useQuery(
//     [QUERY_KEYS.NEW_GLOBAL_VARIABLE, versionNo],
//     () => fetchGlobalVariableNew(versionNo),
//     {
//       enabled: !!versionNo
//     }
//   )
// }

// 删除模板
export const useDeleteTemplateSkill = () => {
  const queryClient = useQueryClient()
  return useMutation(deleteTemplateSkill, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.SKILL_TEMPLATE])
      // @ts-ignore
      message.success("删除成功")
    },
    onError: (e) => {
      // @ts-ignore
      message.error(e.message)
    }
  })
}

// 获取是否开启rerank
export const useFetchEnableRerank = (params) => {
  return useQuery([QUERY_KEYS.ENABLE_RERANK, params], () => fetchEnableRerank(params), {
    enabled: !!params.botNo
  })
}

// 获取工作流用户列表
export const useFetchSkillUserList = (params) => {
  return useQuery([QUERY_KEYS.SKILL_USER_LIST, params], () => fetchSkillUserList(params), {
    enabled: !!params.botNo && !!params.skillNo
  })
}
// 获取agent用户列表
export const useFetchAgentUserList = (params) => {
  return useQuery([QUERY_KEYS.SKILL_USER_LIST, params], () => fetchAgentUserList(params), {
    enabled: !!params.botNo && !!params.agentNo
  })
}
