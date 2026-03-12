import { useQuery, useMutation } from "@tanstack/react-query"
import {
  fetchPromptDetail,
  savePromptDetail,
  saveAuthPermissionGroup,
  fetchAuthPermissionGroupList,
  fetchAuthPermissionGroupPage,
  deleteAuthPermissionGroup,
  saveAuthRole,
  fetchAuthRoleDetail,
  deleteAuthRole,
  fetchAuthRoleList,
  fetchAuthRolePage,
  fetchAuthUserAdminUser,
  fetchAuthUserPage,
  updateAuthUserRoles,
  fetchAuthResourceListBotResource,
  fetchAuthUserWhetherAdmin,
  fetchDictionaryUserStatus,
  updateAuthUser,
  saveAuthUser,
  fetchAuthPermissionSkillTemplatePage,
  saveSkillTemplate,
  deleteSkillTemplate,
  moveSkillTemplatePosition,
  getMenuTree,
  saveMenuTree,
  getMenuDics,
  delMenuTree,
  getListAdminRoles,
  getDictionaryRoleType,
  getAuthUserDetail,
  saveTag,
  deleteTag,
  getTagPage,
  updateAuthUserStatus
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

/**
 * 获取提示详细信息。
 * @param {Object} params - 查询参数。
 */
export const useFetchPromptDetail = (params) => {
  return useQuery([QUERY_KEYS.PROMPT_DETAIL, params], () => fetchPromptDetail(params))
}

/**
 * 获取标签列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAuthPermissionGroupList = (params) => {
  return useQuery([QUERY_KEYS.AUTH_PERMISSION_GROUP_LIST, params], () =>
    fetchAuthPermissionGroupList(params)
  )
}

/**
 * 获取带分页的标签列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAuthPermissionGroupPage = (params) => {
  return useQuery([QUERY_KEYS.AUTH_PERMISSION_GROUP_PAGE, params], () =>
    fetchAuthPermissionGroupPage(params)
  )
}

/**
 * 获取角色详细信息。
 * @param {Object} params - 查询参数。
 */
export const useFetchAuthRoleDetail = (params) => {
  return useQuery([QUERY_KEYS.AUTH_ROLE_DETAIL, params], () => fetchAuthRoleDetail(params), {
    enabled: !!params.roleNo
  })
}

/**
 * 获取角色列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAuthRoleList = (params) => {
  return useQuery([QUERY_KEYS.AUTH_ROLE_LIST, params], () => fetchAuthRoleList(params))
}

/**
 * 获取带分页的角色列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAuthRolePage = (params) => {
  return useQuery([QUERY_KEYS.AUTH_ROLE_PAGE, params], () => fetchAuthRolePage(params))
}

/**
 * 获取管理员用户列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAuthUserAdminUser = (params) => {
  return useQuery([QUERY_KEYS.AUTH_USER_ADMIN_USER, params], () => fetchAuthUserAdminUser(params))
}

/**
 * 获取带分页的用户列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAuthUserPage = (params) => {
  return useQuery([QUERY_KEYS.AUTH_USER_PAGE, params], () => fetchAuthUserPage(params))
}

/**
 * 获取Bot资源的权限列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAuthResourceListBotResource = (params) => {
  return useQuery(
    [QUERY_KEYS.AUTH_RESOURCE_LIST_BOT_RESOURCE, params],
    () => fetchAuthResourceListBotResource(params),
    {
      // enabled: !!params?.permissionGroupNo
    }
  )
}

// 带描述的变更

/**
 * 保存提示详细信息。
 */
export const useSavePromptDetail = () => {
  return useMutation(savePromptDetail)
}

/**
 * 保存或更新标签。
 */
export const useSaveAuthPermissionGroup = () => {
  return useMutation(saveAuthPermissionGroup)
}

/**
 * 删除标签。
 */
export const useDeleteAuthPermissionGroup = () => {
  return useMutation(deleteAuthPermissionGroup)
}

/**
 * 保存或更新角色。
 */
export const useSaveAuthRole = () => {
  return useMutation(saveAuthRole)
}

/**
 * 删除角色。
 */
export const useDeleteAuthRole = () => {
  return useMutation(deleteAuthRole)
}

/**
 * 更新用户的角色。
 */
export const useUpdateAuthUserRoles = () => {
  return useMutation(updateAuthUserRoles)
}

export const useFetchAuthUserWhetherAdmin = (params) => {
  return useQuery([QUERY_KEYS.AUTH_USER_WHETHER_ADMIN, params], () =>
    fetchAuthUserWhetherAdmin(params)
  )
}

// 状态枚举
export const useFetchDictionaryUserStatus = (params) => {
  return useQuery([QUERY_KEYS.DICTIONARY_USER_STATUS, params], () =>
    fetchDictionaryUserStatus(params)
  )
}

// 更新用户
export const useUpdateAuthUser = () => {
  return useMutation(updateAuthUser)
}

// 新建用户
export const useSaveAuthUser = () => {
  return useMutation(saveAuthUser)
}

/**
 * 获取带分页的工作流模板列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchSkillTemplatePage = (params) => {
  return useQuery([QUERY_KEYS.AUTH_PERMISSION_SKILL_TEMPLATE_PAGE, params], () =>
    fetchAuthPermissionSkillTemplatePage(params)
  )
}

/**
 * 保存或更新工作流模板。
 */
export const useSaveSkillTemplate = () => {
  return useMutation(saveSkillTemplate)
}

/**
 * 删除工作流模板。
 */
export const useDeleteSkillTemplate = () => {
  return useMutation(deleteSkillTemplate)
}

/**
 * 删除工作流模板。
 */
export const useMoveSkillTemplatePosition = () => {
  return useMutation(moveSkillTemplatePosition)
}
/**
 * @description: 资源-菜单类型枚举
 * @return {*}
 */
export const useGetMenuType = () => {
  return useQuery([QUERY_KEYS.AUTH_MENU_TYPE], getMenuDics)
}

/**
 * @description: 资源-菜单树查询
 * @return {*}
 */
export const useGetMenuTree = () => {
  return useQuery([QUERY_KEYS.AUTH_MENU_ROLE_TREE], getMenuTree)
}

/**
 * @description: 资源-菜单保存
 * @return {*}
 */
export const useSaveMenuTree = () => {
  return useMutation(saveMenuTree)
}
/**
 * @description: 资源-菜单删除
 * @return {*}
 */
export const useDelMenuTree = () => {
  return useMutation(delMenuTree)
}

/**
 * @description:  角色管理-所属管理员
 * @return {*}
 */
export const useGetListAdminRoles = () => {
  return useQuery([QUERY_KEYS.AUTH_ADMIN_ROLES], getListAdminRoles)
}

// 角色类型下拉
export const useGetDictionaryRoleType = () => {
  return useQuery([QUERY_KEYS.AUTH_ROLE_TYPE], getDictionaryRoleType)
}

export const useGetAuthUserDetail = (params) => {
  console.log(params)
  return useQuery([QUERY_KEYS.AUTH_USER_DETAIL, params], () => getAuthUserDetail(params), {
    enabled: !!params?.username
  })
}

export const useSaveTag = () => {
  return useMutation(saveTag)
}

export const useDeleteTag = () => {
  return useMutation(deleteTag)
}

export const useGetTagPage = (params) => {
  return useQuery([QUERY_KEYS.TAG_PAGE, params], () => getTagPage(params))
}

export const useUpdateAuthUserStatus = () => {
  return useMutation(updateAuthUserStatus)
}
