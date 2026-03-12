import { Get, Post, Put, Delete, Patch } from "@/api/server"
import { botPrefix } from "@/constants"
const prefix = botPrefix

/**
 * /dictionary/multiModalLlmModelType
 */
export const fetchMultiModalLlmModelType = (params) => {
  return Get(`${prefix}/dictionary/multiModalLlmModelType`, params).then((res) => res.data)
}

/**
 * /dictionary/modalType
 */
export const fetchModalType = (params) => {
  return Get(`${prefix}/dictionary/modalType`, params).then((res) => res.data)
}
