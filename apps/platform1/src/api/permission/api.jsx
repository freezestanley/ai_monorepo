// api.js
import { Get, Post, Delete, Put } from "@/api/server"
import { botPrefix } from "@/constants"
import { downloadFileWithHeaders } from "../tools"

// Prompt-查询详情
// GET /admin/prompt/debug/{skillNo}/{componentNo}/detail
export const fetchPromptDetail = (params) => {
  return Get(`${botPrefix}/admin/prompt/debug/${params.skillNo}/${params.componentNo}/detail`).then(
    (res) => res.data
  )
}

// Prompt-修改详情
// POST /admin/prompt/debug/{skillNo}/{componentNo}/save
export const savePromptDetail = (params) => {
  return Post(
    `${botPrefix}/admin/prompt/debug/${params.skillNo}/${params.componentNo}/save`,
    params
  ).then((res) => res)
}

// 权限组 - 保存
// POST / admin / authPermissionGroup / save
export const saveAuthPermissionGroup = (params) => {
  return Post(`${botPrefix}/admin/authPermissionGroup/save`, params).then((res) => res)
}

// 权限组 - 列表查询
// GET / admin / authPermissionGroup / list
export const fetchAuthPermissionGroupList = (params) => {
  return Get(`${botPrefix}/admin/authPermissionGroup/listRestricted`, params).then(
    (res) => res.data
  )
}

// 权限组 - 分页查询
// GET / admin / authPermissionGroup / page
export const fetchAuthPermissionGroupPage = (params) => {
  return Get(`${botPrefix}/admin/authPermissionGroup/page`, params).then((res) => res.data)
}

// 权限组 - 删除
// DELETE / admin / authPermissionGroup / { permissionGroupNo }
export const deleteAuthPermissionGroup = (params) => {
  return Delete(`${botPrefix}/admin/authPermissionGroup/${params.permissionGroupNo}`).then(
    (res) => res
  )
}

// 角色 - 保存
// POST / admin / authRole / save
export const saveAuthRole = (params) => {
  return Post(`${botPrefix}/admin/authRole/save`, params).then((res) => res)
}

// 角色 - 查询详情
// GET / admin / authRole / detail / { roleNo }
export const fetchAuthRoleDetail = (params) => {
  return Get(`${botPrefix}/admin/authRole/detail/${params.roleNo}`).then((res) => res.data)
}

// 角色 - 删除
// DELETE / admin / authRole / { roleNo }
export const deleteAuthRole = (params) => {
  return Delete(`${botPrefix}/admin/authRole/${params.roleNo}`).then((res) => res)
}

// 角色 - 列表
// GET / admin / authRole / list
export const fetchAuthRoleList = (params) => {
  return Get(`${botPrefix}/admin/authRole/list`, params).then((res) => res.data)
}

// 角色 - 分页查询
// GET / admin / authRole / page
export const fetchAuthRolePage = (params) => {
  return Get(`${botPrefix}/admin/authRole/pageAdministrableRoles`, params).then((res) => res.data)
}

// 用户 - 超管账号列表
// GET / admin / authUser / adminUser
export const fetchAuthUserAdminUser = (params) => {
  return Get(`${botPrefix}/admin/authUser/adminUser`, params).then((res) => res.data)
}

// 用户 - 分页查询
// GET / admin / authUser / page
export const fetchAuthUserPage = (params) => {
  return Get(`${botPrefix}/admin/authUser/page`, params).then((res) => res.data)
}

// 用户 - 赋权
// POST / admin / authUser / { username } / updateRoles
export const updateAuthUserRoles = (params) => {
  return Post(`${botPrefix}/admin/authUser/${params.username}/updateRoles`, params).then(
    (res) => res
  )
}

// 权限资源 - BOT数据资源
// GET / admin / authResource / listBotResource
export const fetchAuthResourceListBotResource = (params) => {
  return Get(`${botPrefix}/admin/authResource/listBotResource`, params).then((res) => res.data)
}

// 用户-是否是超管 get /admin/authUser/whetherAdmin
export const fetchAuthUserWhetherAdmin = (params) => {
  return Get(`${botPrefix}/admin/authUser/whetherAdmin`, params).then((res) => res.data)
}

//用户-状态列表  /dictionary/userStatus
export const fetchDictionaryUserStatus = (params) => {
  return Get(`${botPrefix}/dictionary/userStatus`, params).then((res) => res.data)
}

// 用户-更新 POST/admin/authUser/update
export const updateAuthUser = (params) => {
  return Put(`${botPrefix}/admin/authUser/update`, params).then((res) => res)
}

// 新建用户
// Post /admin/authUser
export const saveAuthUser = (params) => {
  return Post(`${botPrefix}/admin/authUser`, params).then((res) => res)
}

// FAQ-用户模板下载
export const getUserUploadTemplate = () => {
  downloadFileWithHeaders(`${botPrefix}/人员导入模板.xlsx`)
}

// 批量导入 /admin/authUser/batchImport

export const batchImportAuthUser = () => {
  return `${botPrefix}/admin/authUser/batchImport`
}

// 工作流模板 - 分页查询
// GET / admin / authPermissionSkillTemplate / page
export const fetchAuthPermissionSkillTemplatePage = (params) => {
  return Get(`${botPrefix}/admin/skillTemplate/pageQuery`, params).then((res) => res.data)
}

// 工作流模板 - 保存
// Put / admin / saveSkillTemplate / save
export const saveSkillTemplate = (params) => {
  return Put(`${botPrefix}/admin/skillTemplate`, params).then((res) => res)
}

// 工作流模板 - 删除
// DELETE / admin / SkillTemplate / { permissionGroupNo }
export const deleteSkillTemplate = (params) => {
  return Delete(`${botPrefix}/admin/skillTemplate/${params.skillTemplateId}`).then((res) => res)
}

// 工作流模板 - 删除
// DELETE / admin / moveSkillTemplatePosition / { skillTemplateId }
export const moveSkillTemplatePosition = (params) => {
  return Post(
    `${botPrefix}/admin/skillTemplate/${params.skillTemplateId}/modifyPosition`,
    params
  ).then((res) => res)
}
/**
 * @description: 资源-菜单类型枚举
 * @return {*}
 */
export const getMenuDics = () => {
  return Get(`${botPrefix}/dictionary/authResourceType`).then((res) => res.data)
}
/**
 * @description: 资源-菜单树查询
 * @return {*}
 */
export const getMenuTree = () => {
  return Get(`${botPrefix}/admin/authResource/tree`).then((res) => res.data || [])
}
/**
 * @description: 资源-菜单保存
 * @return {*}
 */
export const saveMenuTree = (p) => {
  return Post(`${botPrefix}/admin/authResource/save`, p).then((res) => res)
}
/**
 * @description: 资源-菜单保存
 * @return {*}
 */
export const delMenuTree = (resourceNo) => {
  return Delete(`${botPrefix}/admin/authResource/${resourceNo}`).then((res) => res)
}
// 资源-用户拥有的菜单按钮资源
export const getUserAuthResources = (params) => {
  return Get(`${botPrefix}/admin/authUser/menuResource`, params).then((res) => res.data)
}
// 角色管理-所属管理员
export const getListAdminRoles = () => {
  return Get(`${botPrefix}/admin/authRole/listAdminRoles`).then((res) => res.data)
}

// 角色类型下拉
// /dictionary/roleType
export const getDictionaryRoleType = () => {
  return Get(`${botPrefix}/dictionary/roleType`).then((res) => res.data)
}

// 用户-查询详情
export const getAuthUserDetail = (params) => {
  return Get(`${botPrefix}/admin/authUser/${params.username}`).then((res) => res.data)
}

// 标签-分页查询
// GET/admin/tag/page
export const getTagPage = (params) => {
  return Get(`${botPrefix}/admin/tag/page`, params).then((res) => res.data)
}

// 标签-删除
// DELETE/admin/tag/{tagNo}
export const deleteTag = (params) => {
  return Delete(`${botPrefix}/admin/tag/${params.tagNo}`).then((res) => res)
}

// 标签-保存
// POST/admin/tag/save
export const saveTag = (params) => {
  return Post(`${botPrefix}/admin/tag/save`, params).then((res) => res)
}

// 用户-停用/启用
// PUT/admin/authUser/{username}/updateStatus
export const updateAuthUserStatus = (params) => {
  return Put(`${botPrefix}/admin/authUser/${params.username}/updateStatus`, params).then(
    (res) => res
  )
}

// 用户-查询部门列表
// GET /admin/uc/depts
export const getDepartments = (params) => {
  return Get(`${botPrefix}/admin/uc/depts`, params).then((res) => res)
}

// 添加获取公司列表的接口
export const getCompanys = (params) => {
  return Get(`${botPrefix}/admin/uc/companys`, params).then((res) => res)
}

// 用户-查sso用户基本信息
export const getUserInfoFromSso = (params) => {
  //  /admin/authUser/info-from-sso
  return Get(`${botPrefix}/admin/uc/user`, params).then((res) => res)
}
