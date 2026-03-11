# ai_monorepo

一个基于 `pnpm workspace + Turborepo` 的前端 monorepo 脚手架，当前包含两个彼此独立运行的应用和两个共享包。

## 当前定位

- `apps/admin`: 管理端独立应用
- `apps/platform`: 用户端独立应用
- `packages/ui`: 共享 UI 组件
- `packages/utils`: 共享工具与示例 store

本仓库当前已经完成一轮脚手架优化，但 `news` 业务模块只是临时迁移资产，后续会重新迁移。  
因此，当前推荐把这里理解为“可继续演进的双应用脚手架”，而不是稳定的 `news` 业务基线。

## 架构原则

- `admin` 与 `platform` 保持独立入口、独立路由、独立布局、独立主题、独立 HTTP 层
- 只共享工具级和组件级能力，不合并运行时 app shell
- mock 仅在开发环境启用，生产构建不再显式打包 mock 入口

## 目录结构

```text
ai_monorepo/
├── apps/
│   ├── admin/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── constants/
│   │   │   ├── layouts/
│   │   │   ├── mock/
│   │   │   ├── pages/
│   │   │   ├── router/
│   │   │   ├── styles/
│   │   │   ├── main.tsx
│   │   │   └── vite-env.d.ts
│   │   ├── package.json
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── platform/
│       ├── src/
│       │   ├── api/
│       │   ├── constants/
│       │   ├── layouts/
│       │   ├── mock/
│       │   ├── pages/
│       │   ├── router/
│       │   ├── styles/
│       │   ├── main.tsx
│       │   └── vite-env.d.ts
│       ├── package.json
│       ├── postcss.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── vite.config.ts
├── packages/
│   ├── ui/
│   └── utils/
├── docs/plans/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 技术栈

- React 18
- TypeScript 5
- Vite 4
- Turborepo
- Ant Design 5
- React Router 6
- Axios
- MockJS
- Sass
- ESLint

## 开发命令

安装依赖:

```bash
pnpm install
```

启动所有应用:

```bash
pnpm dev
```

构建所有应用:

```bash
pnpm build
```

运行 lint:

```bash
pnpm lint
```

## 当前脚手架状态

### 已完成

- 根级 ESLint 工具链可运行
- `postcss.config.js` 模块类型告警已清理
- mock 改为仅开发环境启用
- `admin` 与 `platform` 仍保持独立运行

### 已知现状

- `pnpm lint` 当前可通过，但仍会输出 warnings
- warnings 主要集中在 `news` 临时迁移代码和共享示例代码
- `news` 模块后续会重新迁移，因此本轮没有清理其业务 warnings

## 分析文档

分析结果见:

- `.claude/analysis/index.md`
- `.claude/analysis/project_summary.md`
- `.claude/analysis/scaffold.md`
- `.claude/analysis/refactor_roadmap.md`
