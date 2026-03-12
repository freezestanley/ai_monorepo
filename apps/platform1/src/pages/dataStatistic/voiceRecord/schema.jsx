import dayjs from "dayjs"
import queryString from "query-string"

export const currentDayStartSecond = dayjs().subtract(6, "days").startOf("day") // 7天前的 00:00:00
export const currentDayEndSecond = dayjs().endOf("day") // 今天的 23:59:59

export const getSchema = (startTime, endTime) => {
  // 如果有URL参数，使用参数值作为默认值
  // 支持字符串格式的时间参数，如 "2025-09-03 00:00:00" 和 "2025-09-16 23:59:59"
  const defaultStartTime = startTime
    ? typeof startTime === "string"
      ? dayjs(startTime)
      : dayjs(startTime)
    : currentDayStartSecond
  const defaultEndTime = endTime
    ? typeof endTime === "string"
      ? dayjs(endTime).endOf("day")
      : dayjs(endTime).endOf("day")
    : currentDayEndSecond

  return {
    type: "object",
    labelWidth: 90,
    properties: {
      timeRange: {
        // title: "时间范围",
        span: 8,
        type: "array",
        widget: "RangeTimePicker",
        bind: ["startTime", "endTime"],
        default: [defaultStartTime, defaultEndTime],
        props: {
          showTime: true,
          defaultValue: [defaultStartTime, defaultEndTime]
        }
      }
    }
  }
}
