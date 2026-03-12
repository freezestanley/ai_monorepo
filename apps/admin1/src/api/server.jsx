/*
 * @Author: Dyton
 * @Date: 2024-03-12 11:20:14
 * @Descripttion:
 * @LastEditors: xuyang003@zhongan.com
 * @LastEditTime: 2024-03-21 17:10:38
 * @FilePath: /za-aigc-platform-admin-static/src/api/server.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import axios from "axios"
import { message } from "antd"
import { SSOReqHeader, SSOLogIn } from "@/api/sso"
import queryString from "query-string"

const searchParams = queryString.parse(window.location.search) || {}
const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
const { token, workbenchNo, botNo } = searchParams.token ? searchParams : hashParams

const isAdminIntegration = () => {
  try {
    const searchValue = String(searchParams.za_admin_integration || "")
    if (searchValue === "1") return true
    const hashValue = String(hashParams.za_admin_integration || "")
    return hashValue === "1"
  } catch (e) {
    console.error("[Server] Error checking admin integration:", e)
    return false
  }
}

const getClientApiBase = () => {
  const parentOrigin = searchParams.parentOrigin
  return parentOrigin || window.location.origin
}

const getAgentNoFromLocation = () => {
  try {
    const currentSearch = queryString.parse(window.location.search) || {}
    const currentHashSearch = queryString.parse(window.location.hash.split("?")[1] || "") || {}
    const value = currentSearch.agentNo ?? currentHashSearch.agentNo
    return Array.isArray(value) ? value[0] : value
  } catch (error) {
    console.warn("[Server] Failed to parse agentNo from location:", error)
    return undefined
  }
}

const redirectApiToClient = (config) => {
  if (isAdminIntegration()) {
    const redirectPaths = ["/botWeb", "/timbreWeb", "/knowledgeWeb", "/voiceAgentWeb"]
    const shouldRedirect = redirectPaths.some((path) => config?.url?.startsWith(path))

    if (shouldRedirect) {
      const clientBase = getClientApiBase()
      const matchingPath = redirectPaths.find((path) => config?.url?.startsWith(path))
      config.url = config.url.replace(matchingPath, `${clientBase}${matchingPath}`)
      config.baseURL = ""
      console.log("[Server] Redirected API to client:", config.url)
    } else {
      console.log("[Server] No redirect needed for:", config.url)
    }
  } else {
    console.log("[Server] Not in integration mode, no redirect")
  }
  return config
}

axios.interceptors.request.use(
  (config) => {
    config = redirectApiToClient(config)

    if (!config.headers) {
      config.headers = {}
    }

    // SSO相关接口不需要业务headers
    if (
      !config?.url.includes("nsso.") &&
      !config?.url.includes("za-uc.") &&
      !config?.url.includes("za-uat-uc.") &&
      !config?.url.includes("/userinfo")
    ) {
      const agentNo = getAgentNoFromLocation()
      Object.assign(config.headers, {
        BotNo: botNo || undefined,
        agentNo: agentNo || undefined,
        WorkbenchNo: workbenchNo || undefined,
        IsIframe: token ? true : false,
        ...config.headers
      })
    }

    // 关键修复：完全复制client的token逻辑
    if (isAdminIntegration()) {
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.split("?")[1] || "")
      const tokenFromUrl = urlParams.get("token") || hashParams.get("token")

      if (tokenFromUrl) {
        let decodedToken = tokenFromUrl
        try {
          decodedToken = decodeURIComponent(tokenFromUrl)
        } catch {
          decodedToken = tokenFromUrl
        }

        // 关键：使用encodeURIComponent，与client完全一致
        config.headers["X-Usercenter-Session"] = encodeURIComponent(decodedToken)

        try {
          localStorage.setItem("ATLANTIS_SESSION_ID", decodedToken)
          console.log("[Server] Token with encodeURIComponent:", encodeURIComponent(decodedToken))
        } catch (e) {
          console.warn("[Server] Failed to set localStorage:", e)
        }
      }

      // SSO相关接口只设置基本的headers
      if (!config?.url.includes("/userinfo")) {
        config.headers["X-Service-Name"] = "za-open-bot"
        config.headers["Accept"] = "application/json, text/plain, */*"
        config.headers["X-Requested-With"] = "XMLHttpRequest"
        config.headers["X-Platform-Type"] = "web"
      }
    } else {
      Object.assign(config.headers, SSOReqHeader(config))
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  (response) => {
    if (!response) {
      return Promise.reject(new Error("Response is undefined"))
    }

    if (response?.config?.responseType === "blob") {
      return response
    }

    if (response.status !== 200) {
      message.warning(response.data?.message || response.data?.msg)
    }

    if (response.data?.code === 401) {
      if (!isAdminIntegration()) {
        SSOLogIn()
      }
    }

    return response.data
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.log("Request cancelled", error.message)
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          if (!isAdminIntegration()) {
            SSOLogIn()
          }
          break
        case 403:
          window.location.hash = "#/404"
          message.warning("当前页面暂无权限！")
          break
        case 500:
          message.warning("服务器错误，请稍后再试！")
          break
        default:
          message.warning(error.response?.data?.message || "请求失败")
          break
      }
    } else if (error.code === "ECONNABORTED") {
      message.warning("请求超时，请检查网络连接")
    } else {
      message.warning("请求配置错误")
    }
    return Promise.reject(error)
  }
)

export const Get = (url, params = {}, config = {}) => {
  return axios({
    method: "get",
    url,
    params,
    ...config
  })
}

export const Post = (url, data = {}, config = {}) => {
  return axios({
    method: "post",
    url,
    data,
    ...config
  })
}

export const Put = (url, data = {}, config = {}) => {
  return axios({
    method: "put",
    url,
    data,
    ...config
  })
}

export const Delete = (url, params = {}, config = {}) => {
  return axios({
    method: "delete",
    url,
    params,
    ...config
  })
}

export const Patch = (url, data = {}, config = {}) => {
  return axios({
    method: "patch",
    url,
    data,
    ...config
  })
}

export const Upload = (url, data = {}, config = {}) => {
  return axios({
    method: "post",
    url,
    data,
    headers: {
      "Content-Type": "multipart/form-data",
      ...config.headers
    },
    ...config
  })
}

export default axios
