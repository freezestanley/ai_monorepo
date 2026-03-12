import React from "react"
import "./AILoading.scss"
import { LoadingOutlined } from "@ant-design/icons"

const AILoading = () => {
  return (
    <div className="ai-loading">
      <div className="ai-loading-text">
        <LoadingOutlined className="mr-2 text-[#7f56d9]" />
        AI生成中...
      </div>
    </div>
  )
}

export default AILoading
