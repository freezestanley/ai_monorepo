import { useStructureDatasetImportDataExtendResult } from "@/api/structureKnowledge"
import { Card, Progress, Table, Typography } from "antd"
import { useEffect } from "react"
const { Title, Text } = Typography

function DataHandle({
  title,
  status = "active",
  message,
  progress,
  progressName,
  getImportResultStatus
}) {
  useEffect(() => {
    getImportResultStatus()
  }, [])
  return (
    <div className="w-full">
      <Title level={5}>{title}</Title>
      <Card>
        <Progress
          strokeLinecap="butt"
          percent={Math.round(progress)}
          size={["default", 50]}
          // @ts-ignore
          status={status}
        />
        <Text
          style={{
            position: "absolute",
            left: 40,
            top: 40,
            color: status === "exception" ? "#f5222d" : "#fff"
          }}
        >
          {progressName}
        </Text>
      </Card>
    </div>
  )
}

export default DataHandle
