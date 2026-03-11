# ai_monorepo 深度分析索引

生成时间: 2026-03-11

本轮分析基于当前仓库源码、脚手架优化后的 `pnpm build`、`pnpm exec turbo lint --force`、GitNexus 索引信息和业务文件扫描完成。

## 按模块需要读取相关文档

- **项目总结分析**: `./claude/analysis/project_summary.md`
- **scaffold分析**: `./claude/analysis/scaffold.md`
- **refactor_roadmap**: `./claude/analysis/refactor_roadmap.md`
- **admin 用户端分析**: `./claude/analysis/admin.md`
- **Platform 用户端分析**: `./claude/analysis/platform.md`
- **padmin-news模块分析**: `./claude/analysis/modules/admin-news.md`
- **platform-news模块分析**: `./claude/analysis/modules/platform-news.md`
- **infra-foundation模块分析**: `./claude/analysis/modules/infra-foundation.md`
- **shared-ui模块分析**: `./claude/analysis/modules/shared-ui.md`
- **shared-utils模块分析**: `./claude/analysis/modules/shared-utils.md`


## 结论摘要

- 当前仓库是“两个独立 app + 共享工具层”的前端 monorepo 脚手架。
- `admin` 与 `platform` 继续独立运行，没有被合并到统一 runtime 壳层。
- 本轮只优化 scaffold，没有处理 `news` 业务逻辑；`news` 仍视为后续要重迁的临时资产。
- `pnpm build` 成功。
- `pnpm exec turbo lint --force` 成功，但仍有 warnings，主要来自 `news` 临时迁移代码与共享示例代码。
- 生产构建中的 `postcss` 模块类型告警和 MockJS 告警已被清理。

## 验证记录

- 构建: `pnpm build` 成功，两个 app 均产出 `dist/`。
- 静态检查: `pnpm exec turbo lint --force` 成功，输出 warnings 但无 errors。
- 入口扫描: `apps/*/src/main.tsx` 不再顶层静态 `import '@/mock/setup'`，而是只在 DEV 动态加载。
- GitNexus: 仓库已索引，但当前没有执行流和功能聚类数据，因此模块判断以源码扫描为主。
