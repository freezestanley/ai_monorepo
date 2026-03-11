# 模块分析: platform-news

> 状态: 冻结中。本轮未继续优化，后续计划重新迁移而不是在旧实现上持续修补。

## 模块范围

- `apps/platform/src/pages/news/NewsList/*`
- `apps/platform/src/pages/news/NewsView/*`
- `apps/platform/src/api/news.ts`
- `apps/platform/src/mock/news.ts`

## 公共出口

- `NewsList`
- `NewsView`
- `NewsListAPI`

## 模块职责

- 新闻列表展示
- 标题搜索
- 分页浏览
- 新闻详情查看

## 依赖关系

### 依赖本 app

- `@/api/news`
- `@/constants`
- `@/router`
- `@/mock`

### 不依赖共享包

- 当前 platform-news 没有直接使用 `@packages/ui` 或 `@packages/utils`

## 结构特点

- 页面层相对薄
- hook 主要负责数据拉取与导航
- 样式和视图基本局部封装在模块目录下

## 风险点

### 风险 1: 查询逻辑重复

`NewsListAPI.getList` 与 admin 端的 `NewsDetailAPI.getList` 基本是同一套查询参数拼装逻辑。

### 风险 2: 对外展示端仍使用 admin 风格路径

`/admin/newsCenter/page`、`/admin/newsCenter/detail` 对平台端来说语义不自然，说明后端契约尚未按读写职责解耦。

### 风险 3: Provider 前置但没有真正利用

- 入口已经接入 `QueryClientProvider`
- 实际页面仍全部采用手写 `useState + useEffect`

这意味着“基础设施先上了，但范式还没跟上”。

## 后续处理建议

1. 不在当前旧实现上继续消耗时间清 warnings。
2. 重新迁移 platform-news，并在迁移时确定只读模型边界。
3. 是否保留 React Query，应在新迁移时重新决策。
