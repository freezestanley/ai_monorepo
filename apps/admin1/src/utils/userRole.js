import { fetchAuthUserWhetherAdmin } from "@/api/permission/api"

/**
 * 检查当前用户是否为管理员
 * @param {string} botNo - 机器人编号
 * @returns {Promise<boolean>} - 返回是否为管理员
 */
export const checkIsAdmin = async (botNo) => {
  try {
    const response = await fetchAuthUserWhetherAdmin({ botNo })
    return response?.data === true
  } catch (error) {
    console.error("检查用户角色失败:", error)
    return false
  }
}

/**
 * 获取当前用户的角色类型
 * @param {string} botNo - 机器人编号
 * @returns {Promise<'admin'|'user'|'unknown'>} - 返回用户角色类型
 */
export const getUserRole = async (botNo) => {
  const isAdmin = await checkIsAdmin(botNo)
  if (isAdmin) {
    return "admin"
  }
  return "user"
}
