import { Get } from './server'
import { NEWS_PREFIX } from '@/constants'

const prefix = NEWS_PREFIX

/** 新闻列表 API（只读） */
export const NewsListAPI = {
  getList: (params?: Record<string, any>) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, String(params[key]))
        }
      })
    }
    const queryString = queryParams.toString()
    const url = `${prefix}/admin/newsCenter/page${queryString ? `?${queryString}` : ''}`
    return Get(url)
  },
  getDetail: (newsNo: string) => Get(`${prefix}/admin/newsCenter/detail`, { newsNo }),
}
