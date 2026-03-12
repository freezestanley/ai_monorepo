import React, { useState, useEffect } from "react"
import mermaid from "mermaid"

// 1. 全局初始化配置 (只需执行一次)
mermaid.initialize({
  startOnLoad: false,
  theme: "default", // 可选: 'default', 'forest', 'dark', 'neutral'
  securityLevel: "loose",
  fontFamily: "monospace"
})

const MermaidCode = React.memo(({ code, className }) => {
  const [svg, setSvg] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // 生成唯一ID，防止页面有多个图表时冲突
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`

    const renderDiagram = async () => {
      try {
        if (!code) return

        // 解析并渲染 SVG
        // mermaid.render(id, text) -> 返回 { svg }
        const { svg } = await mermaid.render(id, code)
        setSvg(svg)
        setError("") // 渲染成功，清空错误
      } catch (err) {
        console.error("Mermaid 语法错误:", err)
        // 这里可以自定义错误展示文案
        setError("🔴 无法渲染图表，请检查 Mermaid 语法")
      }
    }

    renderDiagram()
  }, [code]) // 当 code 变化时重新渲染

  // 错误状态展示
  if (error) {
    return (
      <div
        className={`mermaid-error overflow-y-auto ${className || ""}`}
        style={{
          color: "#d32f2f",
          background: "#ffebee",
          padding: "8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontFamily: "monospace",
          border: "1px solid #ffcdd2"
        }}
      >
        <div>{error}</div>
        <div style={{ margin: "4px 0 0 0", opacity: 0.7, width: "100%" }}>{code}</div>
      </div>
    )
  }

  // 成功状态展示
  return (
    <div
      className={`mermaid-container ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ textAlign: "center", margin: "1rem 0" }}
    />
  )
})

export default MermaidCode
