# za-aigc-platform-admin-static 重构设计方案

> 日期：2026-03-10
> 状态：已定稿
> 范围：基础设施 + News 模块迁移

---

## 1. 项目背景

将 `za-aigc-platform-admin-static` 项目逐步重构迁移到 `ai_monorepo` monorepo 架构中。

- **源项目**：41 个页面模块、78+ 共享组件、47+ API 域，React 18 + Ant Design 5 + Vite 4
- **目标项目**：Turborepo monorepo，apps/admin + apps/platform + packages/ui + packages/utils

## 2. 本次范围

仅包含两部分：

1. **基础设施搭建** — 为 monorepo 建立可复用的开发基础
2. **News（infocenter）模块迁移** — 作为第一个业务模块验证迁移流程

### News 模块功能分配

| App | 功能 | 对应原组件 |
|-----|------|-----------|
| **admin** | 新闻发布/编辑/管理 | InfoDetail（列表管理）、InfoEdit（创建/编辑）、InfoType（分类管理） |
| **platform** | 新闻列表/查看 | InfoView（详情查看）+ 列表页 |

### News 模块原文件清单

```
src/pages/infocenter/
├── index.jsx                              → 主入口
├── api/index.js                           → 4 个 API 模块
├── components/
│   ├── InfoDetail/index.jsx               → admin: 新闻列表管理
│   ├── InfoDetail/useInfoDetail.ts        → admin: 列表业务逻辑 hook
│   ├── InfoEdit/index.jsx                 → admin: 新闻创建/编辑表单
│   ├── InfoEdit/useInfoEdit.ts            → admin: 编辑业务逻辑 hook
│   ├── InfoType/index.jsx                 → admin: 分类管理
│   ├── InfoType/useInfoTypeTable.js       → admin: 分类表格逻辑 hook
│   ├── InfoView/index.jsx                 → platform: 新闻详情查看
│   ├── TextEditor/index.tsx               → 共享: 富文本编辑器(WangEditor)
│   ├── RichTextEditor.jsx                 → 共享: 备用富文本编辑器
│   └── ImageUpload.jsx                    → 共享: 图片上传组件
├── mock/
│   ├── index.js                           → Mock 路由注册
│   ├── info.js                            → 新闻 Mock 数据
│   └── infoType.js                        → 分类 Mock 数据
└── index.less                             → 样式文件
```

### 外部依赖

- 路由：`/news-catalog`, `/news-list`, `/infocenter/detail/:botNo`, `/infocenter/createnews`, `/infocenter/edit/:botNo`
- 常量：`src/constants/index.jsx` 中的新闻相关常量
- API 基础层：`src/api/server.jsx`（axios 拦截器、SSO 头注入）
- 通用文件上传 API：`src/api/common/`

---

## 3. 团队结构

| 角色 | 名称 | Provider | 核心职责 |
|------|------|----------|----------|
| **策划 Lead** | `lead` | Claude | 模块影响分析、实施方案审批、进度跟踪、不写代码、不制定实施方案 |
| **开发 A** | `dev-admin` | Codex | admin app 模块迁移、基础设施搭建、制定自身负责模块的实施方案 |
| **开发 B** | `dev-platform` | Codex | platform app 模块迁移、公共组件/工具抽取到 packages/、制定自身负责模块的实施方案 |
| **测试 QA** | `qa` | Claude | UI/UE 一致性对比、交互逻辑验证、浏览器内回归测试 |

### 角色约束

**策划 Lead：**
- 不参与代码开发，不制定实施方案
- 每次迁移前：分析原项目模块依赖 → 评估目标项目影响范围
- 审批开发角色提交的实施方案（通过后方可开发）
- 追踪 `doc/task/task.md` 中的任务进度
- 协调开发 A/B 之间的依赖和冲突

**开发 A/B：**
- 每次开发前：分析影响范围（GitNexus impact analysis）→ 制定实施方案 → 提交 Lead 审批
- 实施方案必须由开发角色自行生成，包含：改动范围、文件清单、技术方案、依赖关系
- Lead 审批通过后方可进入编码阶段
- 保留现有页面设计与交互逻辑，UI 严格基于原项目
- 保留现有接口调用和数据结构不变
- 提供 Mock 接口用于本地开发
- 公共组件和工具由 dev-platform（开发 B）统一抽取到 packages/

**测试 QA：**
- 浏览器内对比原项目和重构项目
- 确保 UI/UE 一致
- 验证交互业务逻辑正确运行

---

## 4. 迁移策略

**方案：A+B 混合（严格流程 + 可并行开发）**

- 严格按 分析 → 审批 → 开发 → 测试 流程
- 无依赖模块可由开发 A/B 并行迁移
- 公共组件由开发 B 统一抽取

### 标准迁移流程

```
策划 Lead          开发 A/B              测试 QA
──────────         ──────────            ──────────
1. 分析原项目模块依赖
2. 评估 ai_monorepo 影响范围
3. 分配任务、更新 task.md
                   4. 分析影响范围（GitNexus）
                   5. 制定实施方案（文件清单+技术方案+依赖）
                   6. 提交实施方案给 Lead 审批
7. 审批实施方案
   ├─ 通过 → 开发继续
   └─ 驳回 → 返回步骤 5 修改
                   8. 按方案实现代码迁移
                   9. 提供 Mock 接口
                   10. 自测通过
                                         11. 浏览器内 UI/UE 对比
                                         12. 交互逻辑验证
                                         13. 输出测试报告
策划 Lead 确认     修复问题（如有）       回归验证
更新进度 ✅
```

### 检查点

| 检查点 | 负责人 | 内容 |
|--------|--------|------|
| **任务分配** | 策划 Lead | 原项目依赖分析 + ai_monorepo 影响评估 + 分配任务 |
| **方案制定** | 开发 A/B | 分析影响范围 + 制定实施方案（文件清单、技术方案、依赖关系） |
| **方案审批** | 策划 Lead | 审批开发提交的实施方案，通过后方可编码 |
| **开发中** | 开发 A/B | 按审批通过的方案编码 + GitNexus impact analysis 确认改动范围 |
| **开发后** | 开发 A/B | 代码 Review + git diff 范围确认 |
| **测试前** | QA | 原项目浏览器截图/录屏作为基准 |
| **测试中** | QA | 逐页面对比 UI/UE + 交互流程验证 |
| **完成后** | 策划 Lead | 更新 task.md 状态 |

---

## 5. 迁移排期

| Phase | 内容 | 开发 A | 开发 B |
|-------|------|--------|--------|
| **0** | 基础设施 | 路由/antd/API层/Provider/样式 | Mock系统/布局组件/packages扩展 |
| **1a** | News-Admin | InfoDetail + InfoEdit + InfoType | 公共组件抽取（TextEditor/ImageUpload） |
| **1b** | News-Platform | — | NewsList + NewsView |

---

## 6. 基础设施（Phase 0）

| 基础设施 | 说明 | 负责 |
|----------|------|------|
| React Router 6 | 两个 app 配置 hash 路由 | 开发 A |
| Ant Design 5 | antd 5.23.1 + 中文语言包 + 自定义主题 token | 开发 A |
| Axios + API 层 | 基于原项目 server.jsx 搭建请求拦截器 | 开发 A |
| Mock 系统 | 基于 MockJS 搭建本地 mock 服务 | 开发 B |
| 全局 Provider | ConfigProvider + QueryClientProvider + 路由 Provider | 开发 A |
| 主布局组件 | MainLayout + Sidebar + Header | 开发 B |
| packages/ui 扩展 | TextEditor、ImageUpload 共享组件 | 开发 B |
| packages/utils 扩展 | 通用工具函数迁移 | 开发 B |
| 样式基础 | Tailwind + SCSS 配置、antd 主题覆盖 | 开发 A |
| SCSS/Less 支持 | Vite 配置 SCSS/Less loader | 开发 A |

### 新增依赖

```
# UI 框架
antd@^5.23.1
@ant-design/icons@^5.5.1

# 路由
react-router-dom@^6.11.2

# 数据层
axios@^1.4.0
@tanstack/react-query@^4.29.25

# 工具
dayjs@^1.11.10
lodash@^4.17.21

# 富文本（admin 专用）
@wangeditor/editor@^5.1.23
@wangeditor/editor-for-react@^1.0.6

# Mock
mockjs@^1.1.0

# 样式
sass@^1.62.1
```

---

## 7. 目录结构

```
ai_monorepo/
├── apps/
│   ├── admin/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── router/
│   │   │   │   ├── index.tsx
│   │   │   │   └── newsRoutes.tsx
│   │   │   ├── layouts/
│   │   │   │   └── MainLayout/
│   │   │   │       ├── index.tsx
│   │   │   │       ├── hooks/useMainLayout.ts
│   │   │   │       └── types.ts
│   │   │   ├── pages/
│   │   │   │   └── news/
│   │   │   │       ├── NewsDetail/
│   │   │   │       │   ├── index.tsx
│   │   │   │       │   ├── hooks/useNewsDetail.ts
│   │   │   │       │   ├── stories/NewsDetail.stories.tsx
│   │   │   │       │   ├── __tests__/NewsDetail.test.tsx
│   │   │   │       │   └── types.ts
│   │   │   │       ├── NewsEdit/
│   │   │   │       │   ├── index.tsx
│   │   │   │       │   ├── hooks/useNewsEdit.ts
│   │   │   │       │   ├── stories/NewsEdit.stories.tsx
│   │   │   │       │   ├── __tests__/NewsEdit.test.tsx
│   │   │   │       │   └── types.ts
│   │   │   │       ├── NewsType/
│   │   │   │       │   ├── index.tsx
│   │   │   │       │   ├── hooks/useNewsTypeTable.ts
│   │   │   │       │   ├── stories/NewsType.stories.tsx
│   │   │   │       │   ├── __tests__/NewsType.test.tsx
│   │   │   │       │   └── types.ts
│   │   │   │       └── index.ts
│   │   │   ├── api/
│   │   │   │   ├── server.ts
│   │   │   │   └── news.ts
│   │   │   ├── mock/
│   │   │   │   ├── setup.ts
│   │   │   │   ├── news.ts
│   │   │   │   └── newsType.ts
│   │   │   ├── constants/
│   │   │   │   └── index.ts
│   │   │   └── styles/
│   │   │       ├── index.scss
│   │   │       └── antd-theme.ts
│   │   └── package.json
│   │
│   └── platform/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── router/
│       │   │   ├── index.tsx
│       │   │   └── newsRoutes.tsx
│       │   ├── layouts/
│       │   │   └── MainLayout/
│       │   │       ├── index.tsx
│       │   │       ├── hooks/useMainLayout.ts
│       │   │       └── types.ts
│       │   ├── pages/
│       │   │   └── news/
│       │   │       ├── NewsList/
│       │   │       │   ├── index.tsx
│       │   │       │   ├── hooks/useNewsList.ts
│       │   │       │   ├── stories/NewsList.stories.tsx
│       │   │       │   ├── __tests__/NewsList.test.tsx
│       │   │       │   └── types.ts
│       │   │       ├── NewsView/
│       │   │       │   ├── index.tsx
│       │   │       │   ├── hooks/useNewsView.ts
│       │   │       │   ├── stories/NewsView.stories.tsx
│       │   │       │   ├── __tests__/NewsView.test.tsx
│       │   │       │   └── types.ts
│       │   │       └── index.ts
│       │   ├── api/
│       │   │   ├── server.ts
│       │   │   └── news.ts
│       │   ├── mock/
│       │   │   ├── setup.ts
│       │   │   └── news.ts
│       │   ├── constants/
│       │   │   └── index.ts
│       │   └── styles/
│       │       ├── index.scss
│       │       └── antd-theme.ts
│       └── package.json
│
├── packages/
│   ├── ui/
│   │   ├── TextEditor/
│   │   │   ├── index.tsx
│   │   │   ├── stories/TextEditor.stories.tsx
│   │   │   ├── __tests__/TextEditor.test.tsx
│   │   │   └── types.ts
│   │   ├── ImageUpload/
│   │   │   ├── index.tsx
│   │   │   ├── stories/ImageUpload.stories.tsx
│   │   │   ├── __tests__/ImageUpload.test.tsx
│   │   │   └── types.ts
│   │   ├── Button.tsx
│   │   ├── index.tsx
│   │   └── package.json
│   └── utils/
│       ├── index.ts
│       ├── store.ts
│       └── package.json
│
└── doc/task/task.md
```

---

## 8. 技术规范

### React 组件开发规范（react-component-standards）

所有组件严格遵循分层架构：

| 层 | 职责 | 禁止 |
|---|------|------|
| `index.tsx` | 渲染 UI、绑定 props、连接 handlers | 不放业务逻辑或大量 effect 链 |
| `hooks/` | 派生状态、编排逻辑、handlers、视图模型 | 不变成隐藏的全局 store |
| `store/` | 可复用的复杂交互状态（Zustand） | 不镜像服务端状态、不放简单 toggle |
| `stories/` | 默认态 + 边界态（loading/empty/disabled/error） | 不偏离真实行为 |
| `__tests__/` | 渲染、关键交互、边界态 | 不替代 Storybook |
| `types.ts` | 类型定义 | — |

### 层选择规则

- **纯 UI 组件**：`index.tsx` + story + test 即可
- **有业务逻辑**：必须添加 `hooks/`
- **共享/复杂交互状态**：添加 Zustand `store/`
- **不添加空层**：不为仪式感添加不需要的层

### Props 与命名

- 组件：`PascalCase`
- Hook：`useXxx`
- Store：`useXxxStore`
- Props 类型：`ComponentNameProps`
- 事件回调：`onXxx`
- 布尔名：`is/has/can/should`
- Props 显式、最小、语义化
- 窄联合类型优于魔术字符串

### State 所有权

- 临时视觉状态 → 本地 useState
- 业务编排 → hooks
- 可复用复杂交互状态 → Zustand store
- 服务端状态 → React Query
- 优先派生值，不重复同一真相源

### 其他技术标准

| 规范 | 标准 |
|------|------|
| TypeScript | .tsx/.ts; 基本类型注解(props/state); strict: true |
| 样式 | Tailwind 优先; SCSS 用于复杂组件; antd 主题 token 统一 |
| API | 保留原接口路径和数据结构; axios 统一管理 |
| Mock | MockJS 拦截; 数据结构与原项目一致 |
| 路由 | Hash 路由; 路径保持原项目定义 |
| 性能 | 不盲目 memo; 列表稳定 key; Zustand 窄订阅; 大列表分页/虚拟化 |
| 可访问性 | 语义化元素; 不伪装按钮; 控件须有 label |

---

## 9. 代码 Review 检查清单

每次提交前按此顺序检查：

1. **职责与边界** — 组件是否只做一件事？
2. **分层正确性** — 业务逻辑是否在 hooks/ 中？index.tsx 是否只有 UI？
3. **Props 与命名** — 类型是否窄且语义化？
4. **State 所有权** — 同一真相源是否只在一个层？
5. **Effect 安全** — 依赖完整？无混合职责？
6. **性能风险** — 大列表/仪表盘是否有重渲染问题？
7. **可访问性** — 语义元素、标签、状态处理？
8. **Storybook/测试覆盖** — 默认态 + 边界态？

### 严重问题（阻断提交）

- 业务逻辑塞在 index.tsx 中
- 同一真相在 local state / hook state / store 中重复
- Zustand store 镜像 API/服务端状态
- 全 store 订阅导致大范围重渲染
- 缺少基本可访问性语义

---

## 10. 进度跟踪

进度记录在 `doc/task/task.md`，状态标记：
- ✅ 已完成
- ⬜ 待完成
- 🔄 进行中
