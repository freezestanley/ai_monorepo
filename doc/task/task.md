# 重构任务列表

> 更新时间：2026-03-10
> 设计文档：[docs/plans/2026-03-10-refactoring-team-design.md](../../docs/plans/2026-03-10-refactoring-team-design.md)

---

## Phase 0 - 基础设施

### 开发 A (dev-admin)
- ⬜ React Router 6 配置（admin + platform hash 路由）
- ⬜ Ant Design 5 集成（antd 5.23.1 + 中文语言包 + 主题 token）
- ⬜ Axios + API 层搭建（拦截器、错误处理）
- ⬜ 全局 Provider 配置（ConfigProvider + QueryClientProvider + RouterProvider）
- ⬜ 样式基础配置（Tailwind + SCSS + antd 主题覆盖）
- ⬜ SCSS/Less Vite loader 配置

### 开发 B (dev-platform)
- ⬜ Mock 系统搭建（MockJS 拦截注册）
- ⬜ 主布局组件 MainLayout（Sidebar + Header + Content）
- ⬜ packages/ui 扩展（TextEditor、ImageUpload）
- ⬜ packages/utils 扩展（通用工具函数）

---

## Phase 1a - News 模块 Admin 端

### 开发 A (dev-admin)
- ⬜ [admin] NewsDetail 新闻列表管理页
- ⬜ [admin] NewsEdit 新闻创建/编辑页
- ⬜ [admin] NewsType 分类管理页
- ⬜ [admin] News API 定义 + Mock 数据
- ⬜ [admin] News 路由配置

### 开发 B (dev-platform) - 并行
- ⬜ [shared] TextEditor 富文本编辑器组件（packages/ui）
- ⬜ [shared] ImageUpload 图片上传组件（packages/ui）

---

## Phase 1b - News 模块 Platform 端

### 开发 B (dev-platform)
- ⬜ [platform] NewsList 新闻列表页
- ⬜ [platform] NewsView 新闻详情查看页
- ⬜ [platform] News API 定义 + Mock 数据
- ⬜ [platform] News 路由配置

---

## 测试验收

### 测试 QA (qa)
- ⬜ [admin] NewsDetail UI/UE 对比测试
- ⬜ [admin] NewsEdit UI/UE 对比测试
- ⬜ [admin] NewsType UI/UE 对比测试
- ⬜ [platform] NewsList UI/UE 对比测试
- ⬜ [platform] NewsView UI/UE 对比测试
- ⬜ 交互业务逻辑回归测试
- ⬜ 全流程集成测试通过
