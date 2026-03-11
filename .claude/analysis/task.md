# 分析任务清单

## 已完成

- ✅ 清理扫描范围: 排除隐藏目录、`node_modules/`、`dist/`、`build/` 和二进制资源。
- ✅ 确认架构形态: `pnpm workspace + turbo + 双 Vite React app + 共享 packages`。
- ✅ 建立纯净业务拓扑: 仅保留 `apps/*/src` 与 `packages/*` 的业务结构。
- ✅ 输出模块级分析报告与总报告。
- ✅ 修复根级 ESLint 配置错误与依赖缺口。
- ✅ 统一 lint 脚本策略为“error 阻塞，warning 可见”。
- ✅ 清理 `.turbo/` 缓存目录忽略规则。
- ✅ 修复 `postcss.config.js` 的模块类型告警。
- ✅ 为两个 app 补齐 `vite/client` 类型入口。
- ✅ 将 mock 改为仅开发环境启用，并在 build 阶段指向空模块。
- ✅ 重新验证 `pnpm build` 与 `pnpm exec turbo lint --force`。

## 待执行的工程任务

- ⬜ `news` 模块重新迁移，不沿用当前临时实现继续演进。
- ⬜ 处理现存 lint warnings，优先从 `news` 临时迁移代码开始。
- ⬜ 评估是否需要继续保留 `packages/utils` 里的示例 store。
- ⬜ 决定后续是否抽取更稳定的共享工具包，但保持 app runtime 独立。
