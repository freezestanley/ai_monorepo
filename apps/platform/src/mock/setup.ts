import Mock from 'mockjs'
import { mockInfoList, mockInfoDetail } from './news'

const NEWS_PREFIX = '/news'

// 新闻列表
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/page`), 'get', () => mockInfoList)
// 新闻详情
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/detail`), 'get', () => mockInfoDetail)

console.log('[Mock] Platform news mock enabled')
