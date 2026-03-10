import type { NewsStatus } from '@/constants'

export interface NewsItem {
  id: number
  newsNo: string
  title: string
  categoryNo: string
  categoryName: string
  summary: string
  content: string
  cover: string | null
  publishState: NewsStatus
  publishTime: string | null
  gmtCreated: string
  gmtModified: string
  creator: string
}

export interface FetchDataParams {
  pageNum?: number
  page?: number
  pageSize?: number
  title?: string
}
