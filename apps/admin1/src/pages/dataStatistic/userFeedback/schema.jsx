import { currentDayEndSecond, currentDayStartSecond } from "../securityAlarm/schema"

export const getSchema = (groupList = [], tagList = [], sourceList = []) => ({
  type: "object",
  labelWidth: 80,
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
    requestUserLike: {
      title: "用户姓名",
      type: "string",
      span: 8,
      placeholder: "请输入用户姓名"
    },
    timeRange: {
      title: "时间范围",
      span: 8,
      type: "array",
      widget: "RangeTimePicker",
      bind: ["feedbackStartTime", "feedbackEndTime"],
      props: {
        showTime: true,
        defaultValue: [currentDayStartSecond, currentDayEndSecond]
      }
    },
    feedbackSource: {
      title: "反馈来源",
      type: "string",
      widget: "select",
      placeholder: "请选择反馈来源",
      span: 8,
      props: {
        allowClear: true,
        options: sourceList,
        fieldNames: { label: "name", value: "code" }
      }
    },
    feedbackResult: {
      title: "反馈结果",
      type: "number",
      widget: "select",
      placeholder: "请选择反馈结果",
      span: 8,
      props: {
        allowClear: true,
        options: [
          { label: "赞", value: 1 },
          { label: "踩", value: -1 }
        ]
      }
    },
    feedbackTag: {
      title: "反馈标签",
      type: "string",
      widget: "select",
      placeholder: "请选择反馈标签",
      span: 8,
      props: {
        options: tagList,
        allowClear: true,
        fieldNames: { label: "name", value: "code" }
      }
    },
    feedbackDescriptionLike: {
      title: "反馈描述",
      type: "string",
      placeholder: "请输入反馈描述",
      span: 8
    }
  }
})
