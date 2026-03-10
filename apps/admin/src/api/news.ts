import { Get, Post, Put, Del, Upload } from './server'
import { NEWS_PREFIX } from '@/constants'

const prefix = NEWS_PREFIX

/** 新闻列表管理 API */
export const NewsDetailAPI = {
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
}

/** 新闻分类 API */
export const NewsTypeAPI = {
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
    const url = `${prefix}/admin/newsCategory/page${queryString ? `?${queryString}` : ''}`
    return Get(url)
  },
  create: (data: Record<string, any>) => Post(`${prefix}/admin/newsCategory/create`, data),
  update: (categoryNo: string, data: Record<string, any>) =>
    Put(`${prefix}/admin/newsCategory/update`, { ...data, categoryNo }),
  delete: (categoryNo: string) => Del(`${prefix}/admin/newsCategory/${categoryNo}`),
}

/** 新闻编辑 API */
export const NewsEditAPI = {
  detail: (newsNo: string) => Get(`${prefix}/admin/newsCenter/detail`, { newsNo }),
  publish: (params: { newsNo: string; publishStateEdit: string }) =>
    Post(`${prefix}/admin/newsCenter/publish/${params.newsNo}/${params.publishStateEdit}`, params),
  getListCategory: (params?: Record<string, any>) =>
    Get(`${prefix}/admin/newsCategory/page`, params),
  create: (params: Record<string, any>) => Post(`${prefix}/admin/newsCenter/create`, params),
  update: (data: Record<string, any>) => Put(`${prefix}/admin/newsCenter/update`, data),
  delete: (newsNo: string) => Post(`${prefix}/admin/newsCenter/${newsNo}`),
}

/** 新闻通用 API */
export const NewsAPI = {
  delete: (newsNo: string) => Del(`${prefix}/admin/newsCenter/${newsNo}`),
  batchDelete: (ids: string[]) => Post(`${prefix}/admin/newsCenter/batchDelete`, { ids }),
}

/** 文件上传 API */
export const FileAPI = {
  uploadImage: async (file: FormData) => {
    return Upload(`${prefix}/admin/file/upload`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
