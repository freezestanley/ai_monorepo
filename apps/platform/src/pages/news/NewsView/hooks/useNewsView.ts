import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { NewsListAPI } from '@/api/news'
import type { NewsItem } from '../types'

// The axios interceptor returns response.data directly, so the actual
// resolved value has this shape rather than AxiosResponse.
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

export const useNewsView = () => {
  const { newsNo } = useParams<{ newsNo: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<NewsItem | null>(null)

  const fetchData = useCallback(async () => {
    if (!newsNo) {
      navigate('/news')
      return
    }

    setLoading(true)
    try {
      const response = (await NewsListAPI.getDetail(newsNo)) as unknown as ApiResponse<NewsItem>

      if (response.success) {
        setData(response.data)
      } else {
        message.error(response.message || '获取新闻详情失败')
        navigate('/news')
      }
    } catch (error) {
      console.error('获取新闻详情失败:', error)
      message.error('获取新闻详情失败')
      navigate('/news')
    } finally {
      setLoading(false)
    }
  }, [newsNo, navigate])

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
  }, [newsNo])

  const handleBack = useCallback(() => {
    navigate('/news')
  }, [navigate])

  return {
    loading,
    data,
    handleBack,
  }
}
