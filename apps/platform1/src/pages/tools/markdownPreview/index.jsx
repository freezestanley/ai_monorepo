import { Card, Form, Typography, Input, Space, Col } from "antd"
const { TextArea } = Input
const { Title } = Typography
import MarkdownRenderer from "@/components/MarkdownRenderer"
import { useState } from "react"

function MarkdownPreview() {
  const str =
    '<details open><summary>llm函数开始执行, 入参:</summary>\n\n```\n{\n    "botNo": "b2024101710118594",\n    "option": {\n        "model": "qwen-plus",\n        "prompt": "请将以下中文文本翻译成英文：你好汤普\\n翻译结果："\n    }\n}\n```\n\n</details>\n\n<details><summary>llm函数执行耗时：1.62s, 结果：</summary>\n\n```\n{\n    "data": {\n        "content": "Hello Tom"\n    },\n    "code": "200",\n    "success": true,\n    "message": "操作成功",\n    "serverTime": 1730101607473,\n    "traceId": "ca9cdf506fe60aa02e4de3fe1e30d713"\n}\n```\n</details>'

  const [content, setContent] = useState(str)
  const onMarkdownTextChange = (e) => {
    const text = e.target.value
    setContent(text)
  }

  return (
    <div className="flex items-center h-full">
      <div style={{ margin: "auto" }}>
        <Title level={2} className=" mt-4 mb-4">
          灵犀Markdown 渲染器
        </Title>
        <Space align="start" style={{ height: "100%" }}>
          <TextArea
            value={content}
            rows={20}
            style={{ width: 600, height: "90vh" }}
            placeholder="请输入markdown"
            onChange={onMarkdownTextChange}
          />
          <Card title="渲染结果" style={{ width: 700, height: "90vh", overflowY: "auto" }}>
            {content ? (
              <MarkdownRenderer content={content} isLoading={false} />
            ) : (
              <div className="flex items-center justify-center">请输入markdown</div>
            )}
          </Card>
        </Space>
      </div>
    </div>
  )
}

export default MarkdownPreview
