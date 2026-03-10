import { useState, useEffect } from 'react'
import { Form, message } from 'antd'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { NewsEditAPI } from '@/api/news'
import type { NewsEditData, CategoryItem, UseNewsEditReturn } from '../types'

// The axios interceptor returns response.data directly, so the actual
// resolved value has this shape rather than AxiosResponse.
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

export const useNewsEdit = (): UseNewsEditReturn => {
  const { newsNo } = useParams<{ newsNo: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const initialData = (location.state as any) || {}

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [typeList, setTypeList] = useState<CategoryItem[]>([])
  const [mode, setMode] = useState<'create' | 'edit'>('create')

  // Fetch category list for the select dropdown
  const fetchTypeList = async () => {
    try {
      const response = (await NewsEditAPI.getListCategory({
        name: '',
        pageNum: 1,
        pageSize: 999,
        sortColumn: '',
        sortType: 'desc',
      })) as unknown as ApiResponse<{ data: CategoryItem[] }>

      if (response?.success && response.data?.data) {
        setTypeList(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch category list:', error)
    }
  }

  // Fetch existing news data for edit mode
  const fetchData = async (editNewsNo: string) => {
    setLoading(true)
    try {
      const response = (await NewsEditAPI.detail(editNewsNo)) as unknown as ApiResponse<any>

      if (response?.success && response.data) {
        const detail = response.data
        form.setFieldsValue({
          title: detail.title,
          categoryNo: detail.categoryNo,
          summary: detail.summary,
          content: detail.content,
          coverImage: detail.cover,
        })
      } else {
        message.error(response?.message || '获取新闻详情失败')
      }
    } catch (error) {
      message.error('获取新闻详情失败')
    } finally {
      setLoading(false)
    }
  }

  // Submit the form data (shared by save draft and publish)
  const handleSubmit = async (publishStateEdit: string) => {
    try {
      const values = await form.validateFields()
      setSubmitLoading(true)

      const data: NewsEditData = {
        title: values.title,
        newsNo: newsNo || initialData?.newsNo,
        summary: values.summary || '',
        cover: values.coverImage || '',
        content: values.content || '',
        categoryNo: values.categoryNo || '',
        publishStateEdit,
      }

      let response: ApiResponse
      if (mode === 'edit' && (newsNo || initialData?.newsNo)) {
        response = (await NewsEditAPI.update(data)) as unknown as ApiResponse
      } else {
        response = (await NewsEditAPI.create(data)) as unknown as ApiResponse
      }

      if (response?.success) {
        message.success(mode === 'edit' ? '更新成功' : '创建成功')
        navigate('/news-list')
      } else {
        message.error(response?.message || '操作失败')
      }
    } catch (error: any) {
      // Form validation errors are handled by antd, only show network errors
      if (error?.errorFields) return
      message.error('操作失败，请重试')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/news-list')
  }

  const handleSaveDraft = async () => {
    await handleSubmit('wait')
  }

  const handlePublish = async () => {
    await handleSubmit('publish')
  }

  const handleImageChange = (data: any) => {
    console.log('Image change:', data)
  }

  const handleImageSuccess = (data: any) => {
    form.setFieldsValue({ coverImage: data })
  }

  // Load category list on mount
  useEffect(() => {
    fetchTypeList()
  }, [])

  // Determine mode and fetch data if editing
  useEffect(() => {
    if (newsNo || initialData?.newsNo) {
      setMode('edit')
      fetchData(newsNo || initialData.newsNo)
    } else {
      setMode('create')
    }
  }, [newsNo])

  return {
    loading,
    submitLoading,
    typeList,
    mode,
    initialData,
    form,
    handleBack,
    handleSaveDraft,
    handlePublish,
    handleImageChange,
    handleImageSuccess,
  }
}
