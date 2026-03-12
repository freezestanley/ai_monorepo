// // 消息类别 Mock 数据
// 消息类别 Mock 数据
export const mockInfoTypeList = {
  code: "200",
  success: true,
  message: "查询成功",
  data: {
    pageSize: "10",
    pageNum: "1",
    totalCount: "15",
    data: [
      {
        categoryNo: "SYS001",
        name: "系统公告",
        description: "系统维护、升级等通知",
        categorySort: "1",
        enabledStatus: "1",
        gmtCreated: "2024-01-15 10:30:00",
        gmtModified: "2024-03-20 14:25:00",
        creator: "admin",
        id: "1"
      },
      {
        categoryNo: "ACT002",
        name: "活动通知",
        description: "平台活动、促销等消息",
        categorySort: "2",
        enabledStatus: "1",
        gmtCreated: "2024-02-10 09:15:00",
        gmtModified: "2024-04-05 11:40:00",
        creator: "market_user",
        id: "2"
      },
      {
        categoryNo: "ORD003",
        name: "订单消息",
        description: "订单状态更新通知",
        categorySort: "3",
        enabledStatus: "1",
        gmtCreated: "2024-01-20 13:45:00",
        gmtModified: "2024-05-12 16:30:00",
        creator: "system",
        id: "3"
      },
      {
        categoryNo: "SEC004",
        name: "安全提醒",
        description: "账号安全相关通知",
        categorySort: "4",
        enabledStatus: "0",
        gmtCreated: "2024-03-05 08:20:00",
        gmtModified: "2024-06-18 10:15:00",
        creator: "security_admin",
        id: "4"
      },
      {
        categoryNo: "SYS005",
        name: "版本更新",
        description: "系统功能更新说明",
        categorySort: "5",
        enabledStatus: "1",
        gmtCreated: "2024-02-28 14:00:00",
        gmtModified: "2024-07-22 09:45:00",
        creator: "dev_team",
        id: "5"
      },
      {
        categoryNo: "FIN006",
        name: "财务通知",
        description: "支付、退款等财务相关",
        categorySort: "6",
        enabledStatus: "1",
        gmtCreated: "2024-03-15 11:10:00",
        gmtModified: "2024-08-30 15:20:00",
        creator: "finance_admin",
        id: "6"
      },
      {
        categoryNo: "EMG007",
        name: "紧急通知",
        description: "紧急情况通报",
        categorySort: "7",
        enabledStatus: "1",
        gmtCreated: "2024-04-01 16:40:00",
        gmtModified: "2024-09-10 13:55:00",
        creator: "super_admin",
        id: "7"
      },
      {
        categoryNo: "PRD008",
        name: "产品动态",
        description: "新产品发布信息",
        categorySort: "8",
        enabledStatus: "0",
        gmtCreated: "2024-05-12 09:25:00",
        gmtModified: "2024-10-05 17:30:00",
        creator: "product_manager",
        id: "8"
      },
      {
        categoryNo: "USER009",
        name: "用户通知",
        description: "用户个人消息",
        categorySort: "9",
        enabledStatus: "1",
        gmtCreated: "2024-06-08 14:15:00",
        gmtModified: "2024-11-20 10:05:00",
        creator: "user_system",
        id: "9"
      },
      {
        categoryNo: "CUS010",
        name: "客户服务",
        description: "客服消息反馈",
        categorySort: "10",
        enabledStatus: "1",
        gmtCreated: "2024-07-25 10:50:00",
        gmtModified: "2024-12-01 14:40:00",
        creator: "service_center",
        id: "10"
      }
    ]
  }
}

// 消息类别详情 Mock 数据
export const mockInfoTypeDetail = {
  data: {
    id: 2,
    name: "活动通知",
    description: "平台活动、促销等消息通知",
    sort: 2,
    status: 1,
    createTime: "2024-02-10 09:15:00",
    updateTime: "2024-04-05 11:40:00",
    creator: "market_user",
    modifier: "system_admin"
  },
  code: "200",
  success: true,
  message: "查询成功"
}

// 创建消息类别 Mock 响应
export const mockCreateInfoType = {
  data: {
    id: 11,
    name: "测试类别",
    description: "这是一个测试消息类别",
    sort: 11,
    status: 1,
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
    creator: "test_user",
    modifier: "test_user"
  },
  code: "200",
  success: true,
  message: "创建成功"
}

// 更新消息类别 Mock 响应
export const mockUpdateInfoType = {
  data: {
    id: 3,
    name: "订单消息更新",
    description: "订单状态更新及物流通知",
    sort: 3,
    status: 1,
    createTime: "2024-01-20 13:45:00",
    updateTime: new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }),
    creator: "system",
    modifier: "current_user"
  },
  code: "200",
  success: true,
  message: "更新成功"
}

// 删除消息类别 Mock 响应
export const mockDeleteInfoType = {
  data: null,
  code: "200",
  success: true,
  message: "删除成功"
}
// export const mockInfoTypeList = {
//   code: "sint et minim laboris",
//   success: false,
//   message: "id culpa dolor mollit fugiat",
//   data: {
//     pageSize: "10",
//     pageNum: "1",
//     totalCount: "100",
//     data: [
//       {
//         categoryNo: "dolore occaecat ea nostrud eu",
//         name: "Ut",
//         description: "ex ea",
//         categorySort: "sint in",
//         enabledStatus: "minim",
//         gmtCreated: "occaecat ex aliqua non",
//         gmtModified: "consequat incididunt est",
//         creator: "sed",
//         id: "aliqua pariatur"
//       },
//       {
//         categoryNo: "sit exercitation",
//         name: "eiusmod sunt pariatur sint",
//         description: "labore dolore",
//         categorySort: "sed ad quis",
//         enabledStatus: "est ullamco",
//         gmtCreated: "pariatur Excepteur ullamco do",
//         gmtModified: "aute id ex cillum",
//         creator: "Duis sit irure in ea",
//         id: "ullamco ipsum in eu Ut"
//       },
//       {
//         categoryNo: "dolore ut",
//         name: "fugiat aliqua et culpa Ut",
//         description: "mollit qui",
//         categorySort: "magna",
//         enabledStatus: "tempor",
//         gmtCreated: "Excepteur esse eiusmod officia",
//         gmtModified: "elit dolor",
//         creator: "nostrud",
//         id: "eu cillum consequat enim elit"
//       }
//     ]
//   }
// }

// // 消息类别详情 Mock 数据
// export const mockInfoTypeDetail = {
//   data: {
//     id: 1,
//     name: "系统公告",
//     description: "系统相关的公告信息，包括维护通知、功能更新等",
//     sort: 1,
//     status: 1,
//     createTime: "2024-10-01 09:00:00",
//     updateTime: "2024-10-15 14:30:00",
//     creator: "系统管理员",
//     modifier: "张三"
//   },
//   code: "200",
//   success: true,
//   message: "查询成功"
// }

// // 创建消息类别 Mock 响应
// export const mockCreateInfoType = {
//   data: {
//     id: 9,
//     name: "新建类别",
//     description: "这是一个新建的消息类别",
//     sort: 9,
//     status: 1,
//     createTime: new Date().toLocaleString("zh-CN", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hour12: false
//     }),
//     updateTime: new Date().toLocaleString("zh-CN", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hour12: false
//     }),
//     creator: "当前用户",
//     modifier: "当前用户"
//   },
//   code: "200",
//   success: true,
//   message: "创建成功"
// }

// // 更新消息类别 Mock 响应
// export const mockUpdateInfoType = {
//   data: {
//     id: 1,
//     name: "更新后的类别名称",
//     description: "更新后的类别描述",
//     sort: 1,
//     status: 1,
//     createTime: "2024-10-01 09:00:00",
//     updateTime: new Date().toLocaleString("zh-CN", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hour12: false
//     }),
//     creator: "系统管理员",
//     modifier: "当前用户"
//   },
//   code: "200",
//   success: true,
//   message: "更新成功"
// }

// // 删除消息类别 Mock 响应
// export const mockDeleteInfoType = {
//   data: null,
//   code: "200",
//   success: true,
//   message: "删除成功"
// }
