import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createApplication,
  fetchApplicationList,
  updateApplication,
  updateApplicationStatus,
  deleteApplication
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

export const useCreateApplication = () => {
  const queryClient = useQueryClient()
  return useMutation(createApplication, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.APPLICATION_LIST])
    }
  })
}

export const useFetchApplicationList = (params) => {
  return useQuery([QUERY_KEYS.APPLICATION_LIST, params], () => fetchApplicationList(params))
}

export const useUpdateApplication = () => {
  const queryClient = useQueryClient()
  return useMutation(updateApplication, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.APPLICATION_LIST])
    }
  })
}

export const useApplicationStatus = () => {
  const queryClient = useQueryClient()
  return useMutation(updateApplicationStatus, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.APPLICATION_LIST])
    }
  })
}

export const useDeleteApplication = () => {
  const queryClient = useQueryClient()
  return useMutation(deleteApplication, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.APPLICATION_LIST])
    }
  })
}
