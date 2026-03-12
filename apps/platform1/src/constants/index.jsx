/*
 * @Author: Dyton
 * @Date: 2024-03-21 11:33:43
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-21 15:46:46
 * @FilePath: /za-aigc-platform-admin-static/src/constants/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
export const BotStatus = {
  ONLINE: "online",
  OFFLINE: "offline"
}

export const languages = [
  { id: "CN", name: "简体中文" },
  { id: "HK", name: "繁体中文" },
  { id: "EN", name: "英语" }
]

export const TABS = {
  PERSONAL_INFO: "1",
  KNOWLEDGE_BASE: "2",
  SKILL: "3",
  AGENT: "4"
}
export const news = "/news"
export const botPrefix = "/botWeb"
export const knowledgePrefix = "/knowledgeWeb"
export const knowledgeExtractorPrefix = "/knowledgeExtractorWeb"
export const nluPrefix = "/nluWeb"
export const adminPrefix = "/admin"
export const voiceAgentPrefix = "/voiceAgentWeb"
export const timbrePrefix = "/timbreWeb"
export const flywheelPrefix = "/flywheel"
export const technicalRadarPrefix = "/technicalRadarWeb"

export const inputTypes = [
  { en: "singleLineText", zh: "单行文本" },
  { en: "multiLineText", zh: "多行文本" },
  { en: "singleChoice", zh: "单选" },
  { en: "multipleChoice", zh: "多选" },
  { en: "dropdownSingleChoice", zh: "下拉框（单选）" },
  { en: "dropdownMultipleChoice", zh: "下拉框（多选）" },
  { en: "number", zh: "数字" },
  { en: "switch", zh: "开关" }
]

export const temperatures = ["低", "中", "高"]
export const inputSources = ["表单控件", "全局变量"]
export const globalVariables = [
  { name: "全局变量1", fieldName: "字段1", description: "描述1" },
  { name: "全局变量2", fieldName: "字段2", description: "描述2" },
  { name: "全局变量3", fieldName: "字段3", description: "描述3" }
]

export const parseTypes = ["string", "int", "float"]

export const DrawerStates = {
  UPLOAD_DOCUMENT: "UPLOAD_DOCUMENT",
  UPLOAD_PROGRESS: "UPLOAD_PROGRESS",
  UPLOAD_PREVIEW: "UPLOAD_PREVIEW"
}

export const avatarMode = {
  bot: "BOT",
  skill: "SKILL"
}

export const marks = {
  0: "准确",
  2: "创意"
}

export const AVATAR_ICON_TYPE = {
  CUSTOM: "CUSTOM", // 自定义
  SYSTEM: "SYSTEM" // 系统自带
}

// 默认欢迎语
export const DEFAULT_GREETING =
  "嗨！我是灵犀，你的智能伙伴。无论你想找灵感、写文案，还是需要一个陪伴聊天解闷，我都会全力以赴!"

export const SKILLICONTYPE = {
  1: "icon-liaotianjineng",
  2: "icon-biaodanjineng",
  3: "icon-APIjineng",
  4: "icon-APIjineng",
  5: "icon-gongzuoliubate1"
}

export const DEFAULTNAMESPACE = "AIGC_PLATFORM"

export const DEBUG_HISTORY_DATA_CONFIG = {
  STORE_KEY: "history-debug-data-storage",
  STORE_EXPIRE_TIME: 5 * 24 * 60 * 60 * 1000 // 5天
}

export const parseModalTypeTagColor = (type) => {
  switch (type) {
    case "TEXT":
      return "green"
    case "IMAGE":
      return "blue"
    case "VIDEO":
      return "red"
    default:
      return "magenta"
  }
}

export const KNOWLEDGE_SCENE_TAG = "knowledgeSceneTag"
