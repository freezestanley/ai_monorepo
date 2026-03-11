# 纯净业务架构

## 架构结论

当前项目采用以下组合架构:

- Monorepo: `pnpm-workspace.yaml` + `turbo.json`
- 双 SPA: `apps/admin` 与 `apps/platform` 各自独立构建、独立路由、独立入口
- 页面特征分层: `page -> hook -> api -> mock`
- 共享包模式: `packages/ui`、`packages/utils`
- 共享边界只停留在工具层和组件层，不合并运行时 app shell
- Mock-first 本地开发，但 mock 现在只在 DEV 启用
- Hash Router 兼容迁移路径: admin 保留了 `infocenter/*` 路由命名

## 纯净业务拓扑

```text
apps/
  admin/
    src/
      api/
        news.ts
        server.ts
      constants/
        index.ts
      layouts/
        MainLayout/
          index.tsx
          hooks/useMainLayout.ts
          types.ts
      mock/
        news.ts
        newsType.ts
        setup.ts
      pages/
        news/
          NewsDetail/
            index.tsx
            hooks/useNewsDetail.ts
            types.ts
            styles.scss
          NewsEdit/
            index.tsx
            hooks/useNewsEdit.ts
            types.ts
            styles.scss
          NewsType/
            index.tsx
            hooks/useNewsTypeTable.ts
            components/AddTypeModal.tsx
            types.ts
            styles.scss
          index.ts
      router/
        index.tsx
        newsRoutes.tsx
      styles/
        antd-theme.ts
        index.scss
      main.tsx

  platform/
    src/
      api/
        news.ts
        server.ts
      constants/
        index.ts
      layouts/
        MainLayout/
          index.tsx
          hooks/useMainLayout.ts
          types.ts
      mock/
        news.ts
        setup.ts
      pages/
        news/
          NewsList/
            index.tsx
            hooks/useNewsList.ts
            types.ts
            styles.scss
          NewsView/
            index.tsx
            hooks/useNewsView.ts
            types.ts
            styles.scss
      router/
        index.tsx
        newsRoutes.tsx
      styles/
        antd-theme.ts
        index.scss
      main.tsx

packages/
  ui/
    Button.tsx
    ImageUpload/
      index.tsx
      types.ts
    TextEditor/
      index.tsx
      types.ts
    index.tsx
  utils/
    index.ts
    store.ts
```

## 规模快照

- 业务代码与样式文件: 63 个
- `apps/admin/src`: 30 个
- `apps/platform/src`: 23 个
- `packages/*`: 8 个
- 业务文件总行数: 4437 行

## 分层职责

### 1. 应用壳层

- `main.tsx`: 装配 `QueryClientProvider`、`ConfigProvider`、路由与 mock
- `router/`: 路由注册与懒加载
- `layouts/MainLayout/`: 左侧导航、头部和内容出口

### 2. 业务域层

- `pages/news/*`: 当前唯一完整迁移域
- admin 侧: 列表管理、编辑、分类
- platform 侧: 列表展示、详情查看

### 3. 基础能力层

- `api/server.ts`: Axios 封装
- `api/news.ts`: 新闻域接口定义
- `constants/index.ts`: 前缀、状态常量
- `mock/*`: 本地接口模拟

### 4. 共享层

- `packages/ui`: 富文本、图片上传、示例按钮
- `packages/utils`: 通用函数与示例 store

## 当前边界判断

- 边界清晰的部分: admin 与 platform 保持独立运行。
- 已完成收口的部分: lint 工具链、postcss 配置、DEV-only mock 启用方式。
- 暂未收口的部分: app shell、常量、HTTP 层、主题、路由装配仍然重复，但这是当前有意保留的独立性。
- 共享抽象还不成熟: `packages/ui` 是可用共享层，`packages/utils` 仍偏示例包，不是稳定业务共享层。
