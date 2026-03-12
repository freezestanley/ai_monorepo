import dayjs from "dayjs"

export const currentDayStartSecond = dayjs().startOf("day") // 00:00:00
export const currentDayEndSecond = dayjs().endOf("day") // 23:59:59

export const getSchema = (groupList = []) => ({
  type: "object",
  labelWidth: 90,
  properties: {
    authPermissionGroupNo: {
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
    botNameLike: {
      title: "空间",
      type: "string",
      span: 8,
      placeholder: "请输入空间名称"
    },
    requestContextLike: {
      title: "请求内容",
      type: "string",
      placeholder: "请输入请求内容",
      span: 8
    },
    securityWord: {
      title: "命中敏感词",
      type: "string",
      placeholder: "请输入命中敏感词",
      span: 8
    },
    requestUserLike: {
      title: "请求人",
      type: "string",
      placeholder: "请输入请求人",
      span: 8
    },
    timeRange: {
      title: "时间范围",
      span: 8,
      type: "array",
      widget: "RangeTimePicker",
      bind: ["startTime", "endTime"],
      props: {
        showTime: true,
        defaultValue: [currentDayStartSecond, currentDayEndSecond]
      }
    }
  }
})
