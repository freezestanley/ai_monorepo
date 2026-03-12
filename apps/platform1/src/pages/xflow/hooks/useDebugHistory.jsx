import { useRef, useState } from "react"
import { Button, Popover, Space, Table, Tooltip, Typography } from "antd"
import { useHistoryDebugData } from "@/store/index"
import { DEBUG_HISTORY_DATA_CONFIG } from "@/constants"
import dayjs from "dayjs"
import Iconfont from "@/components/Icon"

function DebugPopoverButton({
  historyDebugPopoverChange,
  historyDebugColumns,
  historyDebugDataItems,
  historyDebugPopoverVisible
}) {
  return (
    <Popover
      content={
        <Table
          style={{ width: "650px" }}
          size="small"
          columns={historyDebugColumns}
          dataSource={historyDebugDataItems}
          pagination={false}
        />
      }
      open={historyDebugPopoverVisible}
      onOpenChange={historyDebugPopoverChange}
      trigger="click"
    >
      <div className="flex items-center cursor-pointer  color-[#475467]">
        <Iconfont type="icon-lishijilu" className="mr-2" />
        <span className="text-[14px]">历史数据</span>
      </div>
    </Popover>
  )
}
function UseDebugHistory({ skillNo, setFormData }) {
  const dynamicFormRef = useRef()
  const [historyDebugDataItems, setHistoryDebugDataItems] = useState([])
  const [historyDebugPopoverVisible, setHistoryDebugPopoverVisible] = useState(false)
  const { debugData = {} } = useHistoryDebugData((state) => state)
  const now = new Date().getTime()
  const fiveDaysAgo = now - DEBUG_HISTORY_DATA_CONFIG.STORE_EXPIRE_TIME
  const onHistoryDebugClick = () => {
    setHistoryDebugPopoverVisible(true)
    const data =
      debugData[skillNo]
        ?.map((item) => {
          const { __time, ...rest } = item
          if (now - __time < fiveDaysAgo) {
            return { key: __time, label: JSON.stringify(rest) }
          }
          return null
        })
        .filter(Boolean) || []
    setHistoryDebugDataItems(data)
  }

  const historyDebugPopoverChange = (newOpen) => {
    setHistoryDebugPopoverVisible(newOpen)
    if (newOpen) {
      onHistoryDebugClick()
    }
  }
  const historyDebugColumns = [
    {
      title: "时间",
      dataIndex: "key",
      key: "key",
      width: "30px",
      render: (text, record) => {
        return (
          <Tooltip title={dayjs(text).format("YYYY-MM-DD HH:mm:ss")}>
            <span>{dayjs(text).format("HH:mm:ss")}</span>
          </Tooltip>
        )
      }
    },
    {
      title: "调试数据",
      dataIndex: "label",
      key: "label",
      width: 350,
      textWrap: "word-break",
      render: (text = {}, record) => {
        const testJson = JSON.parse(text)
        const str = Object.keys(testJson).map((key) => {
          return `${key}: ${testJson[key]}`
        })
        return (
          <Tooltip title={<div dangerouslySetInnerHTML={{ __html: str.join("<br />") }} />}>
            <Typography.Paragraph style={{ whiteSpace: "normal" }} ellipsis={{ rows: 3 }}>
              {str}
            </Typography.Paragraph>
          </Tooltip>
        )
      }
    },
    {
      title: "操作",
      key: "operate",
      width: "30px",
      render: (text, record) => {
        return (
          <Button
            size="small"
            type="primary"
            onClick={() => {
              const values = JSON.parse(record.label)
              if (setFormData) {
                setFormData(values)
              } else {
                dynamicFormRef?.current?.setFormData(values)
              }
              setHistoryDebugPopoverVisible(false)
            }}
          >
            使用
          </Button>
        )
      }
    }
  ]

  return {
    dynamicFormRef,
    DebugPopoverButton: () => {
      return DebugPopoverButton({
        historyDebugPopoverChange,
        historyDebugColumns,
        historyDebugDataItems,
        historyDebugPopoverVisible
      })
    }
  }
}

export default UseDebugHistory
