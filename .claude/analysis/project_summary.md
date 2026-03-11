# 项目整体业务架构分析

## 一句话判断

`ai_monorepo` 当前最准确的定位是“两个独立 app 的前端 monorepo 脚手架”，`news` 只是临时迁移资产，不再作为本轮优化中心。

## 当前业务版图

- `admin`: 独立管理端应用
- `platform`: 独立用户端应用
- `shared packages`: 提供共享组件与工具
- `news`: 当前仅作为临时迁移示例存在，后续将重新迁移

## 业务架构优点

- 迁移边界明确: 当前只集中在 `news` 一个业务域，学习成本低。
- 双端职责清晰: admin 与 platform 没有相互嵌套，避免了复杂权限与路由耦合。
- 页面组织直观: 基本采用“页面组件 + 自定义 hook + api + mock”的结构，读代码成本可控。
- 共享意识已经建立: 富文本和上传组件被抽到 `packages/ui`，说明团队在主动识别复用点。
- 构建链可用: `pnpm build` 成功，说明仓库可作为继续迁移的基础骨架。

## 业务架构缺点

- 只迁移了单一业务域，平台级规范尚未固化。
- app 之间基础设施重复多，后续模块越多，维护成本会线性变差。
- mock、接口层、共享类型没有统一抽象，迁移规模一扩大就会出现漂移。
- 当前“共享层”里混入了示例代码，说明仓库还处在脚手架向业务仓过渡阶段。

## 本轮 scaffold 优化结果

### 已解决

- lint 工具链从“配置不可用”恢复到“可执行并输出真实 warnings”
- `postcss.config.js` 的模块类型告警已消失
- 生产构建中的 MockJS 显式告警已消失
- 两个 app 仍保持独立入口和独立运行

### 仍保留

- `news` 模块的类型与 hooks warnings
- admin 产物的大 chunk 警告
- 共享层边界仍偏浅

## 工程成熟度判断

### 已具备

- Monorepo 基础骨架
- 双应用独立构建能力
- 页面级懒加载
- Ant Design 主题接入
- 本地 Mock 开发能力

### 仍然缺失

- warnings 级别的清理与分阶段质量门禁
- 测试层
- 真正可复用的领域共享包
- `news` 重迁后的稳定业务基线

## 关键证据

- `apps/admin/src/main.tsx` 与 `apps/platform/src/main.tsx` 都直接装配了 provider 和 mock，说明每个 app 独立运行，但装配方式重复。
- `apps/admin/src/router/newsRoutes.tsx` 和 `apps/platform/src/router/newsRoutes.tsx` 显示当前完整业务只有 news 域。
- `packages/ui/index.tsx` 只导出 3 个组件，其中只有富文本和上传组件被真实业务接入。
- `packages/utils/index.ts` 与 `packages/utils/store.ts` 当前没有任何业务 import，仍属于示例或预留资产。
- `README.md` 仍在描述 `App.tsx`、`public/` 和通用 scaffold，已和当前新闻业务结构脱节。

## 项目阶段判断

更像“脚手架稳定化阶段 + 业务重迁前准备阶段”。

原因:

- 构建和 lint 已恢复可用，但业务 warnings 仍大量存在。
- 运行时独立性被明确保留。
- `news` 没有继续治理，而是等待后续重迁。
- 文档已和当前脚手架状态重新对齐。

## 总体建议

下一阶段不应该继续无序迁移新模块，而应该先做一次“小型基础设施收口”:

1. 修 lint 和 mock 环境隔离。
2. 收敛 app 重复的基础层。
3. 把 news 域沉淀成真正可复用的共享领域模型。
4. 在此之后再迁移第二个业务域。
