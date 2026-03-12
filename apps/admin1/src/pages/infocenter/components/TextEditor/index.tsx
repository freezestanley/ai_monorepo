import '@wangeditor/editor/dist/css/style.css'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { message, Spin } from 'antd'
import { fetchUploadFile } from '@/api/common/api'

/**
 * TextEditor 组件的 Props 接口定义
 */
interface TextEditorProps {
  /** 编辑器占位符文本 */
  placeholder?: string
  /** 编辑器内容值 */
  value?: string
  /** 内容变化回调函数 */
  onChange?: (html: string) => void
  /** 编辑器高度 */
  height?: number | string
  /** 是否显示预览区域 */
  showPreview?: boolean
  /** 是否禁用编辑器 */
  disabled?: boolean
  /** 自定义工具栏配置 */
  toolbarConfig?: Partial<IToolbarConfig>
  /** 自定义编辑器配置 */
  editorConfig?: Partial<IEditorConfig>
}

/**
 * 上传响应接口定义
 */
interface UploadResponse {
  temporarySignatureUrl: string
  [key: string]: any
}

/**
 * 富文本编辑器组件
 * 基于 @wangeditor/editor-for-react 实现，支持图片上传、实时预览等功能
 */
const TextEditor: React.FC<TextEditorProps> = React.memo((props) => {
    const {
        placeholder = '请输入内容...',
        value = '',
        onChange,
        height = 500,
        showPreview = true,
        disabled = false,
        toolbarConfig: customToolbarConfig,
        editorConfig: customEditorConfig
    } = props



    // 状态管理
    const [editor, setEditor] = useState<IDomEditor | null>(null)
    const [html, setHtml] = useState(value || '')
    const [uploading, setUploading] = useState(false)
    const previewRef = useRef<HTMLDivElement>(null)

    // 图片上传处理函数
    const handleImageUpload = useCallback(async (file: File, insertFn: Function) => {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response: UploadResponse = await fetchUploadFile(formData)

            if (response?.temporarySignatureUrl) {
                insertFn(response.temporarySignatureUrl, '', response.temporarySignatureUrl)
                message.success('图片上传成功')
            } else {
                throw new Error('上传响应数据格式错误')
            }
        } catch (error: any) {
            console.error('图片上传失败:', error)
            message.error(`图片上传失败: ${error?.message || '未知错误'}`)
        } finally {
            setUploading(false)
        }
    }, [])

    // 上传前校验
    const validateUpload = useCallback((file: File): boolean => {
        const isImage = file.type.startsWith('image/')
        if (!isImage) {
            message.error('只能上传图片文件！')
            return false
        }

        const isLt5M = file.size / 1024 / 1024 < 5
        if (!isLt5M) {
            message.error('图片大小不能超过 5MB！')
            return false
        }

        return true
    }, [])

    // 工具栏配置
    const toolbarConfig: Partial<IToolbarConfig> = useMemo(() => ({
        ...customToolbarConfig
    }), [customToolbarConfig])

    // 编辑器配置
    const editorConfig: Partial<IEditorConfig> = useMemo(() => ({
        placeholder,
        readOnly: disabled,
        MENU_CONF: {
            uploadImage: {
                customUpload: handleImageUpload,
                onBeforeUpload: validateUpload,
                onProgress: (progress: number) => {
                    console.log('上传进度:', progress)
                },
                onError: (file: File, err: any, info: any) => {
                    console.error('上传失败:', file.name, err, info)
                    message.error(`图片上传失败: ${file.name}`)
                    setUploading(false)
                }
            }
        },
        ...customEditorConfig
    }), [placeholder, disabled, handleImageUpload, validateUpload, customEditorConfig])

    // 内容变化处理
    const handleEditorChange = useCallback((editor: IDomEditor) => {
        const newHtml = editor.getHtml()
        setHtml(newHtml)
        if(newHtml != '<p><br></p>') {
            onChange?.(newHtml)
        }
        
    }, [onChange])

    // 监听外部值变化
    useEffect(() => {
        const newValue = value || ''
        console.log('TextEditor value change:', { value, newValue, html })
        if (newValue !== html) {
            console.log('Setting html to:', newValue)
            setHtml(newValue)
        }
    }, [value])

    // 更新预览内容
    useEffect(() => {
        if (showPreview && previewRef.current) {
            previewRef.current.innerHTML = html || ''
        }
    }, [html, showPreview])

    // 编辑器销毁
    useEffect(() => {
        return () => {
            if (editor) {
                editor.destroy()
                setEditor(null)
            }
        }
    }, [editor])

    // 编辑器样式
    const editorStyle: React.CSSProperties = useMemo(() => ({
        height: typeof height === 'number' ? `${height}px` : height,
        overflowY: 'hidden'
    }), [height])

    // 容器样式
    const containerStyle: React.CSSProperties = useMemo(() => ({
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        position: 'relative',
        ...(disabled && { backgroundColor: '#f5f5f5' })
    }), [disabled])

    return (
        <>
            <Spin spinning={uploading} tip="图片上传中...">
                <div style={containerStyle}>
                    <Toolbar
                        editor={editor}
                        defaultConfig={toolbarConfig}
                        mode="default"
                        style={{
                            borderBottom: '1px solid #d9d9d9',
                            backgroundColor: disabled ? '#fafafa' : '#fff'
                        }}
                    />
                    <Editor
                        defaultConfig={editorConfig}
                        value={html}
                        onCreated={setEditor}
                        onChange={handleEditorChange}
                        mode="default"
                        style={editorStyle}
                    />
                </div>
            </Spin>

            {showPreview && (
                <>
                    <div style={{
                        fontSize: '16px',
                        margin: '20px 0 0 0',
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        预览
                    </div>
                    <div
                        style={{
                            marginTop: '15px',
                            padding: '16px',
                            border: '1px solid #f0f0f0',
                            borderRadius: '6px',
                            backgroundColor: '#fafafa',
                            minHeight: '100px'
                        }}
                        ref={previewRef}
                        dangerouslySetInnerHTML={{ __html: html || '' }}
                    />
                </>
            )}
        </>
    )
})

// 设置组件显示名称，便于调试
TextEditor.displayName = 'TextEditor'

export default TextEditor