export const MessageType = {
  /**
   * 刷新聊天页空间列表
   */
  REFRESH_APP_ROBOT_LIST: "refreshAppRobotList",

  TO_APP_ROBOT_DETAIL_PAGE: "toAppRobotDetailPage",

  REFRESH_APP_BOT_LIST: "refreshAppBotList",

  /**
   * 订阅成功消息
   */
  SUBSCRIBE_SUCCESS: "subscribeSuccess",

  /**
   * 跳转到工作流
   */
  NAVIGATE_TO_PROMPT: "navigateToPrompt",

  // 跳转到语音记录
  NAVIGATE_TO_VOICE_RECORD: "navigateTovoiceeRecord",

  // 跳转到话术管理
  NAVIGATE_TO_VOICE_SCRIPT: "navigateTovoiceeScript",

  // 跳转到数据飞轮
  NAVIGATE_TO_FLYWHEEL: "navigateToFlywheel",
  // 跳转到数据飞轮-优化建议中心
  NAVIGATE_TO_FLYWHEEL_OPTIMIZATION: "navigateToFlywheelOptimization",
  // 灵眸内嵌页面跳转至数据飞轮-优化建议中心
  NAVIGATE_TO_OPTIMIZATION_FROM_ARKCES: "navigateToOptimizationFromArkCes",
  // 通知灵眸打开通话详情drawer
  OPEN_CALL_DETAIL_ARKCES: "openCallDetailArkCes"
}
