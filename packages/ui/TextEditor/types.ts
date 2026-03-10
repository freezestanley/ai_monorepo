export interface TextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  disabled?: boolean
  height?: number
}
