// 临时解决方案：直接使用client项目的请求逻辑
// 在集成模式下，通过postMessage请求client项目发送API请求

const useClientProxy = () => {
  const isIntegration =
    String(new URLSearchParams(window.location.search).get("za_admin_integration")) === "1"

  if (!isIntegration) {
    return null
  }

  return {
    get: (url, params, config) => {
      return new Promise((resolve, reject) => {
        const requestId = Date.now()

        const handleMessage = (event) => {
          if (event.data.type === "API_RESPONSE" && event.data.requestId === requestId) {
            window.removeEventListener("message", handleMessage)
            if (event.data.success) {
              resolve(event.data.data)
            } else {
              reject(new Error(event.data.error))
            }
          }
        }

        window.addEventListener("message", handleMessage)

        // 向parent请求发送API请求
        window.parent.postMessage(
          {
            type: "API_REQUEST",
            requestId,
            method: "get",
            url,
            params,
            config
          },
          "*"
        )

        // 超时处理
        setTimeout(() => {
          window.removeEventListener("message", handleMessage)
          reject(new Error("API request timeout"))
        }, 10000)
      })
    }
  }
}

export default useClientProxy
