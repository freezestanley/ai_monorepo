// 测试版本对比功能的示例代码
// 这个文件用于验证新添加的版本对比API接口

import { fetchSkillVersionCompare, fetchVersionContent, enableSkill } from "./api"

// 测试版本对比接口
export const testVersionCompare = async (skillNo) => {
  try {
    console.log("测试版本对比接口...")
    const result = await fetchSkillVersionCompare(skillNo)
    console.log("版本对比数据:", result)
    return result
  } catch (error) {
    console.error("版本对比接口测试失败:", error)
    throw error
  }
}

// 测试版本内容获取接口
export const testVersionContent = async (extraInfo) => {
  try {
    console.log("测试版本内容获取接口...")
    const result = await fetchVersionContent(extraInfo)
    console.log("版本内容:", result)
    return result
  } catch (error) {
    console.error("版本内容获取接口测试失败:", error)
    throw error
  }
}

// 测试启用版本接口
export const testEnableVersion = async (skillNo, versionNo) => {
  try {
    console.log("测试启用版本接口...")
    const result = await enableSkill({ skillNo, versionNo })
    console.log("启用版本结果:", result)
    return result
  } catch (error) {
    console.error("启用版本接口测试失败:", error)
    throw error
  }
}

// 完整的版本对比流程测试
export const testCompleteVersionCompareFlow = async (skillNo) => {
  try {
    // 1. 获取版本对比数据
    const compareData = await testVersionCompare(skillNo)

    if (compareData?.serviceSpeculation?.extraInfo) {
      // 2. 获取推测版本的内容
      await testVersionContent(compareData.serviceSpeculation.extraInfo)
    }

    if (compareData?.allComponents?.length > 0) {
      // 3. 获取第一个历史版本的内容
      const firstVersion = compareData.allComponents[0]
      if (firstVersion.extraInfo) {
        await testVersionContent(firstVersion.extraInfo)
      }

      // 4. 测试启用版本（注意：这会实际修改数据，请谨慎使用）
      // await testEnableVersion(skillNo, firstVersion.versionNo)
    }

    console.log("完整版本对比流程测试完成")
    return true
  } catch (error) {
    console.error("完整版本对比流程测试失败:", error)
    return false
  }
}
