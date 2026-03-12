import { Button, Tag } from "antd"
const excludeFields = ["requestContext", "responseContext"]
import { fetchSessionResponse, fetchQueryOneByOrderResponse } from "@/api/optimize/api"
import { useEffect, useState } from "react"
import { fetchCallLogsColumns } from "@/api/userFeedback/api"
import { PAGE_CODE } from "@/constants/pageCode"
import dayjs from "dayjs"
import CustomDivider from "@/components/CustomDivider"
import { InfoItem } from "./OptimizeOrder"
export default ({ record, tableColumns = [], setVisible, isOptimizeOrder }) => {
  const [columns, setColumns] = useState(tableColumns || [])
  const [currentRecord, setCurrentRecord] = useState(record || {})
  const recordRequestTime = getRecordRequestTime()
  const recordRequestId = record.resourceLinks?.[0]?.resourceNo

  useEffect(() => {
    if (tableColumns.length === 0) {
      getColumns()
    }

    if (!record.requestId && recordRequestId && recordRequestTime) {
      ;(isOptimizeOrder ? fetchQueryOneByOrderResponse : fetchSessionResponse)({
        requestId: recordRequestId,
        requestTime: dayjs(recordRequestTime).format("YYYY-MM-DD HH:mm:ss")
      }).then((res) => {
        setCurrentRecord({ ...res, ...res?.optimizationOrder })
        console.log("res:->", res)
      })
    }
  }, [
    record.requestId,
    record.requestTime,
    tableColumns,
    recordRequestTime,
    recordRequestId,
    isOptimizeOrder
  ])

  function getRecordRequestTime() {
    try {
      return JSON.parse(record?.resourceLinks?.[0]?.extraInfo || "")?.requestTime
    } catch (error) {
      return ""
    }
  }
  async function getColumns() {
    const res = await fetchCallLogsColumns(PAGE_CODE.CALL_LOGS)
    setColumns(res)
  }

  return (
    <div className="">
      <div className="mb-6">
        <CustomDivider>基本信息</CustomDivider>
        <div className="grid grid-cols-2 gap-y-4">
          {columns
            .filter((column) => !excludeFields.includes(column.fieldKey))
            .map((column) => {
              return (
                <InfoItem
                  label={column.fieldName}
                  value={formatRecord(currentRecord, column)}
                  copyable={/id/i.test(column.fieldKey)}
                />
              )
            })}

          <div className="col-span-2">
            <span className="item-title">请求内容</span>
            <div className="item-value whitespace-pre-wrap">
              {currentRecord.requestContext || "- -"}
            </div>
          </div>

          <div className="col-span-2">
            <span className="item-title">返回内容</span>
            <div className="item-value whitespace-pre-wrap">
              {currentRecord.responseContext || "- -"}
            </div>
          </div>
        </div>
      </div>
      <FooterButtons setVisible={setVisible} />
    </div>
  )
}

function formatRecord(currentRecord, column) {
  if (Array.isArray(currentRecord[column.fieldKey])) {
    return currentRecord[column.fieldKey].join("、")
  }
  if (column.enums) {
    const target = column.enums.find((item) => item.value === currentRecord[column.fieldKey])
    console.log("target:", target)

    if (Array.isArray(target)) {
      return ""
    }
    return target?.desc || "- -"
  }

  let value = currentRecord[column.fieldKey]

  if (typeof value === "object" && value?.name) {
    value = value.name
  }

  return value || "- -"
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
