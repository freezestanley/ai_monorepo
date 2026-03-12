import { Typography, Input, Space, Splitter } from "antd"
const { TextArea } = Input
const { Title } = Typography
import MermaidDiagram from "@/components/MermaidDiagram"
import { useState } from "react"

function DiagramPreview() {
  const chartDefinition = `
  graph TD
  A["<div data-id='my-custom-id-1'>Client</div>"] --> B["<div data-id='my-custom-id-2'>Load Balancer</div>"]
  B["<div data-id='my-custom-id-2'>Load Balancer</div>"] --> C["<div data-id='my-custom-id-3'>Server1</div>"]
  B --> D[Server2]
`

  const [content, setContent] = useState(chartDefinition)
  const onMarkdownTextChange = (e) => {
    const text = e.target.value
    setContent(text)
  }

  return (
    <div className="flex items-center h-full">
      <div style={{ margin: "auto" }}>
        <Title level={2} className=" mt-4 mb-4">
          灵犀图表（流程图、时序图等） 渲染器
        </Title>
        <Splitter
          style={{
            width: "100vw",
            height: "calc(100vh - 74px)",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)"
          }}
        >
          <Splitter.Panel defaultSize="450" min="300" max="800">
            <TextArea
              value={content}
              rows={20}
              style={{ height: "100%" }}
              placeholder="请输入markdown"
              onChange={onMarkdownTextChange}
            />
          </Splitter.Panel>
          <Splitter.Panel>
            <MermaidDiagram diagramDefinition={content} />
          </Splitter.Panel>
        </Splitter>
        <Space align="start" style={{ height: "100%" }}></Space>
      </div>
    </div>
  )
}
export default DiagramPreview
