# Admin1 子项目功能分析报告

> 生成日期: 2026-03-12
> 分析范围: `apps/admin1` 子项目
> 目标: 梳理 Admin 端与 Platform 端的所有功能、影响面及源码文件路径

---

## 目录

- [1. 项目概况](#1-项目概况)
- [2. 端的区分机制](#2-端的区分机制)
- [3. Admin 端功能清单](#3-admin-端功能清单)
- [4. Platform 端功能清单](#4-platform-端功能清单)
- [5. 共享模块 (跨端复用)](#5-共享模块-跨端复用)
- [6. 功能影响面矩阵](#6-功能影响面矩阵)
- [7. 拆分建议](#7-拆分建议)

---

## 1. 项目概况

`apps/admin1` 是一个 React + Vite 项目，当前 **Admin 管理端** 和 **Platform 用户端** 功能混合在同一项目中。

### 技术栈
- **框架**: React 18 + Vite
- **UI 库**: Ant Design
- **状态管理**: Redux + Zustand + React Query
- **路由**: React Router v6 (lazy loading via `withLoadable`)
- **样式**: Less + Tailwind CSS
- **SSO**: `SSOProvider` 认证

### 项目结构概览
```
apps/admin1/src/
├── api/                 # API 服务层 (48 个子模块)
├── assets/              # 静态资源
├── components/          # 共享 UI 组件 (80+)
├── components-v2/       # 新版 UI 组件 (8 个)
├── constants/           # 常量定义 (14 个文件)
├── hooks/               # 自定义 Hooks
├── pages/               # 页面组件 (45 个目录)
├── pages-v2/            # 新版页面 (publicResources)
├── router/              # 路由配置
├── store/               # Redux Store
├── utils/               # 工具函数
├── packages/            # Chat 组件包
└── transfer-static/     # 迁移的旧静态项目组件
```

---

## 2. 端的区分机制

### 路由层面
| 端 | 路由前缀 | 入口组件 | 布局 |
|---|---|---|---|
| **Admin** | `/admin/*` | `Entry` (src/pages/entry/) | Header + Sidebar + Content |
| **Platform** | `/` (无前缀) | `UserEntry` (src/components/UserEntry.jsx) | MainLayout |

### 权限机制
- **权限 Hook**: `useAuthResources()` / `useMenuResourcesCodes()`
- **菜单动态渲染**: 根据 `getUserAuthResources()` 返回的资源码过滤菜单项
- **资源码定义**: `src/constants/resourceCode.jsx`
- **路由守卫**: `PrivateRoute` 检查 `localStorage` 中的 `SESSION_LOGIN_INFO`

### 入口流程
```
main.jsx → SSOProvider → RouterProvider
  ├── Route "/" → UserEntry (Platform 端)
  │   ├── 基础路由 (/home, /agent, /voice ...)
  │   ├── 知识工程路由
  │   ├── 数据管理路由
  │   └── 公共资源路由
  └── Route "/admin" → Entry (Admin 端)
      └── Admin 管理路由
```

---

## 3. Admin 端功能清单

Admin 端通过 `/admin/*` 路由访问，使用 `Entry` 组件作为布局容器，包含侧边栏菜单导航。

### 3.1 空间管理 (Bot/Space Management)

**功能描述**: 管理 AI 空间（Bot），包括创建、编辑、上下线、删除。

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/addBotList` | `AddBotList` | 空间列表 (默认页) |
| `/admin/addBot` | `AddRot` | 创建空间 |
| `/admin/addBot/:botNo` | `AddRot` | 编辑空间 |

**源码文件**:
```
pages/addBotList/
├── index.jsx                      # 空间列表主页面
└── components/
    └── StatusSwitch.jsx           # 状态切换组件

pages/addBot/
├── index.jsx                      # 空间创建/编辑主页面 (Tab 式)
└── components/
    ├── PersonalInfo/              # 基本信息 Tab
    ├── SkillList/                 # 工作流 Tab
    ├── ImageTextKnowledge/        # 图文知识 Tab
    ├── AgentList/                 # Agent Tab
    └── KnowledgeBaseWrapper/      # 知识库 Tab

api/bot/
├── api.jsx                        # API 端点定义
└── index.jsx                      # React Query hooks
```

**影响面**:
- API: `@/api/bot` (fetchBotList, saveBot, updateBot, deleteBot, fetchBotInfo 等)
- 依赖组件: `QuillEditor`, `DeleteModal`, `OverflowTooltip`
- Store: `useAuthResources` (权限检查)
- 被依赖: `basicSettings`, `knowledgeManage`, `botConstants`, `homeEntry` 等多个模块引用 bot API

---

### 3.2 权限管理 (Permission Management)

**功能描述**: 用户、角色、标签（分组）、菜单资源的完整 RBAC 管理。

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/user-management` | `UserManageMent` | 用户管理 |
| `/admin/role-management` | `RoleManageMent` | 角色管理 |
| `/admin/group-management` | `GroupManageMent` | 标签管理 |
| `/admin/menu-auth-management` | `MenuAuthManagement` | 菜单权限管理 |

**源码文件**:
```
pages/permission/
├── UserManageMent.jsx             # 用户管理页面
├── RoleManageMent.jsx             # 角色管理页面
├── GroupManageMent.jsx            # 标签/分组管理页面
├── MenuAuthManagement.jsx         # 菜单权限管理页面
├── SkillTemplateManageMent.jsx    # 工作流模板管理页面
└── components/
    ├── UserFormModal.jsx          # 用户表单弹窗
    ├── RoleFormModal.jsx          # 角色表单弹窗
    └── StatusSwitch.jsx           # 状态切换

api/permission/
├── api.jsx                        # API 端点
└── index.jsx                      # React Query hooks
```

**影响面**:
- API: `@/api/permission` (全部权限 CRUD 接口)
- 全局影响: `useAuthResources` / `useMenuResourcesCodes` 被 **所有需要鉴权的页面** 引用
- 侧边栏菜单渲染依赖权限数据

---

### 3.3 模型管理 (Model Management)

**功能描述**: LLM 模型配置、模型系列管理、模型对比。

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/model-management` | `ModelManage` | 模型管理列表 |
| `/admin/model-series/:id` | `ModelSeriesDetail` | 模型系列详情 |
| `/admin/model-series/compare` | `ModelSeriesCompare` | 模型对比 |

**源码文件**:
```
pages/modelManage/
├── index.jsx                      # 模型管理主页面
├── AddEditModel.jsx               # 新增/编辑模型弹窗
└── SwitchDeleteModel.jsx          # 状态切换/删除

pages/modelSeries/
├── detail.jsx                     # 模型系列详情
├── compare.jsx                    # 模型对比
└── constants.js                   # 常量

api/modelManage/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/modelManage` (fetchModelList, saveModel, changeStatus 等)
- 被依赖: 工作流编辑器中模型选择、Agent 配置中模型引用

---

### 3.4 数据统计 (Data Statistics)

**功能描述**: 调用日志、安全告警、用户反馈、日常报表。

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/call-logs` | `CallLogs` | 调用日志 |
| `/admin/security-alarm` | `SecurityAlarm` | 安全告警 |
| `/admin/user-feedback` | `UserFeedback` | 用户反馈 |
| `/admin/daily-report` | `DailyReport` | 日常报表 |

**源码文件**:
```
pages/dataStatistic/
├── callLogs/
│   ├── index.jsx                  # 调用日志列表
│   ├── schema.jsx                 # 表格列定义
│   ├── request.js                 # API 请求
│   ├── detailDrawer.tsx           # 详情抽屉
│   └── LogDetailDrawer/
│       ├── CallChain.jsx          # 调用链路可视化
│       ├── LogDetail.jsx          # 日志详情
│       ├── HistoryRecords.jsx     # 历史记录
│       ├── ExecuteProcess.jsx     # 执行流程
│       ├── TimeLine.jsx           # 时间线
│       └── OptimizeOrder.jsx      # 优化工单
│
├── securityAlarm/
│   ├── index.jsx                  # 安全告警列表
│   ├── schema.jsx
│   ├── request.js
│   └── detailDrawer.tsx
│
├── userFeedback/
│   ├── index.jsx                  # 用户反馈列表
│   ├── schema.jsx
│   ├── request.js
│   └── detailDrawer.tsx
│
├── dailyReport/
│   ├── index.jsx                  # 日常报表主页
│   ├── CallDashboard.jsx          # 调用统计面板
│   ├── IframeDashboard/           # iframe 嵌入报表
│   ├── OptimizationDashboard/     # 优化指标面板
│   └── ChartsComponents/
│       ├── CallTrend.jsx          # 调用趋势图
│       ├── ProportionCircular.jsx # 饼图
│       ├── CommonColumn.jsx       # 柱状图
│       ├── NumberPanel.jsx        # 数据面板
│       ├── ModelBillingChart.jsx  # 模型计费图
│       └── ModelCostBarChart.jsx  # 模型成本图
│
├── optimizeOrder/                 # 优化工单
├── voiceRecord/                   # 语音记录
│   ├── index.jsx
│   ├── schema.jsx
│   ├── request.js
│   └── voiceRecordDetail/
│       ├── index.jsx
│       ├── BaseInfo/
│       ├── ChatHistory/
│       └── Player/                # 音频播放器
└── voiceRecordDetail/

api/userFeedback/                  # 用户反馈 & 调用日志 API
api/dailyReport/                   # 报表 API
api/voiceRecord/                   # 语音记录 API
```

**影响面**:
- API: `@/api/userFeedback`, `@/api/dailyReport`, `@/api/voiceRecord`
- 共享组件: `TableRender`, 日期选择器, 筛选器
- 调用日志同时出现在 Admin 和 Platform 端 (路由 `/call-logs` 和 `/admin/call-logs`)

---

### 3.5 消息/新闻管理 (Info Center / News)

**功能描述**: 消息类型和消息内容的 CRUD 管理。

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/news-catalog` | `InfoType` | 消息类型管理 |
| `/admin/news-list` | `InfoDetail` | 消息列表管理 |
| `/admin/infocenter/detail/:botNo` | `InfoView` | 消息详情查看 |
| `/admin/infocenter/createnews` | `InfoEdit` | 创建消息 |
| `/admin/infocenter/edit/:botNo` | `InfoEdit` | 编辑消息 |

**源码文件**:
```
pages/infocenter/
├── index.jsx                      # 组件导出入口
├── InfoType/                      # 消息类型管理
├── InfoDetail/                    # 消息列表
├── InfoEdit/                      # 消息编辑
│   └── hooks/useInfoEdit.ts
├── InfoView/                      # 消息详情
├── AddTypeModal.jsx               # 类型新增弹窗
├── TextEditor/                    # 富文本编辑器
├── ImageUpload.jsx                # 图片上传
├── RichTextEditor.jsx             # 富文本编辑器
├── api/index.js                   # API 接口
├── hooks/
│   ├── useInfoTypeTable.js
│   └── useInfoDetail.ts
└── mock/                          # 模拟数据
```

**影响面**:
- API: 内部定义 (`pages/infocenter/api/index.js`)
- 独立性较高，与其他模块耦合低
- Platform 端也存在新闻展示功能 (apps/platform)

---

### 3.6 工作流模板管理 (Skill Template Management)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/skill-template-management` | `SkillTemplateManageMent` | 工作流模板 |

**源码文件**:
```
pages/permission/SkillTemplateManageMent.jsx
```

---

### 3.7 工作台管理 (Workbench Management)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/workbenchManageMemu` | `Workbench` | 工作台管理 |

**源码文件**:
```
pages/workbench/
└── index.jsx

api/workBench/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/workBench` (fetchAllWorkbenches, bindBotToWorkbench)

---

### 3.8 可用性治理 (Available Limit / Governance)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/available-limit` | `AvailableLimit` | 可用性治理 |

**源码文件**:
```
pages/availableLimit/
├── index.jsx
└── components/
    └── FormModal.jsx

api/availableLimit/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/availableLimit`, `@/api/permission`
- 涉及空间级别的流量控制和限流配置

---

### 3.9 AI Lab 管理

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/ai-lab` | `AiLabManage` | AI Lab 应用管理 |

**源码文件**:
```
pages/aiLabManage/
├── index.jsx
└── components/
    ├── StatusSwitch.jsx
    └── ApplicationFormModal.jsx

api/application/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/application` (CRUD 应用)
- Platform 端也有 `/ai-lab` 路由，共享同一页面组件

---

### 3.10 技术雷达 (Technical Radar)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/technical-radar` | `TechnicalRadar` | 技术雷达 |

**源码文件**:
```
pages/technicalRadar/
├── index.jsx
└── config.jsx

api/technicalRadar/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/technicalRadar`
- Platform 端也有 `/technical-radar` 路由，共享同一组件
- 另有 `/technical-radar-static` 使用 `transfer-static` 迁移组件

---

### 3.11 调试页面 (Debug)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/debug` | `Debug` | Prompt 调试 |

**源码文件**:
```
pages/debug/
└── index.jsx

api/prompt/
├── api.jsx
└── index.jsx
```

---

### 3.12 Bot 常量配置

| 路由 | 组件 | 说明 |
|---|---|---|
| `/admin/botConstants` | `BotConstants` | Bot 常量配置 |

**源码文件**:
```
pages/botConstants/
├── index.jsx
└── components/
    └── ConstantsForm.jsx

api/botConstants/
├── api.jsx
└── index.jsx
```

---

## 4. Platform 端功能清单

Platform 端通过 `/` 基础路由访问，使用 `UserEntry` + `MainLayout` 布局，面向普通用户。

### 4.1 首页 (Home)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/home` | `HomeEntry` | 空间首页 |

**源码文件**:
```
pages/homeEntry/
├── index.tsx                      # 首页主组件
├── Icon.jsx                       # 图标组件
├── SpaceCardV2.jsx                # 空间卡片
└── hooks.js                       # useSpacesQuery 等
```

**影响面**:
- 自定义 Hooks: `useSpacesQuery`, `useSpacesExtendInfoQuery`, `useSpaceTopUpMutation`
- 虚拟滚动网格、搜索、置顶功能

---

### 4.2 QA 对话

| 路由 | 组件 | 说明 |
|---|---|---|
| `/qa` | `QaEntry` | QA 对话页 |

**源码文件**:
```
pages/qa/
└── index.tsx
```

---

### 4.3 Agent 管理

| 路由 | 组件 | 说明 |
|---|---|---|
| `/agent` | `AgentView` | Agent 列表 |
| `/agent/detail` | `AgentDetail` | Agent 详情 (v1) |
| `/agent/detailv2` | `AgentDetailV2` | Agent 详情 (v2) |
| `/agent/workbench` | `AgentWorkbench` | Agent 工作台 |

**源码文件**:
```
pages/agent/
├── index.jsx                      # Agent 列表
├── detail.jsx                     # Agent 详情 v1
└── detailv2.jsx                   # Agent 详情 v2

pages/agentWorkbench/
├── index.jsx                      # Agent 工作台主页
└── components/
    ├── Header/
    └── MainArea/

api/agent/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/agent` (fetchAgentListByPage, createAgent, releaseAgent 等)
- 依赖 `addBot/components/Agent` 组件
- 被 `batchTesting` 引用 (Agent 测试集)

---

### 4.4 工作流/技能管理 (Skill/Workflow)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/skillList` | `SkillList` | 工作流列表 |
| `/editSkill` | `SkillEdit` | 工作流编辑器 |

**源码文件**:
```
pages/skillList/
└── index.jsx                      # 工作流列表 (引用 addBot 组件)

pages/skillEdit/
└── index.jsx                      # Xflow 可视化编辑器入口

pages/xflow/
├── index.jsx                      # Xflow 主组件
├── config-cmd.jsx                 # 命令配置
├── config-keybinding.jsx          # 快捷键配置
├── config-menu.jsx                # 菜单配置
├── config-toolbar.jsx             # 工具栏配置
└── custom-nodes.jsx               # 自定义节点

api/skill/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/skill` (完整工作流 CRUD、调试、导出)
- Xflow 编辑器是核心可视化编辑组件
- 被 `batchTesting`, `agent`, `voice` 等模块引用

---

### 4.5 批量测试 (Batch Testing)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/batch-testing` | `BatchTesting` | 批量测试 |

**源码文件**:
```
pages/batchTesting/
├── index.jsx
└── components/
    └── BatchTestDrawer/

api/batchTest/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/batchTest` (testSet CRUD, debug, continue, cancel)

---

### 4.6 插件/工具管理 (Plugin & Tool)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/plugins-management` | `PluginsManagement` | 工具管理 |
| `/plugins-detail` | `PluginsDetail` | 工具详情 |
| `/plugin/:pluginNo` | `PluginToolList` | 工具列表 |
| `/plugin/tools` | `CreatePluginTools` | 创建工具 |

**源码文件**:
```
pages/pluginToolList/
└── index.jsx

pages/createPluginTools/
├── index.jsx
├── constants.jsx
└── components/
    ├── BasicInfo/
    ├── InputParams/
    ├── OutputParams/
    └── ValidateAndDebug/

pages/promptEngineering/           # 插件 Prompt 管理

api/pluginManage/
├── api.jsx
└── index.jsx

api/pluginTool/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/pluginManage`, `@/api/pluginTool`
- 多步向导式创建流程

---

### 4.7 市场/订阅 (Marketplace)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/market` | `Market` | 应用市场 |
| `/market-sub` | `MarketSub` | 市场子页面 |
| `/model-market` | `ModelMarket` | 模型市场 (v2) |
| `/voice-market` | `VoiceMarket` | 语音市场 (v2) |
| `/markets/:type` | `Markets` | 通用市场 (Agent/Workflow/Tool) |

**源码文件**:
```
pages/market/
└── index.jsx

pages/market-sub/
└── index.jsx

pages-v2/publicResources/
├── modelMarket/
│   └── index.jsx                  # 模型市场 (无限滚动)
├── voiceMarket/
│   └── index.jsx                  # 语音市场 (音频试听)
└── markets/
    └── index.jsx                  # 通用市场

api/market/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/market` (fetchMarketHome, subscribe, cancelSubscribe)
- 订阅/取消订阅机制影响 `robots` 模块
- `voiceMarket` 涉及音频播放和跨 iframe 通信

---

### 4.8 语音 Agent (Voice Agent)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/voice` | `Voice` | 语音 Agent 首页 |
| `/voice/script` | `Script` | 语音脚本 |
| `/voice/timbre` | `Timbre` | 音色管理 |
| `/voice/event` | `Event` | 语音事件 |
| `/voice/canvas` | `Canvas` | 语音画布 |
| `/voice/scriptManage` | `ScriptManage` | 脚本管理 |

**源码文件**:
```
pages/voice/
├── index.jsx
├── canvas.jsx
├── event.jsx
├── script.jsx
├── scriptManage.jsx
└── timbre.jsx

api/voiceAgent/
├── api.jsx
└── index.jsx

api/timbre/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/voiceAgent`, `@/api/timbre`
- 涉及 NLU 流程配置、脚本管理、音色配置

---

### 4.9 知识库管理 (Knowledge Management)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/knowledgeManage` | `KnowledgeManage` | 知识库管理 |
| `/knowledge/source/tag` | `KnowledgeSourceTag` | 知识源标签 |

**源码文件**:
```
pages/knowledgeManage/
└── index.jsx                      # 引用 addBot 知识库组件

pages/knowledgeSourceTag/
└── index.jsx

api/knowledge/
├── api.jsx
└── index.jsx

api/knowledgeDocument/
├── api.jsx
└── index.jsx

api/structureKnowledge/
├── api.jsx
└── index.jsx

api/sourceTag/
├── api.jsx
└── index.jsx
```

**影响面**:
- API: `@/api/knowledge`, `@/api/knowledgeDocument`, `@/api/structureKnowledge`
- 核心数据管理模块，被空间编辑、Agent、工作流等多模块引用

---

### 4.10 知识工程 (Knowledge Engineering)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/knowledgeExtractor` | `KnowledgeExtractor` | 知识抽取器 |
| `/instanceExtractor` | `InstanceExtractor` | 实例抽取器 |
| `/instanceExtractorDetail` | `InstanceExtractorDetail` | 实例抽取详情 |
| `/taskExtractor` | `TaskExtractor` | 任务抽取器 |
| `/addTaskExtractor` | `TaskExtractorAdd` | 新增任务抽取 |
| `/InstanceBatchExtractorDetail` | `InstanceBatchExtractorDetail` | 批量抽取详情 |
| `/knowledgeExtraction` | `KnowledgeExtraction` | 知识抽取 2.0 |
| `/knowledgeExtractionAdd` | `KnowledgeExtractionAdd` | 新增知识抽取 |

**源码文件**:
```
pages/knowledgeProject/
├── index.jsx                      # 导出入口
├── knowledgeExtractor/
│   ├── KnowledgeExtractor.jsx
│   ├── InstanceExtractor.jsx
│   ├── InstanceExtractorDetail.jsx
│   ├── TaskExtractor.jsx
│   ├── TaskExtractorAdd.jsx
│   ├── InstanceBatchExtractorDetail.jsx
│   ├── ExtractorProvider.jsx      # Context Provider
│   └── components/                # 卡片、聊天、抽屉等
│
├── knowledgeManage/               # 知识模板管理
│   ├── basicSetup/                # 基础设置
│   ├── extractionType/            # 抽取类型
│   ├── operationLog/              # 操作日志
│   ├── talkManagement/            # 对话管理
│   ├── templateManage/            # 模板管理
│   ├── templateDetail/            # 模板详情
│   ├── versionCompare/            # 版本对比
│   ├── versionDetail/             # 版本详情
│   └── versionRecord/             # 版本记录
│
└── dataManagement/                # 数据管理
    ├── dataField/                 # 数据字段
    ├── dataOrigin/                # 数据源
    └── dataSelection/             # 数据选择

api/knowledgeExtraction/
api/knowledgeExtractor/
api/knowledgeManage/
api/dataManagement/
api/talkManagement/
api/InstanceBatchExtractorDetail/
```

**影响面**:
- API: 6 个 API 模块
- `ExtractorProvider` Context 贯穿知识抽取流程
- 涉及金融领域数据管理接口 (`/finance/`)

---

### 4.11 知识管理子路由

| 路由 | 组件 | 说明 |
|---|---|---|
| `/talkManagement` | `TalkManagement` | 对话术管理 |
| `/templateManage` | `TemplateManage` | 模板管理 |
| `/templateDetail` | `TemplateDetail` | 模板详情 |
| `/versionRecord` | `VersionRecord` | 版本记录 |
| `/versionDetail` | `VersionDetail` | 版本详情 |
| `/operationLog` | `OperationLog` | 操作日志 |
| `/versionCompare` | `VersionCompare` | 版本对比 |
| `/basicSetup` | `BasicSetup` | 基础设置 |
| `/extractionType` | `ExtractionType` | 抽取类型 |

---

### 4.12 数据管理

| 路由 | 组件 | 说明 |
|---|---|---|
| `/dataOrigin` | `DataOrigin` | 数据源管理 |
| `/dataField` | `DataField` | 数据字段管理 |
| `/dataSelection` | `DataSelection` | 数据圈选 |

---

### 4.13 测试集管理

| 路由 | 组件 | 说明 |
|---|---|---|
| `/test/set/` | `TestSetManagement` | 测试集管理 |
| `/test/variable/` | `TestSetVariable` | 测试变量 |
| `/test/set/data/list` | `TestSetDataList` | 测试数据列表 |

**源码文件**:
```
pages/testSetManagement/
├── index.jsx
├── dataList.jsx
├── TestDataEditModal.jsx
└── variable.jsx

api/testSet/
├── api.jsx
└── index.jsx
```

---

### 4.14 Robot 管理

| 路由 | 组件 | 说明 |
|---|---|---|
| `/robots` | `Robots` | 机器人管理 |

**源码文件**:
```
pages/robots/
├── index.jsx
├── cardSettingModal.jsx
├── usingSetting.jsx
└── constants.jsx
```

**影响面**:
- API: `@/api/robots`, `@/api/market`, `@/api/skill`, `@/api/application`
- 多视图 (卡片/列表), 涉及自有/公共/订阅机器人

---

### 4.15 数据飞轮 (Data Flywheel)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/flywheel/overview` | `FlywheelOverview` | 飞轮概览 |
| `/flywheel/optimization` | `FlywheelOptimization` | 飞轮优化 |

**源码文件**:
```
pages/flywheel-overview/
├── index.tsx
├── useOverviewData.tsx
├── config.tsx
├── store.ts
└── components/
    ├── BusinessStageLoss/
    ├── LeakingTable/
    ├── DataAccumulation/
    └── SettingDrawer/

pages/flywheel-optimization/
├── index.tsx
├── useFlywheelData.tsx
├── config.tsx
├── const.js
├── FlywheelContext.tsx
└── components/
    ├── OptimizationCard/
    ├── OptimizeSuggestion/
    └── ProblemCluster/

api/flywheel/
├── api.jsx
└── index.jsx
```

---

### 4.16 调用日志 & 语音记录 & 优化工单 (Platform 端)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/call-logs` | `CallLogs` | 调用日志 |
| `/voice-record` | `VoiceRecord` | 语音记录 |
| `/optimize-order` | `OptimizeOrder` | 优化工单 |

**注意**: 这些功能与 Admin 端 `/admin/call-logs` 等共享同一页面组件。

---

### 4.17 在线学习 (Study)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/study/online` | `OnlineStudy` | 在线学习 |

**源码文件**:
```
pages/study/
├── online/
└── offline/
```

---

### 4.18 基础设置

| 路由 | 组件 | 说明 |
|---|---|---|
| `/basic/settings` | `BasicSettings` | 空间基础设置 |

**源码文件**:
```
pages/basicSettings/
└── index.jsx

# 引用 addBot 的 AvatarSelect 组件
# API: @/api/bot
```

---

### 4.19 工具页面

| 路由 | 组件 | 说明 |
|---|---|---|
| `/tools` | `ToolsList` | 工具列表 |
| `/tools/upload` | `FileUpload` | 文件上传 |
| `/markdown-preview` | `MarkdownPreview` | Markdown 预览 |
| `/diagram-preview` | `DiagramPreview` | 图表预览 |

**源码文件**:
```
pages/tools/
├── index.jsx
├── markdownPreview/
├── file/
└── diagramPreview/
```

---

### 4.20 迁移静态页面 (Transfer Static)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/transfer/user` | `TransferUserList` | 用户列表 (旧) |
| `/transfer/user/detail` | `TransferUserDetail` | 用户详情 (旧) |
| `/transfer/role` | `TransferUserRole` | 角色管理 (旧) |
| `/technical-radar-static` | `TechnicalRadarStatic` | 静态技术雷达 |

**源码文件**:
```
transfer-static/
├── components/
├── constants/
├── hooks/
├── services/
├── user-admin/
│   ├── user-list/
│   └── role-admin/
├── technical-radar/
└── utils/
```

---

### 4.21 版本管理 (Studio 模式)

| 路由 | 组件 | 说明 |
|---|---|---|
| `/versionRelease` | `VersionRelease` | 版本发布 |
| `/versionRelease/detail/:publishOrderId` | `VersionReleaseDetail` | 版本发布详情 |

**条件加载**: 仅在 Studio 模式下显示。

**源码文件**:
```
pages/versionManage/
└── versionReleaseDetail/

api/versionRelease/
├── api.jsx
└── index.jsx
```

---

### 4.22 Chat 功能

| 路由 | 组件 | 说明 |
|---|---|---|
| `/chat` | `ChatProvider` | 聊天 (iframe) |

**源码文件**:
```
packages/Chat/                     # Chat 组件包
```

---

## 5. 共享模块 (跨端复用)

以下模块/组件同时被 Admin 端和 Platform 端引用:

### 5.1 共享页面组件

| 组件 | Admin 路由 | Platform 路由 | 说明 |
|---|---|---|---|
| `CallLogs` | `/admin/call-logs` | `/call-logs` | 调用日志 |
| `TechnicalRadar` | `/admin/technical-radar` | `/technical-radar` | 技术雷达 |
| `AiLabManage` | `/admin/ai-lab` | `/ai-lab` | AI Lab |
| `BotConstants` | `/admin/botConstants` | `/app/bot/constants` | Bot 常量 |

### 5.2 共享 API 模块

| API 模块 | 路径 | 被引用端 |
|---|---|---|
| `@/api/bot` | `api/bot/` | Admin + Platform |
| `@/api/skill` | `api/skill/` | Admin + Platform |
| `@/api/agent` | `api/agent/` | Admin + Platform |
| `@/api/permission` | `api/permission/` | Admin + Platform (鉴权) |
| `@/api/common` | `api/common/` | Admin + Platform |

### 5.3 共享 UI 组件

| 组件 | 路径 | 说明 |
|---|---|---|
| `Header` | `components/header/` | 头部导航 |
| `SidebarMenu` | `components/sidebarMenu/` | 侧边栏 (Admin 专用) |
| `DeleteModal` | `components/DeleteModal/` | 删除确认弹窗 |
| `StatusSwitch` | (多处定义) | 状态切换 |
| `FormModal` | (多处定义) | 表单弹窗 |
| `TableRender` | `components/TableRender/` | 通用表格渲染 |
| `OverflowTooltip` | `components/OverflowTooltip/` | 文本溢出提示 |
| `QuillEditor` | `components/QuillEditor/` | 富文本编辑器 |
| `GlobalLoadingIndicator` | `components/` | 全局加载指示器 |
| `ErrorBoundary` | `pages/errorBoundary/` | 错误边界 |

### 5.4 共享 Store / Hooks

| 模块 | 路径 | 说明 |
|---|---|---|
| `useAuthResources` | `store/` | 权限资源 |
| `useMenuResourcesCodes` | `store/` | 菜单权限码 |
| `useCollapsed` | `store/` | 侧边栏折叠 |
| `usePreviousLocation` | `hooks/` | 前一个路由 |
| `useInitPublishData` | `hooks/` | 发布数据初始化 |

---

## 6. 功能影响面矩阵

### 6.1 Admin 端功能影响面

| 功能模块 | 页面文件数 | API 模块 | 共享组件数 | 跨端复用 | 耦合度 |
|---|---|---|---|---|---|
| 空间管理 | 15+ | bot | 5+ | 是 | **高** |
| 权限管理 | 6 | permission | 3 | 是 (鉴权) | **高** |
| 模型管理 | 4 | modelManage | 2 | 否 | 中 |
| 数据统计 | 25+ | userFeedback, dailyReport, voiceRecord | 10+ | 部分 | **高** |
| 消息管理 | 10+ | 内部 API | 3 | 否 | **低** |
| 工作流模板 | 1 | permission | 0 | 否 | 低 |
| 工作台管理 | 1 | workBench | 0 | 否 | 低 |
| 可用性治理 | 2 | availableLimit | 1 | 否 | 低 |
| AI Lab | 3 | application | 2 | 是 | 中 |
| 技术雷达 | 2 | technicalRadar | 0 | 是 | 低 |
| 调试页面 | 1 | prompt | 0 | 否 | 低 |
| Bot 常量 | 2 | botConstants, bot, agent | 1 | 是 | 中 |

### 6.2 Platform 端功能影响面

| 功能模块 | 页面文件数 | API 模块 | 共享组件数 | 跨端复用 | 耦合度 |
|---|---|---|---|---|---|
| 首页 | 4 | (custom hooks) | 2 | 否 | 低 |
| Agent 管理 | 5+ | agent | 3+ | 否 | 中 |
| 工作流管理 | 10+ | skill | 5+ | 否 | **高** |
| 插件工具 | 8+ | pluginManage, pluginTool | 5+ | 否 | 中 |
| 市场/订阅 | 8+ | market | 5+ | 否 | 中 |
| 语音 Agent | 8+ | voiceAgent, timbre | 3+ | 否 | 中 |
| 知识库管理 | 5+ | knowledge 系列 (5 个) | 3+ | 否 | **高** |
| 知识工程 | 20+ | 6 个 API 模块 | 10+ | 否 | **高** |
| 数据飞轮 | 10+ | flywheel | 5+ | 否 | 中 |
| 测试集管理 | 4 | testSet, batchTest | 2 | 否 | 中 |
| Robot 管理 | 4 | robots, market, skill, application | 3 | 否 | **高** |
| 批量测试 | 3 | batchTest | 2 | 否 | 中 |

---

## 7. 拆分建议

### 7.1 可独立拆分 (耦合度低)

以下 Admin 功能与 Platform 端耦合极低，可优先拆分:

1. **消息管理** (infocenter) - API 自包含，无跨端依赖
2. **模型管理** (modelManage) - 独立 API 模块
3. **工作台管理** (workbench) - 单文件，独立 API
4. **可用性治理** (availableLimit) - 独立功能
5. **调试页面** (debug) - 单文件
6. **工作流模板** (SkillTemplateManageMent) - 单文件

### 7.2 需要共享方案 (跨端复用)

以下功能同时在两端出现，拆分时需设计共享策略:

1. **调用日志** - 同一组件，不同路由
2. **技术雷达** - 同一组件
3. **AI Lab** - 同一组件
4. **Bot 常量** - 同一组件
5. **权限 API / Hook** - 全局鉴权依赖

### 7.3 拆分难度高

以下模块因依赖链复杂，拆分需谨慎:

1. **空间管理** (addBot/addBotList) - 被多个模块依赖其子组件
2. **权限管理** - 全局影响
3. **数据统计** - 组件间交叉引用多
4. **知识工程** - 模块庞大，内部耦合高

---

## 附录: 文件路径快速索引

### 路由配置
```
src/router/index.jsx                           # 主路由
src/router/robotRoutes.jsx                     # Robot 路由
src/router/routers/knowledgeProject.jsx        # 知识工程路由
src/router/routers/knowledgeManagement.jsx     # 知识管理路由
src/router/routers/dataManagement.jsx          # 数据管理路由
src/router/routers/publicResources.jsx         # 公共资源路由
src/router/routers/versionManagement.jsx       # 版本管理路由
```

### 入口文件
```
src/main.jsx                                   # 应用入口
src/pages/entry/index.jsx                      # Admin 端入口布局
src/components/UserEntry.jsx                   # Platform 端入口
```

### 侧边栏菜单
```
src/components/sidebarMenu/index.jsx           # 侧边栏渲染
src/components/sidebarMenu/menuData.jsx        # 菜单数据定义
```

### 权限与常量
```
src/constants/resourceCode.jsx                 # 资源码定义
src/constants/permission.jsx                   # 权限类型
src/constants/pageCode.jsx                     # 页面码
src/constants/index.jsx                        # 主常量导出
```
