export interface ImageUploadProps {
  maxCount?: number
  listType?: 'text' | 'picture' | 'picture-card' | 'picture-circle'
  onChange?: (data: any) => void
  onFinish?: (data: any) => void
  value?: string
  disabled?: boolean
}
