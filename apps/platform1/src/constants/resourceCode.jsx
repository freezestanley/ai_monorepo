/**
 * WEB应用端(webPage)
	- 管理平台入口按钮(buttonOfBackstageManagementAccess)
灵犀管理后台(backstageManagementPage)
	- 空间管理(botManageMenu)
		- 空间列表(botListMenu)
			- 新建空间(buttonOfCreateBot)
			- 删除空间(buttonOfDeleteBot)
			- 上下线空间(buttonOfOfflineOrOnlineBot)
			- 编辑(editBotMenu)
				- 基本信息(botBaseInfoMenu)
				- 工作流(skillManageMenu)
				- 知识库(knowledgeManageMenu)
	- 权限管理(authManageMenu)
		- 用户管理(authUserManageMenu)
		- 角色管理(authRoleManageMenu)
		- 标签管理(authPermissionGroupManageMenu)
		- 菜单管理(authResourceMenu)
	- 模板管理(templateManageMenu)
		- 工作流模板(skillTemplateMenu)
 * 
 */

export const RESOURCE_CODE = {
  BTN_BOT_CREATE: "buttonOfCreateBot", // 新建空间
  BTN_BOT_LINE: "buttonOfOfflineOrOnlineBot", // 上下线空间
  BTN_BOT_EDIT: "editBotMenu", // 编辑空间
  BTN_BOT_DELETE: "buttonOfDeleteBot", // 删除空间
  BTN_BOT_BASE_EDIT: "botBaseInfoMenu", // 编辑空间基本信息
  BTN_SKILL_EDIT: "skillManageMenu", // 编辑空间工作流
  BTN_KNOW_EDIT: "knowledgeManageMenu", // 编辑空间知识库
  BTN_FAQ_UPLOAD_DOWNLOAD: "faqUploadDownload", // FAQ上传下载权限
  BTN_FAQ_INSERT: "faqInsert" // FAQ新增知识权限
}
