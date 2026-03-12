import { useState, useEffect, useRef } from "react"
import { Button, Input, Tag, Typography } from "antd"

const TagAddInput = ({ onChange, initValue }) => {
  const [inputVisible, setInputVisible] = useState(false)
  const [tags, setTags] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [editInputIndex, setEditInputIndex] = useState(-1)
  const [editInputValue, setEditInputValue] = useState("")
  const editInputRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    onChange?.(tags)
  }, [tags])

  useEffect(() => {
    setTags(initValue || [])
  }, [initValue])

  const handleClose = (index) => {
    const newTags = tags.filter((tag, i) => i !== index)
    setTags(newTags)
  }

  const handleEditInputConfirm = () => {
    const newTags = [...tags]
    newTags[editInputIndex] = editInputValue
    setTags(newTags)
    setEditInputIndex(-1)
    setEditInputValue("")
  }

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      setTags([...tags, inputValue])
    }
    setInputVisible(false)
    setInputValue("")
  }

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus()
    }
  }, [inputVisible])

  useEffect(() => {
    editInputRef.current?.focus()
  }, [editInputValue])

  return (
    <div className="flex items-center">
      {tags.map((tag, index) => {
        if (editInputIndex === index) {
          return (
            <Input
              ref={editInputRef}
              key={tag}
              size="small"
              className="w-[100px] h-[24px] mr-[8px]"
              value={editInputValue}
              onChange={(e) => setEditInputValue(e.target.value)}
              onBlur={handleEditInputConfirm}
              onPressEnter={handleEditInputConfirm}
            />
          )
        }
        return (
          <Tag
            key={tag}
            className="flex"
            closable
            style={{ userSelect: "none" }}
            onClose={() => handleClose(index)}
          >
            <Typography.Paragraph
              className="!m-0 max-w-[100px]"
              ellipsis={{ rows: 1, tooltip: tag }}
              onDoubleClick={(e) => {
                setEditInputIndex(index)
                setEditInputValue(tag)
                e.preventDefault()
              }}
            >
              {tag}
            </Typography.Paragraph>
          </Tag>
        )
      })}
      {inputVisible ? (
        <Input
          className="w-[100px] h-[24px]"
          ref={inputRef}
          size="small"
          placeholder="请输入关键词"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
      ) : (
        <Button
          size="small"
          className="!w-[24px] !h-[24px] !p-0"
          onClick={() => setInputVisible(true)}
        >
          +
        </Button>
      )}
    </div>
  )
}

export default TagAddInput
