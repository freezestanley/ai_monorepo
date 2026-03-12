/**
 * api：聊天接口
 */
export const API_BOT_CHAT = '/bot/chat'

/**
 * api：空间列表接口
 */
export const API_BOT_LIST = '/bot/list'

/**
 * api：空间工作流列表接口
 */
export const API_BOT_SKILL_LIST = '/bot/skill/list'

/**
 * dev后端地址前缀
 */
export const API_SERVER_PREFIX = 'http://208381-za-aigc-platform.test.za.biz'

/**
 * dev后台管理地址
 */
export const ADMIN_URL = 'http://2226021-za-aigc-platform-admin-static.test.za.biz/#/'

/**
 * 请求头的服务名
 */
export const SERVICE_NAME = 'za-open-bot'

/**
 * /validate2
 */
export const SSO_VALIDATE2 = '/validate2'

// 篇幅-枚举
export const LIMIT_ENUM = '/dictionary/articleLimitType'

// 文风-枚举
export const STYLE_ENUM = '/dictionary/writingStyleType'

// 语种列表
export const LANGUAGE_ENUM = '/dictionary/languageType'

// 提纲层级列表
export const OUTLINE_LEVEL_ENUM = '/dictionary/outlineLevelType'

// 图片比例列表
export const RATIO_ENUM = '/dictionary/RatioType'

// 图片画风列表
export const DRAWING_STYLE_ENUM = '/dictionary/drawingStyleType'

// 图片生成状态列表
export const IMAGE_STATUS_ENUM = '/dictionary/statusType'

// 材质列表
export const MATERIAL_ENUM = '/dictionary/materialType'

// 视角列表
export const CAMERA_VIEW_ENUM = '/dictionary/cameraType'

// 年代列表
export const AGE_ENUM = '/dictionary/ageType'

// 背景列表
export const ENVIRONMENT_ENUM = '/dictionary/environmentsType'

// 表情列表
export const EMOTE_ENUM = '/dictionary/emoteType'

// 艺术家列表
export const ARTIST_ENUM = '/dictionary/artistType'

// 品质列表
export const QUALITY_ENUM = '/dictionary/qualityType'

// 图片相关枚举
export const IMAGE_ENUMs = [
  RATIO_ENUM,
  DRAWING_STYLE_ENUM,
  CAMERA_VIEW_ENUM,
  AGE_ENUM,
  ENVIRONMENT_ENUM,
  EMOTE_ENUM,
  ARTIST_ENUM,
  MATERIAL_ENUM,
  QUALITY_ENUM
]

// 流式输出TASKTYPE
// PAPER_GENERATE("文章生成")
//  PICTURE_GENERATE("图片生成")
// PAPER_OUTLINE_GENERATE("文章提纲生成")
export const TASK_TYPE_ENUM = {
  PAPER_GENERATE: 'PAPER_GENERATE',
  PICTURE_GENERATE: 'PICTURE_GENERATE',
  PAPER_OUTLINE_GENERATE: 'PAPER_OUTLINE_GENERATE',
  TITLE_GENERATE: 'TITLE_GENERATE',
  TRANSLATE: 'TRANSLATE',
  CONTINUED: 'CONTINUED',
  RE_WRITTEN: 'RE_WRITTEN',
  FREEDOM: 'FREEDOM'
}

export const translateEnum = {
  简体中文: 'cn',
  英文: 'en',
  粤语: 'hk'
}

/**
 * sso类型
 */
export enum SSO_TYPE {
  /**
   * 需要退出去登录的，此时不能自动登录
   */
  LOGOUT = '1',
  /**
   * 只需要去登录的，可以自动登录
   */
  LOGIN = '0'
}
