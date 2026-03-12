import { useCallback, useEffect, useState } from "react"
import { Tooltip, Spin, Typography } from "antd"
import { useViewDocument } from "@/api/knowledge"
import PDFViewer from "@/components/PDFViewer"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import { CodeEditor } from "@/components/CodeEditor"

function parseFileInfo(url) {
  try {
    // 创建URL对象
    const urlObj = new URL(url)

    // 获取路径部分
    const pathname = urlObj.pathname

    // 获取查询参数
    const search = urlObj.search

    // 从路径中提取文件名（带扩展名）
    const fullFileName = pathname.split("/").pop() || ""

    // 分离文件名和格式
    const lastDotIndex = fullFileName.lastIndexOf(".")
    const fileName = fullFileName
    const fileFormat = lastDotIndex !== -1 ? fullFileName.substring(lastDotIndex + 1) : ""

    // 获取不包含域名的路径，并保留查询参数
    const pathWithoutDomain = "/knowledge-oss" + pathname + search

    return {
      fileName,
      fileFormat: fileFormat?.toLowerCase(),
      pathWithoutDomain
    }
  } catch (error) {
    console.error("URL解析失败:", error)
    return {
      fileName: "",
      fileFormat: "",
      pathWithoutDomain: ""
    }
  }
}

const viewContentFormat = ["html", "txt", "md", "json"]
const previewFormat = ["pdf", "jpeg", "jpg", "png", "gif", ...viewContentFormat]

const FilePreview = ({ knowledgeBaseNo, currentData }) => {
  const { mutate: viewDocument, isLoading } = useViewDocument()
  const [fileData, setFileData] = useState(null)
  const [fileContent, setFileContent] = useState("")

  // 获取内容
  const fetchFileContent = async (url, fileExtension) => {
    try {
      const response = await fetch(url)
      let content

      // 根据文件扩展名选择不同的处理方式
      if (fileExtension === "txt") {
        // 对于 txt 文件，使用特定编码解析
        const buffer = await response.arrayBuffer()
        const decoder = new TextDecoder("GBK") // 或其他适合的编码
        content = decoder.decode(buffer)
      } else if (fileExtension === "json") {
        // 对于 JSON 文件，直接使用 json() 方法
        const jsonData = await response.json()
        content = JSON.stringify(jsonData, null, 2)
      } else {
        // 对于 HTML、MD 等其他文件，默认使用 UTF-8
        content = await response.text()
      }

      setFileContent(content)
    } catch (error) {
      console.error("获取内容失败:", error)
    }
  }

  const getFileUrl = useCallback(() => {
    if (!currentData) return
    viewDocument(
      {
        knowledgeBaseNo,
        catalogNo: currentData?.catalogNo,
        documentNo: currentData?.documentNo
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            const parsedData = parseFileInfo(e.data || "")
            setFileData({
              ...parsedData,
              url: e.data
            })

            // 获取内容
            if (viewContentFormat.includes(parsedData.fileFormat)) {
              fetchFileContent(parsedData.pathWithoutDomain, parsedData.fileFormat)
            }
          }
        }
      }
    )
  }, [viewDocument, knowledgeBaseNo, currentData])

  useEffect(() => {
    getFileUrl()
  }, [getFileUrl])

  return (
    <div className="ml-[4px] bg-white h-[100%] rounded-tl-[8px] rounded-tr-[8px]">
      <div
        className="rag-flow-header"
        style={"pdf" === fileData?.fileFormat ? { marginBottom: 0 } : {}}
      >
        原文件预览
      </div>
      <Spin spinning={isLoading}>
        {previewFormat.includes(fileData?.fileFormat) ? (
          <>
            {["pdf", ...viewContentFormat].includes(fileData?.fileFormat) ? (
              <>
                {"pdf" === fileData?.fileFormat && !!fileData?.pathWithoutDomain && (
                  <PDFViewer fileUrl={fileData?.pathWithoutDomain} height={"calc(100vh - 140px)"} />
                )}
                {["html", "txt"].includes(fileData?.fileFormat) && !!fileContent && (
                  <div
                    className="overflow-auto mx-[20px] whitespace-pre-wrap"
                    style={{ height: "calc(100vh - 160px)" }}
                    dangerouslySetInnerHTML={{ __html: fileContent }}
                  />
                )}
                {"md" === fileData?.fileFormat && !!fileContent && (
                  <MarkdownRenderer className="overflow-auto mx-[20px]" content={fileContent} />
                )}
                {"json" === fileData?.fileFormat && !!fileContent && (
                  <CodeEditor
                    codeContent={fileContent}
                    miniStyle={{ util: { display: "none" }, editor: { margin: "0 20px" } }}
                    height="calc(100vh - 170px)"
                    editable={false}
                  />
                )}
              </>
            ) : (
              <div className="mx-[20px] overflow-auto" style={{ height: "calc(100vh - 160px)" }}>
                <img src={fileData?.url} className="w-full" />
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#F5F7FA] flex items-center justify-between mx-[20px] p-[8px]">
            <Typography.Paragraph
              className="text-[#181B25] text-[14px] font-medium !mb-0 mr-2"
              ellipsis={{ rows: 1, tooltip: fileData?.fileName }}
            >
              {fileData?.fileName}
            </Typography.Paragraph>
            {!!fileData?.url && (
              <Tooltip title="该文件不支持预览，请点击下载">
                <span
                  className="iconfont icon-xiazai cursor-pointer"
                  onClick={() => window.open(fileData?.url)}
                />
              </Tooltip>
            )}
          </div>
        )}
      </Spin>
    </div>
  )
}

export default FilePreview
