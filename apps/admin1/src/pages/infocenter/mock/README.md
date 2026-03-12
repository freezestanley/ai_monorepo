# Infocenter Mock 数据说明

这个目录包含了 infocenter（消息中心）模块的 Mock 测试数据，用于前端开发和测试。

## 文件结构

```
mock/
├── index.js          # Mock 数据入口文件，配置所有接口拦截
├── infoType.js       # 消息类别相关的 Mock 数据
├── info.js          # 消息内容相关的 Mock 数据
├── file.js          # 文件上传相关的 Mock 数据
└── README.md        # 说明文档
```

## 使用方法

### 1. 启用 Mock 数据

在应用入口文件中引入 Mock 配置：

```javascript
// 在 src/main.js 或 src/index.js 中添加
import '@/pages/infocenter/mock'
```

### 2. Mock 接口列表

#### 消息类别接口

- `GET /api/admin/bot/chatModel/list` - 获取消息类别列表
- `POST /api/admin/bot/create` - 创建/更新/删除消息类别

#### 消息内容接口

- `POST /api/admin/bot/create` - 消息的增删改查操作
- 支持的操作类型：
  - `getInfoList` - 获取消息列表
  - `getInfoDetail` - 获取消息详情
  - `createInfo` - 创建消息
  - `updateInfo` - 更新消息
  - `deleteInfo` - 删除消息
  - `batchDeleteInfo` - 批量删除消息

#### 文件上传接口

- `POST /api/file/upload/image` - 图片上传
- `POST /api/file/upload/document` - 文档上传
- `POST /api/file/batch-upload` - 批量文件上传
- `DELETE /api/file/delete` - 删除文件
- `GET /api/file/list` - 获取文件列表

### 3. 数据结构说明

#### 消息类别数据结构

```javascript
{
  id: Number,           // 类别ID
  name: String,         // 类别名称
  description: String,  // 类别描述
  sort: Number,         // 排序值
  status: Number,       // 状态（0-禁用，1-启用）
  createTime: String,   // 创建时间
  updateTime: String,   // 更新时间
  creator: String,      // 创建人
  modifier: String      // 修改人
}
```

#### 消息数据结构

```javascript
{
  id: Number,           // 消息ID
  title: String,        // 消息标题
  typeId: Number,       // 所属类别ID
  summary: String,      // 消息摘要
  content: String,      // 消息详细内容（HTML格式）
  coverImage: String,   // 封面图片URL
  status: Number,       // 状态（0-草稿，1-已发布，2-待审核，3-已下线）
  publishTime: String,  // 发布时间
  createTime: String,   // 创建时间
  updateTime: String,   // 更新时间
  creator: String,      // 创建人
  modifier: String,     // 修改人
  viewCount: Number,    // 浏览次数
  likeCount: Number,    // 点赞数
  isTop: Number,        // 是否置顶（0-否，1-是）
  tags: Array          // 标签数组
}
```

#### 文件数据结构

```javascript
{
  fileId: String,       // 文件ID
  fileName: String,     // 文件名
  fileUrl: String,      // 文件访问URL
  thumbnailUrl: String, // 缩略图URL（图片文件）
  fileSize: Number,     // 文件大小（字节）
  fileType: String,     // 文件MIME类型
  width: Number,        // 图片宽度（图片文件）
  height: Number,       // 图片高度（图片文件）
  uploadTime: String,   // 上传时间
  uploader: String,     // 上传人
  usageCount: Number    // 使用次数
}
```

### 4. 请求参数说明

#### 消息类别列表查询参数

- `keyword`: 搜索关键词（可选）
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10
- `botNo`: 空间编号

#### 消息列表查询参数

- `keyword`: 搜索关键词（可选）
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10
- `typeId`: 消息类别ID（可选）

#### 文件列表查询参数

- `keyword`: 文件名搜索（可选）
- `fileType`: 文件类型过滤（可选）
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10

### 5. 响应格式

所有接口都使用统一的响应格式：

```javascript
{
  code: String,         // 响应码："200"表示成功
  success: Boolean,     // 是否成功
  message: String,      // 响应消息
  data: Object|Array,   // 响应数据
  serverTime: Number,   // 服务器时间戳
  sessionId: String,    // 会话ID
  requestId: String,    // 请求ID
  additions: Object,    // 附加信息
  traceId: String      // 追踪ID
}
```

### 6. 分页数据格式

列表接口的分页数据格式：

```javascript
{
  pageSize: Number,     // 每页数量
  pageNum: Number,      // 当前页码
  current: Number,      // 当前页码
  total: Number,        // 总记录数
  list: Array          // 数据列表
}
```

### 7. 开发建议

1. **开发环境使用**: Mock 数据仅在开发环境中启用，生产环境会自动禁用
2. **数据更新**: 根据实际接口变化及时更新 Mock 数据结构
3. **测试覆盖**: 包含了正常情况和异常情况的测试数据
4. **数据一致性**: Mock 数据应与后端接口保持一致的数据结构

### 8. 注意事项

- Mock 接口会自动添加延时（200-1000ms），模拟真实网络请求
- 支持搜索、分页、排序等功能的模拟
- 文件上传接口会模拟真实的上传过程和响应
- 所有时间字段使用中文格式："YYYY-MM-DD HH:mm:ss"

### 9. 调试说明

Mock 接口调用时会在控制台输出日志，便于调试：

```
Mock: 获取消息类别列表 {url: "...", method: "GET", ...}
Mock: 消息类别操作 {body: "...", method: "POST", ...}
```

### 10. 扩展说明

如需添加新的 Mock 数据或接口：

1. 在对应的数据文件中添加新的 Mock 数据
2. 在 `index.js` 中配置新的接口拦截
3. 更新本 README 文件中的接口列表和数据结构说明