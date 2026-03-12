/**
 * 消息类型
 * @enum {string}
 */
export enum MessageType {
  /**
   * 应用进入
   */
  APP_ENTER = 'appEnter',

  /**
   * 重置iframe
   */
  RESIZE_IFRAME = 'resizeIframe',

  /**
   * 小屏情况下关闭iframe
   */
  CLOSE_IFRAME = 'closeIframe',

  /**
   * 小屏情况下右上角隐藏iframe
   */
  HIDE_IFRAME = 'hideIframe',

  /**
   * 同步bot列表
   */
  SYNC_BOT_LIST = 'syncBotList',

  /**
   * 选择某个空间
   */
  SELECT_BOT = 'selectBot',

  /**
   * 回到首页
   */
  GO_TO_HOME = 'goToHome',

  /**
   * 新增常量
   */
  NEW_CONSTANT = 'newConstant',

  /**
   * 刷新聊天页空间列表
   */
  REFRESH_ROBOT_LIST = 'refreshAppRobotList',
  TO_APP_ROBOT_DETAIL_PAGE = 'toAppRobotDetailPage',
  REFRESH_APP_BOT_LIST = 'refreshAppBotList',

  /**
   * 跳转到工作流
   */
  NAVIGATE_TO_PROMPT = 'navigateToPrompt',

  // 跳转到语音记录
  NAVIGATE_TO_VOICE_RECORD = 'navigateTovoiceeRecord',
  // 跳转到话术管理
  NAVIGATE_TO_VOICE_SCRIPT = 'navigateTovoiceeScript',

  /**
   * 跳转到优化单
   */
  NAVIGATE_TO_OPTIMIZE_ORDER = 'navigateToOptimizeOrder',
  /**
   * 跳转到数据飞轮
   */
  NAVIGATE_TO_FLYWHEEL = 'navigateToFlywheel',
  NAVIGATE_TO_FLYWHEEL_OPTIMIZATION = 'navigateToFlywheelOptimization',

  // 自动打开 语音-话术管理 创建话术手提
  IS_OPEN_VOICE_SCRIPT_ENIT = 'IS_OPEN_VOICE_SCRIPT_ENIT'
}

/* 
  反馈来源
*/

export const feedbackSource: any = {
  chat_with_ai: 'common',
  image_text_gen: 'image_text_gen',
  question_gen: 'question_gen'
}
