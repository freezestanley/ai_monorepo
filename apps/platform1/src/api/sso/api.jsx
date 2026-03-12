import { Get, Post, Put, Delete, Patch } from "@/api/server"
import { userCenterHost } from "@/api/sso"

// ticket置换session接口
export const fetchSessionByTicket = (params) => {
  return Get(`${userCenterHost()}/validate2`, params).then((res) => res)
}

// sessionID置换用户信息接口
export const fetchUserInfoBySession = (params) => {
  return Get(`${userCenterHost()}/userinfo`, params).then((res) => res)
}
