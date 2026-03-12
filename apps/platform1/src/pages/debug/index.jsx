// @ts-nocheck
// DebugPage.jsx
import React, { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Button, Input, message } from "antd"
import { useFetchPromptDetail, useSavePromptDetail } from "@/api/prompt"
import queryString from "query-string"

export const DebugPage = () => {
  const { TextArea } = Input
  const { mutate } = useSavePromptDetail()
  const [textAreaValue, setTextAreaValue] = useState("")

  const location = useLocation()
  const { search } = location
  const { skillNumer, componentNo } = queryString.parse(search)

  const params = {
    skillNo: skillNumer,
    componentNo: componentNo
  }

  const { data, isLoading } = useFetchPromptDetail(params)

  useEffect(() => {
    if (data) {
      setTextAreaValue(data?.content)
    }
  }, [data])

  const handleSaveClick = () => {
    mutate(
      {
        skillNo: skillNumer,
        componentNo: componentNo,
        content: textAreaValue
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success(e.message)
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const handleInputChange = (event) => {
    setTextAreaValue(event.target.value)
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen p-5 bg-gray-200">
      <h1 className="mb-5 text-2xl font-bold text-gray-700">Debug Page</h1>
      <TextArea
        value={textAreaValue}
        onChange={handleInputChange}
        placeholder="Type here..."
        autoSize={{ minRows: 10, maxRows: 2000 }}
        style={{ width: "100vw", height: "1000px!important" }}
      />
      <Button type="primary" onClick={handleSaveClick} className="mt-5" loading={isLoading}>
        Save
      </Button>
    </div>
  )
}

export default DebugPage
