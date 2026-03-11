# Admin 管理端分析

## 定位

`apps/admin` 是当前仓库最完整的业务端，承载新闻域的后台管理职责。

## 当前状态

- 作为 app scaffold，admin 入口、构建、lint 已恢复可用。
- 作为业务实现，`news` 相关页面仍是临时迁移资产，本轮未做治理。

## 路由与页面

- `/news-list`: 新闻列表管理
- `/news-catalog`: 分类管理
- `/infocenter/createnews`: 新建新闻
- `/infocenter/edit/:newsNo`: 编辑新闻

说明:

- 管理端菜单已经使用新命名 `news-list` / `news-catalog`
- 编辑页路由仍保留历史迁移路径 `infocenter/*`

## 业务结构

- 列表管理: `NewsDetail`
- 编辑能力: `NewsEdit`
- 分类能力: `NewsType`
- 本地 mock: 新闻、分类、上传
- 共享依赖: `@packages/ui` 中的 `TextEditor`、`ImageUpload`

## 优点

- 页面职责清楚，用户视角完整。
- 编辑页与列表页是典型后台模块，可作为后续迁移模板。
- 与 platform 的职责边界明确，没有跨端 UI 直接复用。

## 主要问题

- `news` 业务 warnings 仍大量存在，但已被明确排除在本轮 scaffold 优化之外。
- `NewsDetail` hook 过重，是后续重迁时应优先拆解的热点。
- 分类状态协议、上传链路、迁移残留仍在旧实现中保留。

## 适合作为模板的部分

- 目录组织方式
- `page + hook + types + styles` 的局部聚合
- 路由懒加载写法

## 不适合作为模板直接复制的部分

- 双 app 各自复制 `main/router/layout/api/constants/theme`
- 大型单 hook 承载全部页面行为
- mock 在入口直接启用
- 页面内对协议字段进行分散判断
