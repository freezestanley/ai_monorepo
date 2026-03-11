# 模块分析: admin-news

> 状态: 冻结中。本轮未继续优化，后续计划重新迁移而不是在旧实现上持续修补。

## 模块范围

- `apps/admin/src/pages/news/NewsDetail/*`
- `apps/admin/src/pages/news/NewsEdit/*`
- `apps/admin/src/pages/news/NewsType/*`
- `apps/admin/src/api/news.ts`
- `apps/admin/src/mock/news.ts`
- `apps/admin/src/mock/newsType.ts`

## 公共出口

### 页面出口

- `NewsDetail`
- `NewsEdit`
- `NewsType`
- 路由注册在 `apps/admin/src/router/newsRoutes.tsx`

### 接口出口

- `NewsDetailAPI`
- `NewsTypeAPI`
- `NewsEditAPI`
- `NewsAPI`
- `FileAPI`

## 依赖关系

### 依赖本 app

- `@/api/news`
- `@/constants`
- `@/router`
- `@/mock`

### 依赖共享包

- `@packages/ui`

### 当前没有依赖

- `@packages/utils`

## 模块职责拆解

### 1. 新闻列表管理

- 拉取新闻列表
- 搜索、分页
- 状态切换
- 编辑、删除
- 预留了批量删除和分类 tab

### 2. 新闻编辑

- 新建/编辑共用表单
- 拉取分类列表
- 富文本编辑
- 封面上传占位

### 3. 分类管理

- 分类列表
- 新建、编辑、删除
- 搜索与分页

## 风险点

### 风险 1: 主列表逻辑过于集中

`useNewsDetail.ts` 510 行，聚合了:

- 请求参数拼装
- 表格列定义
- 操作按钮
- 发布状态切换
- 删除与批量删除
- tab 与 rowSelection 预留逻辑

问题:

- 任何一个小改动都可能影响全页面。
- 单元测试难写。
- 迁移第二个管理模块时容易继续复制这种模式。

### 风险 2: 迁移残留未清理

- `handleView` 仍导航到 `/infocenter/detail/:newsNo`
- 当前 admin 路由里并没有这个详情页
- `tabItems`、`rowSelection`、`handleBatchDelete` 已准备但页面未接入

这类残留会让后续维护者误判“功能已存在”。

### 风险 3: 编辑页上传只是 UI 壳

- 页面确实渲染了 `ImageUpload`
- 但上传组件没有真实上传能力
- hook 只是在 `onFinish` 后写表单值
- `FileAPI.uploadImage` 没有被任何地方调用

### 风险 4: 分类协议已经出现漂移

- mock 数据用 `'1'/'0'`
- 页面与弹窗逻辑用 `'Y'/'N'`
- 说明 admin-news 模块已经缺少单一事实来源

## 后续处理建议

1. 不在当前实现上继续做碎片化修补。
2. 以当前 scaffold 为承载层，重新迁移 admin-news。
3. 在新迁移中再决定哪些表单能力、类型和 API 边界值得共享。
