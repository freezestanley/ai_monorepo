import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { fetchCallLogsExecuteProcess } from "@/api/userFeedback/api"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import { Drawer, Spin } from "antd"
import { useEffect, useState } from "react"

export default ({ visible, setVisible, executeProcessParams = {} }) => {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    if (visible) {
      setIsLoading(true)
      fetchCallLogsExecuteProcess({
        botNo: executeProcessParams.botNo,
        skillNo: executeProcessParams.skillNo,
        requestId: executeProcessParams.requestId
      })
        .then((res) => {
          setContent(res || "") //未获取到执行过程详细内容
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [visible, executeProcessParams])

  return (
    <Drawer open={visible} width={700} title="执行过程" onClose={() => setVisible(false)}>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : content ? (
        <MarkdownRenderer content={content} isLoading={false} />
      ) : (
        <div className="min-h-[70vh] flex items-center justify-center">
          <CustomEmpty description="未获取到执行过程详细内容" />
        </div>
      )}
    </Drawer>
  )
}
