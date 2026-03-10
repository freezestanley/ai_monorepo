export interface NewsEditData {
  newsNo?: string
  title: string
  summary: string
  cover: string
  content: string
  categoryNo: string
  publishStateEdit: string
}

export interface CategoryItem {
  categoryNo: string
  name: string
  [key: string]: any
}

export interface UseNewsEditReturn {
  loading: boolean
  submitLoading: boolean
  typeList: CategoryItem[]
  mode: 'create' | 'edit'
  initialData: any
  form: any
  handleBack: () => void
  handleSaveDraft: () => Promise<void>
  handlePublish: () => Promise<void>
  handleImageChange: (data: any) => void
  handleImageSuccess: (data: any) => void
}
