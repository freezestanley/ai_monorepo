import { useState, useEffect } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import type { TextEditorProps } from './types'

const TextEditor = ({ value, onChange, placeholder = '请输入内容...', disabled = false, height = 400 }: TextEditorProps) => {
  const [editor, setEditor] = useState<IDomEditor | null>(null)

  const toolbarConfig: Partial<IToolbarConfig> = {}

  const editorConfig: Partial<IEditorConfig> = {
    placeholder,
    readOnly: disabled,
  }

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #d9d9d9' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        onChange={(editorInstance) => onChange?.(editorInstance.getHtml())}
        mode="default"
        style={{ height, overflowY: 'hidden' }}
      />
    </div>
  )
}

export default TextEditor
