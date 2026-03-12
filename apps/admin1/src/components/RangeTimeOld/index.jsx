import { useState, useEffect } from "react"
import { DatePicker, Button } from "antd"
import { useCallback } from "react"
import dayjs from "dayjs"

const { RangePicker } = DatePicker

const DEFAULT_RANGE_KEY = "最近7天"
const DEFAULT_RANGE = [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")]

const RangeTimePicker = ({ onChange, defaultValue, isSecond = false, ...restProps }) => {
  const [dates, setDates] = useState(null)
  const [value, setValue] = useState(DEFAULT_RANGE)
  const [activePreset, setActivePreset] = useState(DEFAULT_RANGE_KEY)

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue)
      // 如果传入的默认值正好匹配某个预设，就设置对应的activePreset
      Object.entries(rangePresets).forEach(([key, preset]) => {
        if (
          defaultValue?.[0]?.isSame(preset[0], "day") &&
          defaultValue?.[1]?.isSame(preset[1], "day")
        ) {
          setActivePreset(key)
        }
      })
    }
  }, [defaultValue])

  // 组件挂载时触发一次 onChange，通知父组件初始值
  // 注释掉这个 useEffect 以避免重复触发 onChange
  // useEffect(() => {
  //   onChange?.(defaultValue || DEFAULT_RANGE)
  // }, [])

  const disabledDate = (current) => {
    if (!dates) {
      return false
    }
    return false
  }

  const onOpenChange = useCallback(
    (open) => {
      console.log("open", open)
      if (open) {
        setDates(value)
      } else {
        setDates(null)
      }
    },
    [value]
  )

  const handleChange = useCallback(
    (val, dateStrings) => {
      if (!val) return
      // 对手动选择的日期进行处理
      const adjustedVal = [
        val[0].startOf("day"), // startTime 设置为当天开始 00:00:00
        val[1].endOf("day") // endTime 设置为当天结束 23:59:59
      ]

      setValue(isSecond ? val : adjustedVal)
      setDates(null)
      onChange?.(isSecond ? val : adjustedVal)
      setActivePreset(null)
    },
    [onChange]
  )

  const handleRangeClick = useCallback(
    (key, val) => {
      console.log("range click", val)
      setValue(val)
      setDates(null)
      onChange?.(val)
      setActivePreset(key)
    },
    [onChange]
  )

  const rangePresets = {
    今日: [dayjs().startOf("day"), dayjs().endOf("day")],
    最近7天: [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
    最近14天: [dayjs().subtract(13, "day").startOf("day"), dayjs().endOf("day")],
    最近30天: [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")]
  }

  const renderPresets = () => {
    return (
      <div className="flex flex-col gap-2 p-2 min-w-[100px]">
        {Object.entries(rangePresets).map(([key, val]) => (
          <Button
            key={key}
            size="small"
            type="text"
            className={`text-left ${
              activePreset === key
                ? "bg-gray-100 text-[#7f56d9]"
                : "hover:bg-gray-100 hover:text-[#7f56d9]"
            }`}
            onClick={() => handleRangeClick(key, val)}
          >
            {key}
          </Button>
        ))}
      </div>
    )
  }

  const panelRender = (panelNode) => {
    return (
      <div className="flex">
        {renderPresets()}
        {panelNode}
      </div>
    )
  }

  return (
    <RangePicker
      value={dates || value}
      disabledDate={disabledDate}
      onCalendarChange={(val) => {
        console.log("calendar change", val)
        setDates(val)
      }}
      onChange={handleChange}
      onOpenChange={onOpenChange}
      format={isSecond ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD"}
      panelRender={panelRender}
      showTime={false}
      {...restProps}
    />
  )
}

export default RangeTimePicker
