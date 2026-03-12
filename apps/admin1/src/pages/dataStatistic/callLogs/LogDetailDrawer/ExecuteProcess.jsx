import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import {
  fetchCallLogsExecuteProcess,
  fetchCallLogsExecuteProcessForStructureData,
  fetchCallLogsExecuteProcessOrderForStructureData
} from "@/api/userFeedback/api"
import AIAgentExecutionProcess from "@/components/AIAgentExecutionProcess"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import { Button, Spin } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"

export default ({ record, setVisible, isOptimizeOrder }) => {
  const [content, setContent] = useState("")
  const [structureData, SetStructureData] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const recordRequestTime = getRecordRequestTime()
  function getRecordRequestTime() {
    try {
      if (record?.resourceLinks?.length > 0) {
        const extraInfo = record.resourceLinks[0].extraInfo
        if (extraInfo) {
          const parsedExtraInfo = JSON.parse(extraInfo)
          return parsedExtraInfo.requestTime
        }
      }
      return ""
    } catch (error) {
      return ""
    }
  }

  useEffect(() => {
    setIsLoading(true)
    const queryData = {
      botNo: record.botNo,
      skillNo: record.skillNo,
      requestId: record.requestId || record.resourceLinks?.[0]?.resourceNo,
      requestTime: dayjs(recordRequestTime || record.requestTime).format("YYYY-MM-DD HH:mm:ss")
    }
    // fetchCallLogsExecuteProcess(queryData)
    //   .then((res) => {
    //     setContent(res || "") //未获取到执行过程详细内容
    //   })
    //   .finally(() => {
    //     setIsLoading(false)
    //   })

    ;(isOptimizeOrder
      ? fetchCallLogsExecuteProcessOrderForStructureData
      : fetchCallLogsExecuteProcessForStructureData)(queryData).then((res) => {
      SetStructureData(res)
      setIsLoading(false)
    })
  }, [record, isOptimizeOrder])

  return (
    <div className="">
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : structureData && structureData?.componentExecuteProcess?.length > 0 ? (
        <>
          <AIAgentExecutionProcess data={structureData || {}} />
        </>
      ) : (
        <div className="min-h-[70vh] flex items-center justify-center">
          <CustomEmpty description="未获取到执行过程详细内容" />
        </div>
      )}
      <FooterButtons setVisible={setVisible} />
    </div>
  )
}

function FooterButtons({ setVisible }) {
  return (
    <div className="flex justify-end fixed" style={{ bottom: 16, right: 24 }}>
      <div>
        <Button type="primary" onClick={() => setVisible(false)}>
          关闭
        </Button>
      </div>
    </div>
  )
}
