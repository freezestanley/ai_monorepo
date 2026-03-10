export interface CategoryItem {
  id: number
  categoryNo: string
  name: string
  description: string
  categorySort: number
  enabledStatus: string // 'Y' | 'N'
  gmtCreated: string
  gmtModified: string
  creator: string
}

export interface AddTypeModalProps {
  visible: boolean
  editingRecord: CategoryItem | null
  onOk: () => void
  onCancel: () => void
}
