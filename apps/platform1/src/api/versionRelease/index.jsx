import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { Button, message, Modal } from "antd"
import { QUERY_KEYS } from "@/constants/queryKeys"
import {
  getPublishConfig,
  fetchPublishOrderList,
  openPublishConfig,
  closePublishConfig,
  stopPublishOrder,
  fetchPublishEntityChangeList,
  createPublishOrder,
  fetchPublishOrderDetail,
  fetchPublishOrder,
  fetchPublishOrderStepBack,
  fetchPublishOrderSkipConfirm,
  fetchPublishOrderRollBack,
  fetchPublishEventRecords,
  fetchPublishEntityChangeRecords,
  fetchPublishGrayscale,
  fetchPublishGrayscaleStop,
  fetchPublishGrayPlan
} from "./api"
import styles from "@/pages/versionManage/versionRelease/index.module.less"

export const useGetPublishConfig = (params, options = {}) => {
  const intervalRef = useRef(null)
  const isPollingRef = useRef(false)
  const query = useQuery(
    [QUERY_KEYS.VERSION_PUBLISH_CONFIG, params],
    () => getPublishConfig(params),
    {
      enabled: !!params?.targetId,
      onSuccess: (res) => {
        if (!res.success && res.message) {
          message.error(res.message)
        }
        // 清除之前的定时器
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        sessionStorage.setItem(
          "isOpenStudioPublish",
          res?.data?.publishMode === "STANDARD" ? "1" : "0"
        )
        // 如果需要轮询，设置新的定时器
        if (res?.data?.afterVersion?.dataSyncTaskStatus === "READY") {
          intervalRef.current = setInterval(() => {
            query.refetch()
            isPollingRef.current = true
          }, 10000)
        } else {
          if (isPollingRef.current && res?.data?.afterVersion?.dataSyncTaskStatus === "FAILED") {
            message.error("版本发布开启失败，请重试")
          }
          isPollingRef.current = false
          // 发送调用请求
          window.parent.postMessage(
            {
              type: "VERSION_PUBLISH_CONFIG",
              botNo: params.targetId
            },
            "*"
          )
        }
      },
      ...options
    }
  )
  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])
  return query
}

/**
 * 分页查询发布单
 */
export const useFetchPublishOrderList = (params) => {
  return useQuery(
    [QUERY_KEYS.VERSION_PUBLISH_ORDER_LIST, params],
    () => fetchPublishOrderList(params),
    {
      enabled: !!params?.targetIds?.length,
      onSuccess: (res) => {
        if (!res.success && res.message) {
          message.error(res.message)
        }
      }
    }
  )
}

export const useStopPublishOrder = () => {
  const queryClient = useQueryClient()
  return useMutation(stopPublishOrder, {
    onSuccess: (res) => {
      if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_ORDER_LIST])
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 打开发布配置
 */
export const useOpenPublishConfig = () => {
  const queryClient = useQueryClient()
  return useMutation(openPublishConfig, {
    onSuccess: (res) => {
      if (res.code === "60005") {
        message.warning("已存在语音Agent，版本发布暂不兼容")
      } else if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_CONFIG])
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 关闭发布配置
 */
export const useClosePublishConfig = () => {
  const queryClient = useQueryClient()
  return useMutation(closePublishConfig, {
    onSuccess: (res) => {
      if (res.code === "50065") {
        Modal.info({
          className: styles.modalInfo,
          width: 480,
          title: "无法关闭版本发布",
          content: "存在【发布中】状态的发布单，请终止后再关闭版本发布～",
          okText: "知道了"
        })
      } else if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_CONFIG])
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 分页获取发布变更记录列表
 */
export const useFetchPublishEntityChangeList = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.VERSION_PUBLISH_ENTITY_CHANGE_LIST, params],
    () => fetchPublishEntityChangeList(params),
    {
      onSuccess: (res) => {
        if (!res.success && res.message) {
          message.error(res.message)
        }
      },
      ...options
    }
  )
}

/**
 * 创建发布单
 */
export const useCreatePublishOrder = () => {
  const queryClient = useQueryClient()
  return useMutation(createPublishOrder, {
    onSuccess: (res) => {
      if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_ORDER_LIST])
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 获取发布单详情
 */
export const useFetchPublishOrderDetail = (params) => {
  return useQuery(
    [QUERY_KEYS.VERSION_PUBLISH_ORDER_DETAIL, params],
    () => fetchPublishOrderDetail(params),
    {
      enabled: !!params.publishOrderId,
      onSuccess: (res) => {
        if (!res.success && res.message) {
          message.error(res.message)
        }
      }
    }
  )
}

/**
 * 执行发布
 */
export const useFetchPublishOrder = () => {
  const queryClient = useQueryClient()
  const mutateRef = useRef(null)
  const mutation = useMutation(fetchPublishOrder, {
    onSuccess: (res, variables) => {
      if (!res.success) {
        res.message && message.error(res.message)
      } else {
        const publishOrderId = variables.publishOrderId
        queryClient
          .fetchQuery([QUERY_KEYS.VERSION_PUBLISH_ORDER_DETAIL, { publishOrderId }])
          .then((newData) => {
            const hasFailed = newData?.data?.publishChain?.nodes?.some(
              (step) => step.status === "FAILED"
            )
            if (hasFailed) {
              message.error({
                key: `publish-failed-${publishOrderId}`,
                content: (
                  <>
                    发布失败，请{" "}
                    <Button type="link" onClick={() => mutateRef.current?.(variables)}>
                      重新尝试
                    </Button>
                  </>
                ),
                duration: 5
              })
            }
          })
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
  mutateRef.current = mutation.mutate
  return mutation
}

/**
 * 回退发布
 */
export const useFetchPublishOrderStepBack = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchPublishOrderStepBack, {
    onSuccess: (res) => {
      if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_ORDER_DETAIL])
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 跳过确认
 */
export const useFetchPublishOrderSkipConfirm = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchPublishOrderSkipConfirm, {
    onSuccess: (res) => {
      if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_ORDER_DETAIL])
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 回滚发布单
 */
export const useFetchPublishOrderRollBack = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchPublishOrderRollBack, {
    onSuccess: (res) => {
      if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_ORDER_DETAIL])
        message.success("回滚成功")
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 分页查询发布事件记录
 */
export const useFetchPublishEventRecords = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.VERSION_PUBLISH_EVENT_RECORDS, params],
    () => fetchPublishEventRecords(params),
    {
      enabled: !!params.publishOrderId,
      onSuccess: (res) => {
        if (!res.success && res.message) {
          message.error(res.message)
        }
      },
      ...options
    }
  )
}

/**
 * 取消删除
 */
export const useFetchPublishEntityChangeRecords = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchPublishEntityChangeRecords, {
    onSuccess: (res) => {
      if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST])
        queryClient.invalidateQueries([QUERY_KEYS.SKILL_LIST_BY_PAGE])
        message.success("取消成功")
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 开启灰度发布(配置)
 */
export const useFetchPublishGrayscale = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchPublishGrayscale, {
    onSuccess: (res) => {
      if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_GRAY_PLAN])
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 停止灰度发布
 */
export const useFetchPublishGrayscaleStop = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchPublishGrayscaleStop, {
    onSuccess: (res) => {
      if (!res.success) {
        res.message && message.error(res.message)
      } else {
        queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_GRAY_PLAN])
      }
    },
    onError: (e) => {
      e.message && message.error(e.message)
    }
  })
}

/**
 * 根据发布单ID查询灰度计划
 */
export const useFetchPublishGrayPlan = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.VERSION_PUBLISH_GRAY_PLAN, params],
    () => fetchPublishGrayPlan(params),
    {
      enabled: !!params.publishOrderId,
      onSuccess: (res) => {
        if (!res.success && res.message) {
          message.error(res.message)
        }
      },
      ...options
    }
  )
}
