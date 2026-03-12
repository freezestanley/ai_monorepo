import dayjs from "dayjs"
const rangePresets = [
  {
    label: "今天",
    value: [dayjs().endOf("day"), dayjs().endOf("day")]
  },
  {
    label: "最近7天",
    value: [dayjs().add(-7, "d").endOf("day"), dayjs().endOf("day")]
  },
  {
    label: "最近14天",
    value: [dayjs().add(-14, "d").endOf("day"), dayjs().endOf("day")]
  },
  {
    label: "最近30天",
    value: [dayjs().add(-30, "d").endOf("day"), dayjs().endOf("day")]
  }
]

function getSchema(groupList = [], botList = [], startTime, endTime, botNo, iframeStyle) {
  const hidden = botNo && iframeStyle == "true"
  const schema = {
    type: "object",
    labelWidth: 80,
    properties: {
      timeRange: {
        title: "时间范围",
        span: 8,
        type: "array",
        widget: "RangeTimePicker",
        bind: ["startTime", "endTime"],
        props: {
          defaultValue: [startTime, endTime],
          allowClear: false,
          presets: rangePresets
        }
      },
      tagNo: {
        hidden,
        title: "标签",
        type: "string",
        widget: "select",
        placeholder: "请选择标签",
        span: 8,
        props: {
          options: groupList,
          showSearch: true,
          allowClear: true,
          filterOption: (input, option) => {
            return (option?.name ?? "").toLowerCase().includes(input.toLowerCase())
          },
          fieldNames: { label: "name", value: "permissionGroupNo" }
        }
      },
      botNo: {
        hidden,
        title: "空间",
        type: "string",
        widget: "select",
        placeholder: "请选择空间",
        span: 8,
        props: {
          options: botList,
          showSearch: true,
          allowClear: true,
          filterOption: (input, option) => {
            return (option?.botName ?? "").toLowerCase().includes(input.toLowerCase())
          },
          fieldNames: { label: "botName", value: "botNo" }
        }
      }
    }
  }
  return schema
}

export default getSchema
