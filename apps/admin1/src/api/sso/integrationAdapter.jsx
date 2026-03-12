// 集成模式下的API适配器 - 让admin项目能够使用client的用户中心API
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
 * 获取client项目的API基础URL
 */
const getClientApiBase = () => {
  const parentOrigin = new URLSearchParams(window.location.search).get("parentOrigin")
  return parentOrigin || window.location.origin
}

/**
 * 集成模式下的SSO适配器
 */
class IntegrationSSOAdapter {
  constructor() {
    this.clientApiBase = getClientApiBase()
  }

  /**
   * 通过client的API验证token
   * @param {string} token - client token
   * @returns {Promise<object>} 验证结果
   */
  async validateTokenWithClient(token) {
    try {
      const response = await fetch(
        `${this.clientApiBase}/api/sso/validate2?service=za-open-bot&ticket=${token}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json, text/plain, */*"
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Client API validation failed: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("[IntegrationSSOAdapter] Client token validation failed:", error)
      throw error
    }
  }

  /**
   * 通过client的API获取用户信息
   * @param {string} token - client token
   * @returns {Promise<object>} 用户信息
   */
  async getUserInfoFromClient(token) {
    try {
      const response = await fetch(`${this.clientApiBase}/api/sso/userinfo`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Usercenter-Session": token
        }
      })

      if (!response.ok) {
        throw new Error(`Client user info failed: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("[IntegrationSSOAdapter] Get user info from client failed:", error)
      throw error
    }
  }

  /**
   * 检查token是否有效
   * @param {string} token - client token
   * @returns {Promise<boolean>} 是否有效
   */
  async isTokenValid(token) {
    try {
      const result = await this.validateTokenWithClient(token)
      return result.success && result.result
    } catch (error) {
      return false
    }
  }
}

// 创建全局实例
const integrationSSOAdapter = new IntegrationSSOAdapter()

export default integrationSSOAdapter
