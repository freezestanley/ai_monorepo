import { useState, useEffect } from "react"
import { Button } from "antd"
import { useCallback } from "react"
import dayjs from "dayjs"

// 注意：需要安装 rsuite 库和样式
// 使用 pnpm 安装：pnpm add rsuite
import DateRangePicker from "rsuite/DateRangePicker"
import "rsuite/DateRangePicker/styles/index.css"
import { DateTimeFormats } from "./locale"
import "./theme.scss"

const DEFAULT_RANGE_KEY = "最近7天"

const RangeTimePicker = ({
  onChange,
  defaultValue,
  value: propValue,
  isSecond = false,
  ...restProps
}) => {
  // 默认值为最近7天
  const defaultRange = [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")]

  const [internalValue, setInternalValue] = useState(defaultValue || defaultRange)
  const [activePreset, setActivePreset] = useState(DEFAULT_RANGE_KEY)

  // 判断是否为受控组件
  const isControlled = propValue !== undefined
  const value = isControlled ? propValue : internalValue

  useEffect(() => {
    // 仅在非受控模式下，且 defaultValue 有效变化时更新
    if (!isControlled && defaultValue) {
      setInternalValue(defaultValue)
      // 如果传入的默认值正好匹配某个预设，就设置对应的activePreset
      rangePresets.forEach((preset) => {
        if (
          defaultValue?.[0]?.isSame(preset.value[0], "day") &&
          defaultValue?.[1]?.isSame(preset.value[1], "day")
        ) {
          setActivePreset(preset.label)
        }
      })
    }
  }, [defaultValue, isControlled])

  const handleChange = useCallback(
    (val) => {
      if (!val || val.length !== 2) return

      // 将 rsuite 的 Date 对象转换为 dayjs 对象，保留用户选择的时分秒
      let dayjsVal = null
      if (isSecond) {
        dayjsVal = [dayjs(val[0]), dayjs(val[1])]
      } else {
        dayjsVal = [dayjs(val[0]).startOf("day"), dayjs(val[1]).endOf("day")]
      }

      // 非受控模式下更新内部状态
      if (!isControlled) {
        setInternalValue(dayjsVal)
      }

      // 触发 onChange 回调，这样点击预设选项时也会触发
      onChange?.(dayjsVal)
      setActivePreset(null)
    },
    [onChange, isControlled, isSecond]
  )

  const handleOk = useCallback(
    (val) => {
      if (!val || val.length !== 2) return

      // 将 rsuite 的 Date 对象转换为 dayjs 对象，保留用户选择的时分秒
      let dayjsVal = null
      if (isSecond) {
        dayjsVal = [dayjs(val[0]), dayjs(val[1])]
      } else {
        dayjsVal = [dayjs(val[0]).startOf("day"), dayjs(val[1]).endOf("day")]
      }

      // 非受控模式下更新内部状态
      if (!isControlled) {
        setInternalValue(dayjsVal)
      }

      onChange?.(dayjsVal)
      setActivePreset(null)
    },
    [onChange, isControlled, isSecond]
  )

  const rangePresets = [
    { label: "今天", value: [dayjs().startOf("day"), dayjs().endOf("day")] },
    { label: "最近7天", value: [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")] },
    {
      label: "最近14天",
      value: [dayjs().subtract(13, "day").startOf("day"), dayjs().endOf("day")]
    },
    {
      label: "最近30天",
      value: [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")]
    }
  ]

  // 准备 RSuite 需要的预设格式（Date 对象数组）
  const prepareRsuiteRanges = () => {
    return rangePresets.map((preset) => ({
      label: preset.label,
      value: [preset.value[0].toDate(), preset.value[1].toDate()]
    }))
  }

  return (
    <div className="flex">
      <DateRangePicker
        {...restProps}
        editable={true}
        cleanable={false}
        preventOverflow={true}
        locale={DateTimeFormats}
        placeholder="请选择筛选日期范围"
        onChange={handleChange}
        onOk={handleOk}
        ranges={prepareRsuiteRanges()}
        format={isSecond ? "yyyy年MM月dd日 HH:mm:ss" : "yyyy年MM月dd日"}
        showMeridian={false}
        value={[value[0].toDate(), value[1].toDate()]} // 直接传递 Date 对象
        className="ml-2 w-[380px]"
      />
    </div>
  )
}

export default RangeTimePicker
