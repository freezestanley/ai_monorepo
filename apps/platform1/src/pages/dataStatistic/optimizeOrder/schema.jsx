import dayjs from "dayjs"

export const currentDayStartSecond = dayjs().subtract(6, "days").startOf("day") // 7天前的 00:00:00
export const currentDayEndSecond = dayjs().endOf("day") // 今天的 23:59:59

// 预定义时间范围
export const TIME_RANGES = {
  今天: () => [dayjs().startOf("day"), dayjs().endOf("day")],
  最近7天: () => [dayjs().subtract(6, "days").startOf("day"), dayjs().endOf("day")],
  最近14天: () => [dayjs().subtract(13, "days").startOf("day"), dayjs().endOf("day")],
  最近30天: () => [dayjs().subtract(29, "days").startOf("day"), dayjs().endOf("day")]
}

// 是否成功枚举, 0: 失败, 1: 成功
export const successEnum = [
  { label: "是", value: 1 },
  { label: "否", value: 0 }
]

export const getSchema = (groupList = [], { botNo, iframeStyle }) => {
  const hidden = botNo && iframeStyle == "true"
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
        default: [currentDayStartSecond, currentDayEndSecond],
        props: {
          showTime: true
        }
      }
    }
  }
}
