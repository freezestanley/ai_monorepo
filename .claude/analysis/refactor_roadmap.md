# 重构路径图

## 总体判断

本轮 scaffold 止血已经完成，当前仓库下一步不应继续优化旧 `news` 实现，而应准备下一轮业务重迁。

## 已完成的 scaffold 优化

- 根级 ESLint 配置与依赖修复
- lint 脚本策略从 `--max-warnings 0` 调整为 warnings 可见、errors 阻塞
- `postcss.config.js` 模块类型告警清理
- `vite/client` 类型入口补齐
- DEV-only mock 启用与 build 阶段 noop alias

## 风险矩阵

| 级别 | 风险点 | 证据 | 影响 |
| --- | --- | --- | --- |
| HIGH | `news` 仍是临时迁移实现 | hooks 中存在大量 `any`、依赖数组 warnings 和迁移残留 | 不适合继续在旧实现上叠加功能 |
| MEDIUM-HIGH | admin 大 chunk 仍偏大 | `pnpm build` 仍提示 admin 某些 chunk 超过 500kB | 后续业务继续增长会影响首屏与缓存效率 |
| MEDIUM-HIGH | 共享层抽象仍浅 | `packages/ui` 被使用，`packages/utils` 仍偏示例 | 后续重迁时容易再次产生复制 |
| MEDIUM | 封面上传链路未闭环 | `packages/ui/ImageUpload/index.tsx` 未提供 `action`/`customRequest`；`apps/admin/src/api/news.ts:63-68` 定义了 `FileAPI.uploadImage`，但全仓无调用 | 旧 `news` 实现中“上传封面”仍是 UI 占位 |
| MEDIUM-HIGH | 分类状态字典不一致 | `apps/admin/src/mock/newsType.ts:10-14` 使用 `'1'/'0'`；`apps/admin/src/pages/news/NewsType/index.tsx:59-63` 和 `AddTypeModal.tsx:23-28` 使用 `'Y'/'N'` | mock 下状态展示与编辑回填错误 |
| MEDIUM | 本地删除链路与 mock 方法不一致 | `apps/admin/src/api/news.ts:57-59` 用 `DELETE`；`apps/admin/src/mock/setup.ts:15-16` 只注册 `POST` | 列表删除在 mock 环境下存在失效概率 |
| MEDIUM | admin 主列表 hook 过重 | `apps/admin/src/pages/news/NewsDetail/hooks/useNewsDetail.ts` 510 行 | 查询、表格列、状态切换、删除、批量操作、tab 逻辑混在一起，难测难改 |
| LOW-MEDIUM | 基础设施在双 app 中重复 | `main.tsx`、`api/server.ts`、`constants/index.ts`、`layouts/MainLayout/index.tsx`、`styles/antd-theme.ts` 仍双份维护 | 当前是有意保留的独立性，而不是立即要消除的问题 |
| MEDIUM | 路由与功能存在迁移残留 | `apps/admin/src/pages/news/NewsDetail/hooks/useNewsDetail.ts:121-125` 仍保留 `/infocenter/detail/:newsNo`，但 `apps/admin/src/router/newsRoutes.tsx:8-12` 没有对应路由 | 历史能力残留，后续改动时容易误判 |
| LOW | 文档漂移 | README 与分析文档已更新 | 当前风险已显著下降 |
| MEDIUM | 缺少测试资产 | 未发现 `__tests__`、`*.test.*`、`*.stories.*` | 重构缺少保护网 |

## 复杂度矩阵

| 模块 | 文件 | 规模 | 风险 | 说明 |
| --- | --- | --- | --- | --- |
| admin-news-list | `apps/admin/src/pages/news/NewsDetail/hooks/useNewsDetail.ts` | 510 行 | HIGH | 聚合了请求、分页、表格列、状态切换、删除、批量逻辑 |
| admin-news-style | `apps/admin/src/pages/news/NewsDetail/styles.scss` | 477 行 | MEDIUM | 样式体量过大，容易与页面逻辑一起膨胀 |
| admin-news-type | `apps/admin/src/pages/news/NewsType/hooks/useNewsTypeTable.ts` | 183 行 | MEDIUM | 已出现状态字段漂移与排序残留 |
| admin-news-edit | `apps/admin/src/pages/news/NewsEdit/hooks/useNewsEdit.ts` | 157 行 | MEDIUM | 编辑/创建/分类加载混合，但仍可控 |
| platform-news-list | `apps/platform/src/pages/news/NewsList/hooks/useNewsList.ts` | 105 行 | LOW-MEDIUM | 逻辑简单，但仍重复了查询参数拼装 |
| shared-utils | `packages/utils/store.ts` | 92 行 | MEDIUM | 没有消费者，保留会误导后续模块复用 |

## 耦合分析

### 核心耦合点 1: app 壳层重复

- admin/platform 都复制了 provider 装配、路由 loading、布局、主题、HTTP 封装。
- 当前只有一个业务域时问题不明显，但一旦迁移第二个域，重复会迅速堆积。

### 核心耦合点 2: 新闻数据模型分散

- 新闻类型定义分别存在于 admin/platform 页面目录下。
- 查询参数字符串拼装在两个 `api/news.ts` 中重复。
- 状态常量在两个 app 各存一份。

### 核心耦合点 3: mock 与真实接口耦合方式粗糙

- 入口直接 import mock，而不是按环境懒启用。
- mock 结构对前端页面具有“事实标准”作用，但字段协议与页面判断已经开始漂移。

## 建议后续顺序

### Phase 1: 重新定义业务迁移策略

1. 明确 `news` 不在旧实现上继续修补。
2. 以当前 scaffold 作为承载层，重新设计 `news` 迁移目标。

### Phase 2: 新一轮业务迁移

1. 重新迁移 `news`，而不是在旧 hooks 上继续修警告。
2. 在新迁移过程中决定哪些类型、API 约定、表单片段值得沉淀为共享领域资产。

### Phase 3: 再评估共享层

1. 若第二个业务域也出现类似基础设施，再考虑抽共享 runtime 工具。
2. 继续保持 `admin` 与 `platform` 的独立运行边界。

## 预期收益

- 把当前仓库从“能跑原型”提升到“可持续迁移骨架”。
- 后续每迁移一个域时，新增的是业务代码，而不是重复基础设施。
- 风险从页面级偶发问题，转为可控的模块级迭代。
