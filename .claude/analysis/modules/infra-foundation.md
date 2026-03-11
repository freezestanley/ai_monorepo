# 模块分析: infra-foundation

## 模块范围

- `apps/admin/src/main.tsx`
- `apps/platform/src/main.tsx`
- `apps/*/src/router/*`
- `apps/*/src/layouts/MainLayout/*`
- `apps/*/src/api/server.ts`
- `apps/*/src/constants/index.ts`
- `apps/*/src/styles/antd-theme.ts`
- `apps/*/src/mock/setup.ts`

## 当前职责

- 应用 provider 装配
- 路由懒加载
- 左侧导航和通用布局
- Axios 请求封装
- 主题 token 配置
- mock 注册

## 本轮已完成

- 根级 ESLint 配置修复
- root tooling 依赖补齐
- `postcss.config.js` 切回稳定的 CommonJS
- `.turbo/` 缓存目录加入忽略规则
- `vite/client` 类型文件补齐
- DEV-only mock bootstrap 与 build-only noop alias

## 发现的问题

### 1. 大量重复

下面几组文件几乎是双份维护:

- `main.tsx`
- `api/server.ts`
- `constants/index.ts`
- `layouts/MainLayout/index.tsx`
- `layouts/MainLayout/hooks/useMainLayout.ts`
- `styles/antd-theme.ts`

这说明当前共享抽象没有落在真正高频复用层，而是只抽了组件级能力。

### 2. mock 环境边界

这个问题已经在本轮修复:

- 入口改为 DEV 下动态加载 mock
- build 阶段通过 alias 指向 `src/mock/noop.ts`
- 生产构建不再出现 MockJS 告警

### 3. 基础设施和业务范式没有对齐

- provider 层已经引入 React Query
- 页面层仍普遍手写数据获取
- 结果是增加了依赖与认知成本，但没有获得缓存、重试、失效管理等收益

## 当前推荐方向

继续保持保守收口:

- 不合并 admin/platform 的 runtime 壳层
- 只在工具和配置层继续共享
- 等新一轮业务迁移稳定后，再决定是否需要进一步抽象

## 输出目标

这个模块重构完成后，新增一个 app 或新增一个业务域时，只需要接业务模块，而不是再次复制启动壳层。
