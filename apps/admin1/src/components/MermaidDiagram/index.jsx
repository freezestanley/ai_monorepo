import { useEffect, useState } from "react"
import mermaid from "mermaid"
import { Empty, Typography } from "antd"
import { CoffeeOutlined } from "@ant-design/icons"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
const MermaidChart = ({ diagramDefinition: chartDefinition, onParseError, waitingTip = "" }) => {
  const [svg, setSvg] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // 初始化 Mermaid，只调用一次
    mermaid.initialize({ startOnLoad: false })

    const renderChart = async () => {
      try {
        // 解析图表定义
        const parseResult = await mermaid.parse(chartDefinition)
        if (!parseResult) {
          throw new Error("语法定义错误")
        }

        // 渲染图表
        const { svg: renderedSvg } = await mermaid.render("chart", chartDefinition)
        setSvg(renderedSvg)
        setError(null)
      } catch (err) {
        setError(err)
        if (onParseError) {
          onParseError(err)
        }
      }
    }

    renderChart()
  }, [chartDefinition, onParseError])

  if (!chartDefinition) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty
          image={<CoffeeOutlined style={{ fontSize: 80, color: "#ccc" }} />}
          description={
            <Typography.Text>
              {waitingTip || (
                <>
                  请输入图表定义，参考文档：
                  <a
                    href="https://mermaid.js.org/intro/syntax-reference.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    mermaid
                  </a>
                </>
              )}
            </Typography.Text>
          }
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="error" style={{ color: "red" }}>
          <p>报错了：</p>
          {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center w-full" style={{ padding: "48px 12px 12px 12px" }}>
      <TransformWrapper>
        <TransformComponent wrapperStyle={{ width: "100%" }} contentStyle={{ width: "100%" }}>
          <div
            className="flex justify-center w-full max-w-full cursor-grabbing"
            style={{ height: "calc(100vh - 124px)" }}
            dangerouslySetInnerHTML={{ __html: svg || "" }}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}

export default MermaidChart
