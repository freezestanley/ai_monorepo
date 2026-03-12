import dayjs from "dayjs"

export const currentDayStartSecond = dayjs().subtract(7, "days").startOf("day") // 7 days ago 00:00:00
export const currentDayEndSecond = dayjs().endOf("day") // today 23:59:59

// 是否成功枚举, 0: 失败, 1: 成功
export const successEnum = [
  { label: "是", value: 1 },
  { label: "否", value: 0 }
]

const ranges = {
  今天: [dayjs().startOf("day"), dayjs().endOf("day")],
  最近7天: [dayjs().subtract(7, "days").startOf("day"), dayjs().endOf("day")],
  最近14天: [dayjs().subtract(14, "days").startOf("day"), dayjs().endOf("day")],
  最近30天: [dayjs().subtract(30, "days").startOf("day"), dayjs().endOf("day")]
}

export const getSchema = (groupList = [], { botNo, iframeStyle, startTime, endTime }) => {
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
        default:
          startTime && endTime
            ? [dayjs(startTime), dayjs(endTime)]
            : [currentDayStartSecond, currentDayEndSecond],
        props: {
          showTime: true,
          defaultValue:
            startTime && endTime
              ? [dayjs(startTime), dayjs(endTime)]
              : [currentDayStartSecond, currentDayEndSecond]
        }
      }
    }
  }
}
