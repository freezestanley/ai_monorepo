// 消息列表 Mock 数据
export const mockInfoList = {
  data: {
    pageSize: 10,
    pageNum: 1,
    current: 1,
    total: 15,
    list: [
      {
        id: 1,
        title: "系统维护通知",
        typeId: 1,
        summary: "系统将于本周末进行例行维护，维护期间可能会影响部分功能的使用",
        content:
          "<p>尊敬的用户：</p><p>为了提供更好的服务体验，我们将于2024年10月28日22:00-29日06:00进行系统维护。维护期间，以下功能可能会受到影响：</p><ul><li>用户登录</li><li>数据同步</li><li>报表生成</li></ul><p>给您带来不便，敬请谅解。</p>",
        coverImage: "https://via.placeholder.com/300x200/4f46e5/ffffff?text=System+Maintenance",
        status: 1,
        publishTime: "2024-10-25 10:00:00",
        createTime: "2024-10-25 09:30:00",
        updateTime: "2024-10-25 14:20:00",
        creator: "系统管理员",
        modifier: "张三",
        viewCount: 1250,
        likeCount: 35,
        isTop: 1,
        tags: ["系统", "维护", "通知"]
      },
      {
        id: 2,
        title: "新功能发布：智能数据分析",
        typeId: 2,
        summary: "全新的智能数据分析功能正式上线，支持多维度数据挖掘和可视化展示",
        content:
          "<h2>智能数据分析功能介绍</h2><p>我们很高兴地宣布，全新的智能数据分析功能已经正式上线！</p><h3>主要特性：</h3><ul><li>多维度数据挖掘</li><li>实时数据分析</li><li>可视化图表展示</li><li>自定义报表生成</li></ul><p>欢迎大家体验使用！</p>",
        coverImage: "https://via.placeholder.com/300x200/10b981/ffffff?text=Data+Analysis",
        status: 1,
        publishTime: "2024-10-24 15:30:00",
        createTime: "2024-10-24 14:00:00",
        updateTime: "2024-10-24 16:45:00",
        creator: "产品经理",
        modifier: "李四",
        viewCount: 890,
        likeCount: 67,
        isTop: 1,
        tags: ["新功能", "数据分析", "智能"]
      },
      {
        id: 3,
        title: "React 18 新特性深度解析",
        typeId: 3,
        summary: "详细解析 React 18 的新特性，包括并发渲染、Suspense 改进等内容",
        content:
          "<h1>React 18 新特性深度解析</h1><h2>1. 并发渲染（Concurrent Rendering）</h2><p>React 18 引入了并发渲染特性，允许 React 在渲染过程中暂停和恢复，从而提高应用的响应性。</p><h2>2. Suspense 改进</h2><p>Suspense 在 React 18 中得到了显著改进，现在支持更多的使用场景。</p><h2>3. 新的 Hooks</h2><ul><li>useId</li><li>useTransition</li><li>useDeferredValue</li></ul>",
        coverImage: "https://via.placeholder.com/300x200/3b82f6/ffffff?text=React+18",
        status: 1,
        publishTime: "2024-10-23 09:15:00",
        createTime: "2024-10-22 16:30:00",
        updateTime: "2024-10-23 10:20:00",
        creator: "技术总监",
        modifier: "王五",
        viewCount: 2100,
        likeCount: 156,
        isTop: 0,
        tags: ["React", "技术", "前端"]
      },
      {
        id: 4,
        title: "年度技术大会即将开幕",
        typeId: 4,
        summary: "2024年度技术大会将于下月举行，届时将有多位行业专家分享最新技术趋势",
        content:
          "<h1>2024年度技术大会</h1><p>我们很荣幸地宣布，2024年度技术大会将于11月15-16日在上海国际会议中心举行。</p><h2>大会亮点：</h2><ul><li>20+位行业专家演讲</li><li>10+个技术专题分享</li><li>开源项目展示</li><li>技术交流与网络建设</li></ul><h2>报名方式：</h2><p>请访问官方网站进行报名，早鸟票优惠截止至10月31日。</p>",
        coverImage: "https://via.placeholder.com/300x200/f59e0b/ffffff?text=Tech+Conference",
        status: 1,
        publishTime: "2024-10-22 11:00:00",
        createTime: "2024-10-22 09:45:00",
        updateTime: "2024-10-22 14:15:00",
        creator: "市场部",
        modifier: "赵六",
        viewCount: 756,
        likeCount: 89,
        isTop: 0,
        tags: ["会议", "技术", "活动"]
      },
      {
        id: 5,
        title: "用户登录指南",
        typeId: 5,
        summary: "详细说明如何注册和登录系统，以及常见问题的解决方法",
        content:
          "<h1>用户登录指南</h1><h2>1. 注册账号</h2><p>首次使用需要先注册账号：</p><ol><li>点击「注册」按钮</li><li>填写必要信息</li><li>验证邮箱</li><li>设置密码</li></ol><h2>2. 登录系统</h2><ol><li>输入用户名/邮箱</li><li>输入密码</li><li>点击「登录」</li></ol><h2>3. 忘记密码</h2><p>如果忘记密码，可以通过「忘记密码」功能重置。</p>",
        coverImage: "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=User+Guide",
        status: 1,
        publishTime: "2024-10-21 14:20:00",
        createTime: "2024-10-21 13:00:00",
        updateTime: "2024-10-21 15:30:00",
        creator: "客服团队",
        modifier: "孙七",
        viewCount: 1850,
        likeCount: 124,
        isTop: 0,
        tags: ["指南", "登录", "用户"]
      },
      {
        id: 6,
        title: "如何重置密码？",
        typeId: 6,
        summary: "详细步骤说明如何重置忘记的密码",
        content:
          "<h1>密码重置步骤</h1><h2>方法一：通过邮箱重置</h2><ol><li>在登录页面点击「忘记密码」</li><li>输入注册邮箱</li><li>查收重置邮件</li><li>点击邮件中的重置链接</li><li>设置新密码</li></ol><h2>方法二：联系客服</h2><p>如果无法通过邮箱重置，请联系客服：400-123-4567</p>",
        coverImage: null,
        status: 1,
        publishTime: "2024-10-20 16:45:00",
        createTime: "2024-10-20 15:30:00",
        updateTime: "2024-10-20 17:10:00",
        creator: "客服团队",
        modifier: "周八",
        viewCount: 945,
        likeCount: 78,
        isTop: 0,
        tags: ["FAQ", "密码", "重置"]
      },
      {
        id: 7,
        title: "数据安全合规政策更新",
        typeId: 7,
        summary: "根据最新法规要求，更新了数据安全和隐私保护相关政策",
        content:
          "<h1>数据安全合规政策更新通知</h1><p>根据《个人信息保护法》等相关法规的最新要求，我们对数据安全和隐私保护政策进行了更新。</p><h2>主要变更：</h2><ul><li>强化用户数据加密存储</li><li>完善数据访问权限管理</li><li>增加数据删除和导出功能</li><li>定期安全审计</li></ul><p>新政策将于2024年11月1日生效。</p>",
        coverImage: "https://via.placeholder.com/300x200/ef4444/ffffff?text=Security+Policy",
        status: 2,
        publishTime: null,
        createTime: "2024-10-19 10:30:00",
        updateTime: "2024-10-19 16:20:00",
        creator: "法务部",
        modifier: "吴九",
        viewCount: 567,
        likeCount: 45,
        isTop: 0,
        tags: ["政策", "合规", "安全"]
      },
      {
        id: 8,
        title: "员工培训计划启动",
        typeId: 8,
        summary: "新一轮员工工作流培训计划正式启动，涵盖技术和管理两个方向",
        content:
          "<h1>员工培训计划启动通知</h1><p>为了提升员工的专业工作流和管理能力，公司决定启动新一轮的培训计划。</p><h2>培训内容：</h2><h3>技术方向：</h3><ul><li>前端开发技术</li><li>后端架构设计</li><li>数据库优化</li><li>DevOps 实践</li></ul><h3>管理方向：</h3><ul><li>项目管理</li><li>团队协作</li><li>沟通技巧</li><li>领导力提升</li></ul><p>培训时间：每周三、五下午 2:00-5:00</p>",
        coverImage: "https://via.placeholder.com/300x200/06b6d4/ffffff?text=Training",
        status: 1,
        publishTime: "2024-10-18 09:00:00",
        createTime: "2024-10-18 08:30:00",
        updateTime: "2024-10-18 11:45:00",
        creator: "人力资源部",
        modifier: "郑十",
        viewCount: 432,
        likeCount: 56,
        isTop: 0,
        tags: ["培训", "员工", "工作流"]
      }
    ]
  },
  code: "200",
  success: true,
  message: "查询成功",
  serverTime: Date.now(),
  sessionId: "SESSION_INFO_001",
  requestId: "REQ_INFO_001",
  additions: {},
  traceId: "TRACE_INFO_001"
}

// 消息详情 Mock 数据
export const mockInfoDetail = {
  data: {
    id: 1,
    title: "系统维护通知",
    typeId: 1,
    typeName: "系统公告",
    summary: "系统将于本周末进行例行维护，维护期间可能会影响部分功能的使用",
    content:
      "<p>尊敬的用户：</p><p>为了提供更好的服务体验，我们将于2024年10月28日22:00-29日06:00进行系统维护。维护期间，以下功能可能会受到影响：</p><ul><li>用户登录</li><li>数据同步</li><li>报表生成</li></ul><p>给您带来不便，敬请谅解。</p>",
    coverImage: "https://via.placeholder.com/300x200/4f46e5/ffffff?text=System+Maintenance",
    status: 1,
    publishTime: "2024-10-25 10:00:00",
    createTime: "2024-10-25 09:30:00",
    updateTime: "2024-10-25 14:20:00",
    creator: "系统管理员",
    modifier: "张三",
    viewCount: 1250,
    likeCount: 35,
    isTop: 1,
    tags: ["系统", "维护", "通知"],
    attachments: [
      {
        id: 1,
        name: "维护详情.pdf",
        url: "/files/maintenance-detail.pdf",
        size: "2.5MB",
        type: "pdf"
      }
    ]
  },
  code: "200",
  success: true,
  message: "查询成功"
}

// 创建消息 Mock 响应
export const mockCreateInfo = {
  data: {
    id: 16,
    title: "新建消息标题",
    typeId: 1,
    summary: "这是一条新建的消息摘要",
    content: "<p>这是新建消息的详细内容</p>",
    coverImage: null,
    status: 0,
    publishTime: null,
    createTime: new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }),
    updateTime: new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }),
    creator: "当前用户",
    modifier: "当前用户",
    viewCount: 0,
    likeCount: 0,
    isTop: 0,
    tags: []
  },
  code: "200",
  success: true,
  message: "创建成功"
}

// 更新消息 Mock 响应
export const mockUpdateInfo = {
  data: {
    id: 1,
    title: "更新后的消息标题",
    typeId: 1,
    summary: "更新后的消息摘要",
    content: "<p>更新后的消息详细内容</p>",
    coverImage: null,
    status: 1,
    publishTime: "2024-10-25 10:00:00",
    createTime: "2024-10-25 09:30:00",
    updateTime: new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }),
    creator: "系统管理员",
    modifier: "当前用户",
    viewCount: 1250,
    likeCount: 35,
    isTop: 1,
    tags: ["系统", "维护", "通知"]
  },
  code: "200",
  success: true,
  message: "更新成功"
}

// 删除消息 Mock 响应
export const mockDeleteInfo = {
  data: null,
  code: "200",
  success: true,
  message: "删除成功"
}

// 批量删除消息 Mock 响应
export const mockBatchDeleteInfo = {
  data: {
    successCount: 3,
    failCount: 0,
    failIds: []
  },
  code: "200",
  success: true,
  message: "批量删除成功"
}
