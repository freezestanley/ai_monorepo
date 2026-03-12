import { Drawer, Tabs } from "antd"
import OptimizeOrder from "./OptimizeOrder"
import LogDetail from "./LogDetail"
import ExecuteProcess from "./ExecuteProcess"
import CallChain from "./CallChain"
import { CloseOutlined } from "@ant-design/icons"
import { useMemo, useEffect, useState } from "react"
import { checkEnableExecuteProcess } from "@/api/userFeedback/api"
import dayjs from "dayjs"

export default ({
  visible,
  setVisible,
  record = {},
  tableColumns = [],
  activeTab = "optimize", // 默认激活优化单tab
  setActiveTab,
  titleText = "查看",
  disabled = false,
  refreshTableData,
  from
}) => {
  const [showExecuteProcess, setShowExecuteProcess] = useState(false)

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
    if (visible && record?.botNo) {
      checkEnableExecuteProcess({
        botNo: record.botNo,
        skillNo: record.skillNo || undefined,
        requestId: record.requestId || record.resourceLinks?.[0]?.resourceNo || undefined,
        requestTime: dayjs(recordRequestTime || record.requestTime).format("YYYY-MM-DD HH:mm:ss")
      }).then((result) => {
        setShowExecuteProcess(result === true)
      })
    }
  }, [visible, record, recordRequestTime])

  const itemRecord = useMemo(() => {
    const isOptimizeOrder = from === "optimizeOrder"
    const items = [
      {
        key: "optimize",
        label: "优化单",
        children: (
          <OptimizeOrder
            setVisible={setVisible}
            refreshTableData={refreshTableData}
            record={record}
            disabled={disabled}
          />
        )
      },
      {
        key: "detail",
        label: "日志详情",
        children: (
          <LogDetail
            isOptimizeOrder={isOptimizeOrder}
            setVisible={setVisible}
            record={record}
            tableColumns={tableColumns}
          />
        )
      }
    ]

    if (showExecuteProcess) {
      // 优化单详情页执行过程tab改为调用链tab
      if (isOptimizeOrder) {
        items.push({
          key: "callChain",
          label: "调用链",
          children: <CallChain record={record} />
        })
      } else {
        items.push({
          key: "process",
          label: "执行过程",
          children: (
            <ExecuteProcess
              isOptimizeOrder={isOptimizeOrder}
              setVisible={setVisible}
              record={record}
            />
          )
        })
      }
    }

    // 只有在调用日志页面才显示调用链Tab
    if (from === "callLogs") {
      items.push({
        key: "callChain",
        label: "调用链",
        children: <CallChain record={record} />
      })
    }

    const orderNo = record?._orderNo || record?.optimizationOrder?.orderNo
    if (record?._type === "view" && !orderNo) {
      items.shift()
    }
    return items
  }, [record, tableColumns, disabled, showExecuteProcess, from, setVisible, refreshTableData])

  const currentActiveTab = useMemo(() => {
    // 检查当前activeTab是否在可用的tabs中
    const availableKeys = itemRecord.map((item) => item.key)
    if (availableKeys.includes(activeTab)) {
      return activeTab
    }
    // 如果当前activeTab不可用，则返回第一个可用的tab
    return availableKeys[0]
  }, [activeTab, itemRecord])

  return (
    <Drawer
      open={visible}
      width={820}
      closable={false}
      footer={<div style={{ height: 36 }} />}
      title={
        <div className="flex">
          <div className="flex-1">{titleText}</div>
          <CloseOutlined onClick={() => setVisible(false)} />
        </div>
      }
      styles={{
        body: {
          paddingTop: 0
        }
      }}
    >
      {visible && (
        <Tabs
          defaultActiveKey={currentActiveTab}
          activeKey={currentActiveTab}
          onTabClick={(key) => setActiveTab(key)}
          items={itemRecord}
          tabBarStyle={{
            paddingTop: 16,
            position: "sticky",
            top: 0,
            zIndex: 100,
            backgroundColor: "#fff"
          }}
        />
      )}
    </Drawer>
  )
}
