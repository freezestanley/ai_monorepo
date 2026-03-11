# Platform 用户端分析

## 定位

`apps/platform` 是新闻域的只读展示端，承担列表浏览和详情查看。

## 当前状态

- 作为 app scaffold，platform 入口、构建、lint 已恢复可用。
- `news` 页面没有在本轮继续优化，等待后续重新迁移。

## 路由与页面

- `/news`: 新闻列表
- `/news/:newsNo`: 新闻详情

## 业务结构

- 列表页: `NewsList`
- 详情页: `NewsView`
- 本地 mock: 新闻列表、详情

## 特征

- 平台端逻辑明显轻于 admin。
- 页面结构更偏展示型，几乎没有复杂编辑状态。
- 仍然重复了 provider、router、layout、api、constants、theme。

## 优点

- 代码量小，路径清晰。
- 新闻列表和详情是天然的对外展示模型，适合沉淀为“读模型”模板。
- 页面逻辑相对简单，易于在后续增加 SEO、筛选或推荐能力。

## 主要问题

- 旧 `news` 页面仍依赖 admin 风格接口路径 `/admin/newsCenter/*`。
- warnings 仍集中在 `news` hook 与 API 临时类型上。
- 虽然接入了 React Query Provider，但实际上没有使用 React Query。

## 建议方向

- 将平台端沉淀为标准只读域实现模板:
  - 列表 hook
  - 详情 hook
  - 共享类型
  - 可替换的数据源层
- 避免继续复制 admin 的基础设施代码，而是尽快复用共享壳层。
