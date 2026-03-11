# 模块分析: shared-utils

## 模块范围

- `packages/utils/index.ts`
- `packages/utils/store.ts`

## 导出能力

### 工具函数

- `formatCurrency`
- `debounce`
- `deepClone`
- `generateId`
- `validateEmail`

### Zustand store

- `useCounterStore`
- `useUserStore`
- `useTodoStore`

## 当前状态

- 当前仓库未发现任何业务代码 import `@packages/utils`
- 这说明它不是“当前在用的共享层”，而是“预置但未落地的共享层”

## 判断

这是一个典型的脚手架遗留包，而不是实际业务资产。

## 风险

- 后续迁移人员可能误以为这些 store 是平台标准 store。
- 示例级 API 会污染真正的共享边界。
- 包名已经接入 app 依赖，但实际没有贡献业务价值。

## 建议

1. 若短期无使用计划，先从文档层明确标记为 `example` 或直接移除。
2. 若打算长期保留，只保留真正会被多个业务域复用的函数。
3. 不要让示例 store 成为默认状态管理模式，否则会把样板逻辑扩散到正式代码中。
