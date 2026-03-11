# 模块分析: shared-ui

## 模块范围

- `packages/ui/index.tsx`
- `packages/ui/Button.tsx`
- `packages/ui/ImageUpload/*`
- `packages/ui/TextEditor/*`

## 导出能力

- `Button`
- `ImageUpload`
- `TextEditor`

## 当前消费者

- `ImageUpload`: `apps/admin/src/pages/news/NewsEdit/index.tsx`
- `TextEditor`: `apps/admin/src/pages/news/NewsEdit/index.tsx`
- `Button`: 当前未发现业务消费

## 优点

- 已经把重型富文本能力从 app 中抽离。
- 上传组件与编辑器具备复用潜力。

## 主要问题

### 1. `ImageUpload` 不是完整上传组件

- 只做了类型校验和 `onChange` 透传
- 没有 `action`
- 没有 `customRequest`
- 没有和业务上传 API 对接

因此它更像“上传外观组件”，而不是“可交付上传能力”。

### 2. `Button` 更像脚手架示例

- Tailwind 风格明显
- 当前业务页面全部使用 Ant Design `Button`
- 没有真实场景消费

### 3. 组件粒度还停留在“控件复用”

共享的是富文本和上传控件，但新闻领域的表单片段、数据格式化、上传策略并没有同步沉淀。

## 针对性建议

1. 把 `ImageUpload` 升级为真正的受控上传组件。
2. 若继续以 antd 为主，清理未使用的示例 `Button`，避免双 UI 体系并存。
3. 对 `TextEditor` 增加更明确的值协议和只读模式约束，避免后续页面自行拼接。
