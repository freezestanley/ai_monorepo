import { fetchSessionByTicket, fetchUserInfoBySession } from "./api"
import queryString from "query-string"
import { message } from "antd"
import { isStudio } from "@/config.env"
import tokenBridge from "./tokenBridge"

/**
 * 集成模式判断
 */
const isAdminIntegration = () => {
  try {
    const sp = queryString.parse(window.location.search) || {}
    return String(sp.za_admin_integration || "") === "1"
  } catch (e) {
    return false
  }
}

/**
 * 修复因 query 解析库差异导致 '+' 被转为空格的问题
 */
function normalizeToken(raw) {
  if (!raw) return ""
  let t = String(raw)
  if (isAdminIntegration()) {
    t = t.replace(/ /g, "+")
  }
  try {
    t = decodeURIComponent(t)
  } catch (e) {
    // ignore
  }
  return t
}

const searchParams = queryString.parse(window.location.search) || {}
const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}

const { token, serviceName, servicename, botNo, studioenv } = searchParams.token
  ? searchParams
  : hashParams

/**
 * 异步获取token和service name（支持token桥接）
 */
export const getTokenAndServiceNameAsync = async () => {
  const sn = serviceName ?? servicename ?? "za-open-bot"

  // 集成模式：优先使用 URL token（client 会注入 token=ATLANTIS_SESSION_ID）
  if (isAdminIntegration() && token) {
    const normalized = normalizeToken(token)

    if (normalized) {
      try {
        // 尝试桥接token
        const bridgedToken = await tokenBridge.bridgeToken(normalized)

        // 同步写回 localStorage，保证后续请求头/刷新仍然有会话
        localStorage.setItem("ATLANTIS_SESSION_ID", bridgedToken)

        return { token: bridgedToken, serviceName: sn }
      } catch (e) {
        console.warn("[SSO] Token bridge failed, using original token:", e)
        // 桥接失败时使用原始token
        localStorage.setItem("ATLANTIS_SESSION_ID", normalized)
        return { token: normalized, serviceName: sn }
      }
    }
  }

  // 非集成模式 或 集成模式但URL无token: 优先 localStorage
  const atlantisSession = localStorage.getItem("ATLANTIS_SESSION_ID") || ""
  if (atlantisSession) {
    return { token: atlantisSession, serviceName: sn }
  }

  // 兜底：URL token (主要对非集成模式生效)
  if (token) {
    return { token: normalizeToken(token), serviceName: sn }
  }

  return { token: "", serviceName: sn }
}

/**
 * 同步获取token和service name（保持向后兼容）
 */
export const getTokenAndServiceName = () => {
  const sn = serviceName ?? servicename ?? "za-open-bot"

  // 集成模式：优先使用 URL token（client 会注入 token=ATLANTIS_SESSION_ID）
  // 并同步写回 localStorage，保证后续请求头/刷新仍然有会话。
  if (isAdminIntegration() && token) {
    const normalized = normalizeToken(token)
    if (normalized) {
      try {
        localStorage.setItem("ATLANTIS_SESSION_ID", normalized)
      } catch (e) {
        // ignore
      }
    }
    return { token: normalized, serviceName: sn }
  }

  // 非集成模式 或 集成模式但URL无token: 优先 localStorage
  const atlantisSession = localStorage.getItem("ATLANTIS_SESSION_ID") || ""
  if (atlantisSession) {
    return { token: atlantisSession, serviceName: sn }
  }

  // 兜底：URL token (主要对非集成模式生效)
  if (token) {
    return { token: normalizeToken(token), serviceName: sn }
  }

  return { token: "", serviceName: sn }
}

// 创建Target地址
const createTarget = () => {
  const params = new URLSearchParams(window.location.search)
  params.delete("ticket")
  const hashParamsString = window.location.hash?.split("?")[1]
  const searchParamsString = params.toString()
  let urlParams = ""
  if (hashParamsString && searchParamsString) {
    urlParams = `?${hashParamsString}&${searchParamsString}`
  } else if (hashParamsString || searchParamsString) {
    hashParamsString && (urlParams = `?${hashParamsString}`)
    searchParamsString && (urlParams = `?${searchParamsString}`)
  }
  const targetUrl = `${window.location.origin}${window.location.pathname}${window.location.hash?.split("?")[0] || ""}${urlParams}`
  return encodeURIComponent(targetUrl)
}

// sso登录
export const SSOLogIn = () => {
  // 集成模式：不允许 admin 自己跳转登录，由 host 负责
  if (isAdminIntegration()) {
    const err = new Error("SSO login is disabled in admin integration mode")
    err.code = "ADMIN_INTEGRATION_SSO_DISABLED"
    throw err
  }

  window.localStorage.removeItem("ATLANTIS_SESSION_ID")
  const url = `${userCenterHost()}/login?service=${getTokenAndServiceName().serviceName}&target=${createTarget()}`
  window.location.href = url
}

// sso登出
export const SSOLogOut = () => {
  window.localStorage.clear()
  window.location.href = `${userCenterHost()}/logout?target=${createTarget()}`
}

// 设置请求头部（同步版本，保持向后兼容）
export const SSOReqHeader = (config) => {
  const { token, serviceName } = getTokenAndServiceName()
  const headers = {
    "X-Service-Name": serviceName
  }
  if (config && !config?.url?.endsWith("/validate2")) {
    headers["X-Usercenter-Session"] = token
    if (!config?.url?.endsWith("/userinfo") && isStudio()) {
      headers.botno = botNo || undefined
      headers.studioenv =
        sessionStorage.getItem("isOpenStudioPublish") === "0" ? "prd" : studioenv || "prd"
    }
  }
  if (config?.url?.includes("openapi")) {
    headers["access-channel"] = token
    headers["access-key"] = token
  }

  return headers
}

// 异步设置请求头部（用于集成模式下的token桥接）
export const SSOReqHeaderAsync = async (config) => {
  const { token, serviceName } = await getTokenAndServiceNameAsync()
  const headers = {
    "X-Service-Name": serviceName
  }
  if (config && !config?.url?.endsWith("/validate2")) {
    headers["X-Usercenter-Session"] = token
    if (!config?.url?.endsWith("/userinfo") && isStudio()) {
      headers.botno = botNo || undefined
      headers.studioenv =
        sessionStorage.getItem("isOpenStudioPublish") === "0" ? "prd" : studioenv || "prd"
    }
  }
  if (config?.url?.includes("openapi")) {
    headers["access-channel"] = token
    headers["access-key"] = token
  }

  return headers
}

// 获取ticket
export const SSOGetTicket = () => {
  const { ticket } = queryString.parse(window.location.search)
  if (!ticket) {
    if (!isAdminIntegration()) {
      SSOLogIn()
    }
    return false
  }
  return ticket
}

// ticket置换session接口
export const FetchSessionByTicket = (callback) => {
  const ticket = SSOGetTicket()

  if (ticket) {
    fetchSessionByTicket({
      service: getTokenAndServiceName().serviceName,
      ticket: ticket
    })
      .then((data) => {
        if (data) {
          const { result, success } = data
          if (!success) {
            message.error(data.message)
            if (!isAdminIntegration()) {
              SSOLogIn()
            }
          } else {
            window.localStorage.setItem("ATLANTIS_SESSION_ID", result)
            FetchUserInfoBySession(result, callback)
          }
        }
      })
      .catch((e) => {
        console.log(e)
      })
  }
}

// sessionID置换用户信息接口
export const FetchUserInfoBySession = (sid, callback) => {
  let session_id
  const hash = window.location.hash

  if (hash.includes("?")) {
    const hashParams = new URLSearchParams(hash.split("?")[1])

    const rawSessionId = hashParams.get("session_id")
    session_id = rawSessionId ? encodeURIComponent(rawSessionId) : null
  }

  if (!session_id) {
    const params = new URLSearchParams(window.location.search)
    session_id = params.get("session_id")
  }

  if (session_id) {
    localStorage.setItem("ATLANTIS_SESSION_ID", session_id)
  }

  const encryptedSession = sid ?? getTokenAndServiceName().token
  if (!encryptedSession) {
    return FetchSessionByTicket(callback)
  }

  fetchUserInfoBySession({
    service: getTokenAndServiceName().serviceName,
    encryptedSession
  }).then((data) => {
    if (data) {
      const { result, success } = data
      if (!success) {
        message.error(data.message)
        FetchSessionByTicket(callback)
      } else {
        if (callback) callback(result)
      }
    }
  })
}

// 根据当前host换取对应用户中心的url
export const userCenterHost = () => {
  return getSsoHost()
}

export function isIntl() {
  if (/\.in\.za$/.test(window.location.hostname)) {
    return true
  }
  return false
}

function isInsure() {
  const hostname = window.location.hostname
  const localhost = ["127.0.0.1", "localhost"]
  return (
    hostname.endsWith(".za.biz") ||
    hostname.endsWith(".zhonganonline.com") ||
    localhost.includes(hostname)
  )
}

/**
 * 获取应用地址
 * @param {string} env 环境字符串
 * @returns {string} url 应用端地址
 */
export function getAppUrl(env = getEnv()) {
  const isInternational = isIntl()
  const isZhongAnCom =
    Object.prototype.hasOwnProperty.call(window.location, "hostname") &&
    window.location.hostname.endsWith(".zhongan.com")
  const intlUrls = {
    dev: "https://aigc-dev.in.za",
    sit: "https://aigc-sit.in.za",
    uat: "https://aigc-uat.in.za",
    prd: "https://aigc.in.za"
  }
  const insureUrls = {
    dev: "https://aigc-test.zhonganonline.com",
    test: "https://aigc-test.zhonganonline.com",
    pre: "https://aigc-pre.zhonganonline.com",
    prd: "https://aigc.zhonganonline.com"
  }

  const insureStudioUrls = {
    dev: "https://lingxi-test.zhonganonline.com",
    test: "https://lingxi-test.zhonganonline.com",
    pre: "https://lingxi-pre.zhonganonline.com",
    prd: "https://lingxi.zhonganonline.com"
  }

  const zhongAnUrls = {
    dev: "https://aigc-portal-test.zhongan.com",
    test: "https://aigc-portal-test.zhongan.com",
    pre: "https://aigc-portal-pre.zhongan.com",
    prd: "https://aigc-portal.zhongan.com"
  }
  if (isStudio()) {
    return insureStudioUrls[env]
  }
  if (isInternational) {
    return intlUrls[env]
  }
  if (isZhongAnCom) {
    return zhongAnUrls[env]
  }
  return insureUrls[env]
}

/**
 * 获取环境
 * @returns {string} env
 */
export function getEnv() {
  const str = location.hostname
  const regex = /^aigc-admin-(\w+)\.in\.za$/
  const match = str.match(regex)
  if (match) {
    return match[1]
  }
  const prdENv = [
    "aigc-admin.in.za",
    "aigc-admin.zhonganonline.com",
    "aigc-admin.zhongan.com",
    "lingxi-admin.zhonganonline.com"
  ]
  if (prdENv.includes(str)) {
    return "prd"
  }
  const testEnv = [
    "aigc-admin-test.zhonganonline.com",
    "aigc-admin-test.zhongan.com",
    "lingxi-admin-test.zhonganonline.com"
  ]
  if (testEnv.includes(str)) {
    return "test"
  }
  const preEnv = [
    "aigc-admin-pre.zhonganonline.com",
    "aigc-admin-pre.zhongan.com",
    "lingxi-admin-pre.zhonganonline.com"
  ]
  if (preEnv.includes(str)) {
    return "pre"
  }
  const insureRegex = /^za-aigc-platform-admin-static\.(\w+)\.za\.biz$/
  const insureMatch = str.match(insureRegex)
  if (insureMatch) {
    return insureMatch[1]
  }
  return "dev"
}

/**
 * 获取sso主机
 * @returns
 */
export function getSsoHost() {
  const isInternational = isIntl()
  const currentEnv = getEnv()
  return isInternational
    ? getIntlSsoHost(currentEnv)
    : isInsure()
      ? "https://nsso.zhonganinfo.com"
      : `https://nsso.zhongan.io`
}

function getIntlSsoHost(env = "dev") {
  const intlSsoHost = {
    dev: "https://za-dev-uc.in.za",
    sit: "https://za-sit-uc.in.za",
    uat: "https://za-uat-uc.in.za",
    prd: "https://za-uc.in.za"
  }
  return intlSsoHost[env]
}
