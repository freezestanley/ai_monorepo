import { useEffect, useState, useCallback } from "react"
import { Select, Radio, Checkbox, Space, Typography, message } from "antd"
const { Text } = Typography

export const ALL = "all"
export const PARTIAL = "partial"
const customSelectConfig = {
  placeholder: "请选择可见来源",
  allText: "全部可见",
  partialText: "分来源可见",
  emptyTipText: "请选择来源标签"
}
const CustomSelect = ({
  config = customSelectConfig,
  options,
  style = {},
  disabled = false,
  isSingle = false,
  value = { type: ALL, selectedOptions: [] },
  onChange = () => {}
}) => {
  const [open, setOpen] = useState(false)
  const [showItems, setShowItems] = useState(value.type === PARTIAL)
  const [selectedType, setSelectedType] = useState(value.type || ALL)
  const [selectedOptions, setSelectedOptions] = useState(value.selectedOptions || [])

  useEffect(() => {
    onChange &&
      // @ts-ignore
      onChange({
        type: selectedType,
        selectedOptions
      })
  }, [selectedType, selectedOptions])

  const handleRadioChange = (e) => {
    const value = e.target.value
    setSelectedType(value)
    setShowItems(value === PARTIAL)
  }

  const handleDropdownVisibleChange = (isVisible) => {
    if (isVisible) {
      setOpen(true)
    } else if (selectedType === PARTIAL && selectedOptions.length === 0) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  // 单选
  const handleCheckboxSingleChange = useCallback(
    (e) => {
      setSelectedOptions([e.target.value])
    },
    [setSelectedOptions]
  )

  const handleCheckboxChange = useCallback(
    (checkedValues) => {
      setSelectedOptions(checkedValues)
    },
    [setSelectedOptions]
  )

  return (
    <div>
      <Select
        style={{ width: "200px", ...style }}
        placeholder={config.placeholder}
        disabled={disabled}
        open={open}
        onDropdownVisibleChange={handleDropdownVisibleChange}
        value={
          selectedType === ALL
            ? config.allText
            : `${config.partialText}-${options?.find((f) => f.value === selectedOptions?.[0])?.label}`
        }
        dropdownRender={() => {
          return (
            <>
              <div style={{ padding: 10 }}>
                <Radio.Group onChange={handleRadioChange} value={selectedType}>
                  <Radio value={ALL}>{config.allText}</Radio>
                  <Radio value={PARTIAL}>{config.partialText}</Radio>
                </Radio.Group>
                {showItems &&
                  (isSingle ? (
                    <div className="px-2 pb-2 bg-gray-100 !round-md mt-[10px]">
                      <Radio.Group
                        style={{ padding: "10px 5px 0 5px", width: "100%" }}
                        value={selectedOptions?.[0]}
                        onChange={handleCheckboxSingleChange}
                      >
                        <Space direction="vertical">
                          {options.map((item) => {
                            return (
                              <Radio key={item.value} value={item.value}>
                                {item.label}
                              </Radio>
                            )
                          })}
                          {selectedOptions.length === 0 && (
                            <Text type="danger">{config.emptyTipText}</Text>
                          )}
                        </Space>
                      </Radio.Group>
                    </div>
                  ) : (
                    <Checkbox.Group
                      style={{ padding: "10px 5px 0 5px", width: "100%" }}
                      value={selectedOptions}
                      onChange={handleCheckboxChange}
                    >
                      <Space direction="vertical">
                        {options.map((item) => {
                          return (
                            <Checkbox key={item.value} value={item.value}>
                              {item.label}
                            </Checkbox>
                          )
                        })}
                        {selectedOptions.length === 0 && (
                          <Text type="danger">{config.emptyTipText}</Text>
                        )}
                      </Space>
                    </Checkbox.Group>
                  ))}
              </div>
            </>
          )
        }}
      />
    </div>
  )
}

export default CustomSelect
