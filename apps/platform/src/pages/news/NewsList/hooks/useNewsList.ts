import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { NewsListAPI } from '@/api/news'
import type { NewsItem, FetchListParams } from '../types'

// The axios interceptor returns response.data directly, so the actual
// resolved value has this shape rather than AxiosResponse.
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

export const useNewsList = () => {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<NewsItem[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [searchValue, setSearchValue] = useState('')

  const fetchData = useCallback(
    async (params: FetchListParams = {}) => {
      setLoading(true)
      try {
        const queryParams: FetchListParams = {
          pageNum: params.pageNum || pagination.current,
          pageSize: params.pageSize || pagination.pageSize,
          title: params.title !== undefined ? params.title : searchValue,
          publishState: 'publish',
        }

        const response = (await NewsListAPI.getList(queryParams)) as unknown as ApiResponse<{
          data: NewsItem[]
          totalCount: number
          pageNum: number
        }>

        if (response.success) {
          setDataSource(response.data.data || [])
          setPagination((prev) => ({
            ...prev,
            total: response.data.totalCount || 0,
            current: response.data.pageNum || 1,
          }))
        } else {
          message.error(response.message || '获取数据失败')
        }
      } catch (error) {
        message.error('获取数据失败')
      } finally {
        setLoading(false)
      }
    },
    [pagination.current, pagination.pageSize, searchValue]
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      setPagination((prev) => ({ ...prev, current: 1 }))
      fetchData({ pageNum: 1, title: value })
    },
    [fetchData]
  )

  const handlePageChange = useCallback(
    (page: number, pageSize: number) => {
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
      }))
      fetchData({ pageNum: page, pageSize })
    },
    [fetchData]
  )

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!isMounted) return
      await fetchData()
    }

    loadData()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    loading,
    dataSource,
    pagination,
    searchValue,
    handleSearch,
    handlePageChange,
  }
}
