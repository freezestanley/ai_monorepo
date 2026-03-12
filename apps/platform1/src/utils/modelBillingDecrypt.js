/**
 * 模型计费数据解密工具类
 */

/**
 * 解密模型计费数据
 * @param {string} encryptedData - 加密的数据
 * @param {string} secretKey - 解密密钥
 * @returns {object} 解密后的数据对象
 */
export function decryptModelBillingData(encryptedData, secretKey) {
  try {
    // 这里应该实现具体的解密逻辑
    // 由于我们没有实际的加密算法，这里只是模拟解密过程
    // 在实际应用中，这里会使用 AES 或其他加密算法进行解密

    // 模拟解密过程
    const decryptedData = atob(encryptedData) // Base64 解码作为示例
    return JSON.parse(decryptedData)
  } catch (error) {
    console.error("解密模型计费数据失败:", error)
    return null
  }
}

/**
 * 从响应中提取 accessKey
 * @param {object} response - API 响应对象
 * @returns {string|null} accessKey 或 null
 */
export function extractAccessKey(response) {
  try {
    if (response?.data?.accessKey) {
      return response.data.accessKey
    }
    return null
  } catch (error) {
    console.error("提取 accessKey 失败:", error)
    return null
  }
}

/**
 * 格式化模型计费数据用于展示
 * @param {object} rawData - 原始计费数据
 * @returns {object} 格式化后的数据
 */
export function formatModelBillingData(rawData) {
  try {
    if (!rawData || !rawData.bill) {
      return {
        totalAmount: 0,
        requestCount: 0,
        timeRangeDetails: []
      }
    }

    const { bill } = rawData

    return {
      totalAmount: bill.totalAmount || 0,
      requestCount: bill.requestCount || 0,
      timeRangeDetails: bill.timeRangeDetails || []
    }
  } catch (error) {
    console.error("格式化模型计费数据失败:", error)
    return {
      totalAmount: 0,
      requestCount: 0,
      timeRangeDetails: []
    }
  }
}

export default {
  decryptModelBillingData,
  extractAccessKey,
  formatModelBillingData
}
