import { useState, useEffect } from 'react'
import { message } from 'antd'
import { NewsTypeAPI } from '@/api/news'
import type { CategoryItem } from '../types'

// The axios interceptor returns response.data directly, so the actual
// resolved value has this shape rather than AxiosResponse.
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

interface PaginationState {
  current: number
  pageSize: number
  total: number
}

interface SortInfo {
  field: string | null
  order: string | null
}

const useNewsTypeTable = () => {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<CategoryItem[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [searchValue, setSearchValue] = useState('')
  const [sortInfo, setSortInfo] = useState<SortInfo>({ field: null, order: null })

  const fetchData = async (params: Record<string, any> = {}) => {
    setLoading(true)
    try {
      const queryParams = {
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
        name: searchValue,
        sortType: 'desc',
        ...params,
      }

      const response = (await NewsTypeAPI.getList(queryParams)) as unknown as ApiResponse<{
        data: CategoryItem[]
        totalCount: number
        pageNum: number
      }>

      if (response.success) {
        setDataSource(response.data.data || [])
        setPagination((prev) => ({
          ...prev,
          total: parseInt(String(response.data.totalCount || 0), 10),
          current: parseInt(String(response.data.pageNum || 1), 10),
        }))
      } else {
        message.error(response.message || '获取数据失败')
        setDataSource([])
      }
    } catch (error: any) {
      console.error('获取信息类别数据失败:', error)
      message.error(`获取数据失败: ${error.message || '网络错误'}`)
      setDataSource([])
    } finally {
      setLoading(false)
    }
  }

  const handleTableChange = async (
    paginationConfig: any,
    _filters: any,
    sorter: any
  ) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }))

    if (sorter) {
      setSortInfo({ field: sorter.field, order: sorter.order })
    }

    try {
      const params: Record<string, any> = {
        pageNum: paginationConfig.current,
        pageSize: paginationConfig.pageSize,
      }

      if (sorter && sorter.field && sorter.order) {
        params.sortField = sorter.field
        params.sortOrder = sorter.order
      }

      await fetchData(params)
    } catch (error) {
      console.error('表格数据获取失败:', error)
    }
  }

  const handleSearch = async (value: string) => {
    setSearchValue(value)
    setPagination((prev) => ({ ...prev, current: 1 }))
    try {
      await fetchData({ pageNum: 1, keyword: value, name: value.trim() })
    } catch (error) {
      console.error('搜索数据获取失败:', error)
    }
  }

  const handleDelete = async (categoryNo: string) => {
    try {
      const response = (await NewsTypeAPI.delete(categoryNo)) as unknown as ApiResponse
      if (response.success) {
        message.success('删除成功')
        await fetchData()
      } else {
        message.error(response.message || '删除失败')
      }
    } catch (error: any) {
      console.error('删除操作失败:', error)
      message.error(`删除失败: ${error.message || '网络错误'}`)
    }
  }

  const refreshData = async () => {
    try {
      await fetchData()
    } catch (error) {
      console.error('刷新数据失败:', error)
    }
  }

  const resetSearch = async () => {
    setSearchValue('')
    setPagination((prev) => ({ ...prev, current: 1 }))
    try {
      await fetchData({ pageNum: 1, keyword: '' })
    } catch (error) {
      console.error('重置搜索失败:', error)
    }
  }

  useEffect(() => {
    let isMounted = true
    const initializeData = async () => {
      try {
        if (isMounted) {
          await fetchData()
        }
      } catch (error) {
        if (isMounted) {
          console.error('初始化数据失败:', error)
        }
      }
    }
    initializeData()
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
    sortInfo,
    fetchData,
    handleTableChange,
    handleSearch,
    handleDelete,
    refreshData,
    resetSearch,
  }
}

export default useNewsTypeTable
