// Token桥接服务 - 用于在集成模式下将client的token转换为admin可用的session
import { fetchSessionByTicket } from "./api"
import queryString from "query-string"

/**
 * 检查是否为集成模式
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
 * 修复token格式
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

/**
 * Token桥接器 - 将client token转换为admin可用的session
 */
class TokenBridge {
  constructor() {
    this.bridgeCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 将client token转换为admin可用的session
   * @param {string} clientToken - client项目传来的token
   * @returns {Promise<string>} admin可用的session token
   */
  async bridgeToken(clientToken) {
    if (!clientToken) {
      console.warn("[TokenBridge] Client token is empty")
      return ""
    }

    // 检查缓存
    const cacheKey = normalizeToken(clientToken)
    const cached = this.bridgeCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.sessionId
    }

    try {
      // 方案1：尝试通过client的validate2接口验证token
      const clientValidationUrl = `${window.location.origin}/api/sso/validate2`

      try {
        const response = await fetch(
          `${clientValidationUrl}?service=za-open-bot&ticket=${cacheKey}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json, text/plain, */*"
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data?.success && data?.result) {
            const sessionId = data.result

            // 缓存结果
            this.bridgeCache.set(cacheKey, {
              sessionId,
              timestamp: Date.now()
            })

            console.log(
              "[TokenBridge] Successfully validated client token via validate2:",
              sessionId
            )
            return sessionId
          }
        }
      } catch (clientApiError) {
        console.warn(
          "[TokenBridge] Client validate2 API failed, trying admin API...",
          clientApiError
        )
      }

      // 方案2：尝试使用admin的用户中心API验证token
      const response = await fetchSessionByTicket({
        session: cacheKey
      })

      if (response?.data?.sessionId) {
        const sessionId = response.data.sessionId

        // 缓存结果
        this.bridgeCache.set(cacheKey, {
          sessionId,
          timestamp: Date.now()
        })

        console.log("[TokenBridge] Successfully bridged token via admin API:", sessionId)
        return sessionId
      } else {
        throw new Error("No sessionId in response")
      }
    } catch (error) {
      console.error("[TokenBridge] All bridging attempts failed, using original token:", error)

      // 如果所有桥接都失败，返回原始token
      return cacheKey
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.bridgeCache.clear()
  }

  /**
   * 清除过期缓存
   */
  cleanExpiredCache() {
    const now = Date.now()
    for (const [key, value] of this.bridgeCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.bridgeCache.delete(key)
      }
    }
  }
}

// 创建全局实例
const tokenBridge = new TokenBridge()

export default tokenBridge
