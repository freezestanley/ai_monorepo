import Mock from 'mockjs'
import { mockInfoList, mockInfoDetail, mockCreateInfo, mockUpdateInfo, mockDeleteInfo, mockPublishInfo } from './news'
import { mockNewsTypeList, mockCreateNewsType, mockUpdateNewsType, mockDeleteNewsType } from './newsType'

const NEWS_PREFIX = '/news'

// 新闻列表
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/page`), 'get', () => mockInfoList)
// 新闻详情
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/detail`), 'get', () => mockInfoDetail)
// 新闻创建
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/create`), 'post', () => mockCreateInfo)
// 新闻更新
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/update`), 'put', () => mockUpdateInfo)
// 新闻删除
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/NEWS`), 'post', () => mockDeleteInfo)
// 新闻发布状态
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/publish`), 'post', () => mockPublishInfo)
// 分类列表
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCategory/page`), 'get', () => mockNewsTypeList)
// 分类创建
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCategory/create`), 'post', () => mockCreateNewsType)
// 分类更新
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCategory/update`), 'put', () => mockUpdateNewsType)
// 分类删除
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCategory/`), 'delete', () => mockDeleteNewsType)
// 文件上传
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/file/upload`), 'post', () => ({
  data: { url: 'https://via.placeholder.com/800x450', objectKey: 'mock-image-key' },
  code: '200',
  success: true,
  message: '上传成功',
}))

console.log('[Mock] News module mock enabled')
