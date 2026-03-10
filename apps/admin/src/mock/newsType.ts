export const mockNewsTypeList = {
  code: '200',
  success: true,
  message: '查询成功',
  data: {
    pageSize: '10',
    pageNum: '1',
    totalCount: '10',
    data: [
      { categoryNo: 'SYS001', name: '系统公告', description: '系统维护、升级等通知', categorySort: '1', enabledStatus: '1', gmtCreated: '2024-01-15 10:30:00', gmtModified: '2024-03-20 14:25:00', creator: 'admin', id: '1' },
      { categoryNo: 'ACT002', name: '活动通知', description: '平台活动、促销等消息', categorySort: '2', enabledStatus: '1', gmtCreated: '2024-02-10 09:15:00', gmtModified: '2024-04-05 11:40:00', creator: 'market_user', id: '2' },
      { categoryNo: 'ORD003', name: '订单消息', description: '订单状态更新通知', categorySort: '3', enabledStatus: '1', gmtCreated: '2024-01-20 13:45:00', gmtModified: '2024-05-12 16:30:00', creator: 'system', id: '3' },
      { categoryNo: 'SEC004', name: '安全提醒', description: '账号安全相关通知', categorySort: '4', enabledStatus: '0', gmtCreated: '2024-03-05 08:20:00', gmtModified: '2024-06-18 10:15:00', creator: 'security_admin', id: '4' },
      { categoryNo: 'SYS005', name: '版本更新', description: '系统功能更新说明', categorySort: '5', enabledStatus: '1', gmtCreated: '2024-02-28 14:00:00', gmtModified: '2024-07-22 09:45:00', creator: 'dev_team', id: '5' },
    ],
  },
}

export const mockCreateNewsType = { data: { id: '11', name: '测试类别' }, code: '200', success: true, message: '创建成功' }
export const mockUpdateNewsType = { data: null, code: '200', success: true, message: '更新成功' }
export const mockDeleteNewsType = { data: null, code: '200', success: true, message: '删除成功' }
