import Iconfont from "@/components/Icon"
import { Divider, Timeline, Typography } from "antd"
import { useState } from "react"
import "./../index.less"
import ImageUploadForCommon from "@/components/ImageUploadForCommon"
import { InfoItem } from "./OptimizeOrder"

// 历史记录组件
function HistoryRecords({ historyList = [], detail }) {
  const [isOpen, setIsOpen] = useState(true)
  console.log("detail", detail)

  return (
    <div className="mb-6">
      <Divider className="my-6 cursor-pointer">
        <div
          className="flex items-center font-normal"
          onClick={() => setIsOpen(!isOpen)}
          style={{ color: "rgba(152, 162, 179, 1)" }}
        >
          <span className="text-[12px]">历史操作及备注</span>
          <Iconfont
            type={"icon-icon14-xiajiantou"}
            className={`mr-2 transition-transform ${!isOpen ? "" : "rotate-[-180deg]"}`}
          />
        </div>
      </Divider>

      <div className={`p-4 rounded history-content ${isOpen ? "open" : ""}`}>
        <Timeline
          items={historyList.map((item) => ({
            color: "#B37FEB",
            children: (
              <div>
                <div className="flex items-center text-[#181B25] font-weight-500">
                  <span>{item.operationTime}</span>
                  <span className="ml-4">{item.operatorDisplayName}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {item.logField?.length > 0 && (
                    <div className="flex flex-wrap gap-8">
                      {item.logField.map((field) => {
                        return (
                          <div
                            key={field.field}
                            className={
                              field.fieldName === "备注图片" || field.fieldName === "备注"
                                ? "w-full"
                                : "w-[calc((100%-64px)/3)]"
                            }
                          >
                            <HistoryItem field={field} detail={detail} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          }))}
        />
      </div>

      {/* {detail.remarkUrls?.length > 0 &&
        !["TO_BE_PROCESS", "PROCESSING"].includes(detail.status?.code) && (
          <div className="ml-[40px]  -mt-[20px]">
            <Typography.Text type="secondary" style={{ color: "#475467" }}>
              备注图片
            </Typography.Text>
            <ImageUploadForCommon readonly={true} detail={detail} value={detail.remarkUrls} />
          </div>
        )} */}
    </div>
  )
}

function HistoryItem({ field, detail }) {
  const maxWidth = field.fieldName === "备注" ? "600px" : "180px"
  if (field.fieldName === "备注图片") {
    return (
      <>
        <Typography.Text type="secondary" style={{ color: "#475467" }}>
          {field.fieldName}
        </Typography.Text>
        <ImageUploadForCommon readonly={true} value={field.newVal} />
      </>
    )
  }
  const value = field.originVal?.length > 0 ? `${field.originVal} → ${field.newVal}` : field.newVal
  return (
    <>
      <InfoItem label={field.fieldName} value={value} maxWidth={maxWidth} />
    </>
  )
}

export default HistoryRecords
