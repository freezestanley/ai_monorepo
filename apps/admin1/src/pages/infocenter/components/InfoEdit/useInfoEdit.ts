import { useState, useEffect } from "react"
import { Form, message } from "antd"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { InfoAPI, InfoTypeAPI, InfoEditAPI } from "../../api"

interface InfoData {
  newsNo?: string
  title: string
  summary: string
  cover: string
  content: string
  categoryNo: string
  categoryName: string
  publishState: string
  publishStateName: number
}

interface UseInfoEditReturn {
  // 状态
  loading: boolean
  submitLoading: boolean
  typeList: any[]
  mode: "create" | "edit"
  initialData: InfoData | null
  form: any

  // 方法
  handleBack: () => void
  handleSaveDraft: () => Promise<void>
  handlePublish: () => Promise<void>
  handleImageChange: (data: any) => void
  handleImageSuccess: (data: any) => void
}

export const useInfoEdit = (): UseInfoEditReturn => {
  const { newsNo } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [typeList, setTypeList] = useState([])
  const [mode, setMode] = useState<"create" | "edit">(location?.state?.mode || "create")
  const [initialData, setInitialData] = useState<InfoData | null>(location?.state?.record || null)

  // 获取消息类别列表
  const fetchTypeList = async () => {
    try {
      const response = await InfoEditAPI.getListCategory({
        name: "",
        pageNum: 1,
        pageSize: 999,
        sortColumn: "",
        sortType: "desc"
      })
      if (response?.success) {
        setTypeList(response.data.data || [])
      } else {
        message.error("获取类别列表失败")
      }
    } catch (error) {
      console.error("获取类别列表失败:", error)
    }
  }

  // 获取消息详情
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await InfoEditAPI.detail(initialData?.newsNo)
      const { title, categoryNo, summary, content, cover } = response.data
      if (response?.success) {
        form.setFieldsValue({
          title: title,
          categoryNo: categoryNo,
          summary: summary,
          content: content,
          coverImage: cover
        })
      } else {
        message.error("获取类别列表失败")
      }
      // 填充表单
      // form.setFieldsValue({
      //   title: initialData?.title,
      //   categoryNo: initialData?.categoryNo,
      //   summary: initialData?.summary,
      //   content: initialData?.content,
      //   coverImage: initialData?.cover,
      // })
    } catch (error) {
      message.error("获取消息详情失败")
      // navigate("/news-list")
    } finally {
      setLoading(false)
    }
  }

  // 提交处理
  const handleSubmit = async (values: any, successMessage: string) => {
    setSubmitLoading(true)
    try {
      const data = {
        // ...values,
        // id: mode === "edit" ? id : undefined
        title: values?.title,
        newsNo: initialData?.newsNo || "",
        summary: values?.summary,
        cover: values?.coverImage,
        content: values?.content,
        categoryNo: values?.categoryNo,
        publishStateEdit: "wait"
        // publishStateEdit: values?.status === 1 ? 'publish': 'wait',
      }
      let response: any
      if (mode === "edit") {
        response = await InfoEditAPI.update(data)
      } else {
        response = await InfoEditAPI.create(data)
      }

      if (response?.success) {
        message.success(successMessage || (mode === "edit" ? "更新成功" : "创建成功"))
        navigate("/news-list")
      } else {
        message.error(response?.message)
      }
    } catch (error) {
      message.error(mode === "edit" ? "更新失败" : "创建失败")
    } finally {
      setSubmitLoading(false)
    }
  }

  // 返回列表
  const handleBack = () => {
    navigate("/news-list")
  }

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      await handleSubmit({ ...values, status: 0 }, "保存草稿成功")
    } catch (error) {
      console.error("Validation failed:", error)
    }
  }

  // 发布
  const handlePublish = async () => {
    try {
      const values = await form.validateFields()
      await handleSubmit({ ...values, status: 1 }, "发布成功")
    } catch (error) {
      console.error("Validation failed:", error)
    }
  }

  // 图片变化处理
  const handleImageChange = (data: any) => {
    console.log("上传成功的图片数据:", data)
    // setImageData(data)
    // data 包含 temporarySignatureUrl 和 objectKey
  }

  // 图片上传成功处理
  const handleImageSuccess = (data: any) => {
    console.log("上传成功的图片数据:", data)
    // 将上传成功的图片URL设置到表单的coverImage字段
    // ImageUpload组件会自动处理数组格式，这里直接传递data即可
    if (data) {
      form.setFieldsValue({ coverImage: data })
    }
  }

  useEffect(() => {
    fetchTypeList()
  }, [])

  useEffect(() => {
    if (initialData?.newsNo) {
      setMode("edit")
      fetchData()
    } else {
      setMode("create")
    }
  }, [initialData?.newsNo])

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
    handleImageSuccess
  }
}

export default useInfoEdit
