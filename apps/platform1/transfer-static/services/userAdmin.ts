import { Get, Post, Put, Delete } from "@/api/server"

const prefix = "/botWeb"

/**
 * 增
 * @param options
 * @returns
 */
// export const createUser = (options: any) => apiRequest(`/admin/bot/${options.botNo}/authUser`, 'post', options)
export const createUser = (options: any) => {
  return Post(`${prefix}/admin/bot/${options.botNo}/authUser`, options).then((res) => res.data)
}
/**
 * 删
 * @param options
 * @returns
 */
export const deleteUser = async (options: any) =>
  Delete(`${prefix}/admin/bot/${options.botNo}/authUser`, options).then((res) => res.data)

/**
 * 改
 * @param options
 * @returns
 */
export const editUser = async (options: any) =>
  Put(`${prefix}/admin/bot/${options.botNo}/authUser`, options).then((res) => res.data)

/**
 * 获取当前用户当前空间角色列表
 * @param options
 * @returns
 */
export const getBotRoleList = async (options: any) =>
  Get(`${prefix}/admin/bot/${options.botNo}/authRole`, options).then((res) => res.data)

/**
 * 用户管理-查sso用户基本信息
 * @param params
 * @returns
 */
export const getUserInfoFromSso = async (params: any) => {
  // /authUser/info-from-sso
  return Get(`/admin/uc/user`, params, { customErrorTips: true }).then((res) => res.data)
}

/**
 * 获取角色类型列表
 * @param options
 * @returns
 */
export const getRoleTypeList = async (options: any) =>
  Get(`${prefix}/dictionary/roleType`, options).then((res) => res.data)

/**
 * 角色管理-获取菜单树
 * @param options
 * @returns
 */
export const getBotMenuTree = async (options: any) =>
  Get(`${prefix}/admin/bot/${options.botNo}/authResource/tree`, options).then((res) => res.data)

/**
 * 角色管理-创建自定义角色
 * @param options
 * @returns
 */
export const createCustomRole = async (options: any) =>
  Post(`${prefix}/admin/bot/${options.botNo}/authRole/save`, options).then((res) => res.data)

/**
 * 角色管理-删除自定义角色
 * @param options
 * @returns
 */
export const deleteCustomRole = async (options: any) =>
  Delete(`${prefix}/admin/authRole/${options.roleNo}`, options).then((res) => res.data)

/**
 * 角色管理-修改自定义角色
 * @param options
 * @returns
 */
export const editCustomRole = async (options: any) =>
  Post(`${prefix}/admin/bot/${options.botNo}/authRole/save`, options).then((res) => res.data)

/**
 * 角色管理-获取自定义角色详情
 * @param options
 * @returns
 */
export const getRoleDetail = async (options: any) =>
  Get(`${prefix}/admin/authRole/detail/${options.roleNo}`, options).then((res) => res.data)

/**
 * 角色管理-获取渠道来源列表
 * @param options
 * @returns
 */
export const getChannelList = async (options: any) =>
  Get(`${prefix}/admin/authResource/${options.botNo}/${options.dataType}/list`, options).then(
    (res) => res.data
  )

/**
 * 角色管理-获取按钮权限列表
 * @param options
 * @returns
 */
export const listResource = async (options: any) =>
  Post(`${prefix}/admin/authResource/listResource`, options).then((res) => res.data)

/**
 * 角色管理-获取字典（上传按钮）
 * @param options
 * @returns
 */
export const getConstant = async (options: any) =>
  Get(`${prefix}/admin/bot/constant/${options.botNo}/page`, options).then((res) => res.data)
