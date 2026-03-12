import React, { useCallback } from "react"
import { Table, Typography, Space } from "antd"
import { CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { postMessageForLX } from "@/utils"
import { MessageType } from "@/constants/postMessageType"
import { useSearchParams } from "react-router-dom"

const { Text } = Typography

interface DataType {
  key: string
  rank: number
  problemCategoryId: number
  clusterName: string
  category: string
  problemSessionCount: number
  seatCount: number
  Trend: number
  clusterId?: number
}

interface IProps {
  formValues: any
  taskId: number
  stageId: number
  clusterId: number
  Problemclusters: any
  currentStage: any
  selectedTask: number
}

const LeakingTable: React.FC<IProps> = (props: IProps) => {
  const { formValues, taskId, stageId, clusterId, Problemclusters, currentStage, selectedTask } =
    props

  const [searchParams] = useSearchParams()
  const queryParams = Object.fromEntries(searchParams.entries())
  const { testMode } = queryParams

  const { stageName } = currentStage || {}

  // console.log("ProblemClusters", Problemclusters)
  const sortedData = Problemclusters?.sort(
    (a, b) => b.problemSessionCount - a.problemSessionCount
  )?.map((cluster, index) => ({ ...cluster, key: cluster.clusterId, rank: index + 1 }))

  const getRankBadgeStyle = (rank: number) => {
    if (rank <= 3) {
      return {
        backgroundColor: rank === 1 ? "#fef9c3" : rank === 2 ? "#F5F5F5" : "#FFF7E6",
        color: rank === 1 ? "#a16207" : rank === 2 ? "#8C8C8C" : "#c4430f",
        border: `1px solid ${rank === 1 ? "#fef293" : rank === 2 ? "#D9D9D9" : "#FFD591"}`
      }
    }
    return {
      backgroundColor: "#f3f4f6",
      color: "#8C8C8C",
      border: "none"
    }
  }

  const navigateToOptimization = useCallback(
    (problemCategoryId: number, clusterId: number) => {
      // 通知灵眸跳转到优化建议中心
      postMessageForLX({
        type: testMode
          ? MessageType.NAVIGATE_TO_FLYWHEEL
          : MessageType.NAVIGATE_TO_OPTIMIZATION_FROM_ARKCES,
        payload: {
          startTime: formValues.startTime.format("YYYY-MM-DD 00:00:00"),
          endTime: formValues.endTime.format("YYYY-MM-DD 23:59:59"),
          taskId: selectedTask, // task
          name: problemCategoryId, // 问题(stage)
          clusterId // cluster
        }
      })
    },
    [taskId, stageId, formValues, selectedTask]
  )

  const columns: ColumnsType<DataType> = [
    {
      title: "排名",
      dataIndex: "rank",
      key: "rank",
      width: 60,
      render: (rank: number) => (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 6,
            fontWeight: 500,
            fontSize: 14,
            ...getRankBadgeStyle(rank)
          }}
        >
          {rank}
        </div>
      )
    },
    {
      title: "风险点名称",
      dataIndex: "clusterName",
      key: "clusterName",
      width: 160,
      render: (text: string, record: DataType) => (
        <Space direction="vertical" size={0}>
          <Text className="text-md color-[#262626] font-bold">{text}</Text>
          <Text type="secondary" className="text-xs">
            {stageName}
          </Text>
        </Space>
      )
    },
    {
      title: "频次",
      dataIndex: "problemSessionCount",
      key: "problemSessionCount",
      width: 50,
      sorter: (a, b) => a.problemSessionCount - b.problemSessionCount,
      defaultSortOrder: "descend",
      render: (value: number) => <Text className="text-sm color-[#262626] font-bold">{value}</Text>
    },
    {
      title: "人数",
      dataIndex: "seatCount",
      key: "seatCount",
      width: 50,
      sorter: (a, b) => a.seatCount - b.seatCount,
      render: (value: number) => <Text className="text-sm color-[#262626]">{value}</Text>
    },
    {
      title: "趋势",
      dataIndex: "Trend",
      key: "Trend",
      width: 100,
      sorter: (a, b) => a.Trend - b.Trend,
      render: (value: number) => {
        const isPositive = value > 0
        const color = isPositive ? "#FF4D4F" : "#52C41A"
        return (
          <Space size={4}>
            {isPositive ? (
              <CaretUpOutlined style={{ color, fontSize: 12 }} />
            ) : (
              <CaretDownOutlined style={{ color, fontSize: 12 }} />
            )}
            <Text style={{ color, fontSize: 13, fontWeight: 500 }}>{Math.abs(value)}%</Text>
          </Space>
        )
      }
    },
    {
      title: "操作",
      dataIndex: "action",
      key: "action",
      width: 90,
      fixed: "right",
      render: (text: string, record: DataType) => (
        <a
          className="text-sm color-[#262626]"
          onClick={() => navigateToOptimization(record?.problemCategoryId, record?.clusterId)}
        >
          {"去优化"}
        </a>
      )
    }
  ]

  return (
    <div>
      <div className="mb-2">
        <Text className="text-lg font-bold">风险排行榜</Text>
      </div>

      <Table
        columns={columns}
        dataSource={sortedData}
        pagination={false}
        bordered={false}
        scroll={{ y: 760 }}
        components={{
          header: {
            cell: (props: any) => (
              <th {...props} style={{ ...props.style, fontSize: 14, fontWeight: 600 }} />
            )
          }
        }}
      />
    </div>
  )
}

export default LeakingTable
