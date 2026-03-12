import { Select, Radio, Checkbox, Space, Typography } from 'antd'
import type { CheckboxValueType } from 'antd/es/checkbox/Group'
import React, { useCallback, useEffect, useState } from 'react'
const { Text } = Typography
type optionType = {
  label: string
  value: string
}
type configType = {
  placeholder?: string
  allText?: string
  partialText?: string
  emptyTipText?: string
}
type valueType = {
  type: string
  selectedOptions: string[]
}
interface CustomSelectProps {
  config?: configType
  value?: valueType
  options: optionType[]
  disabled?: boolean
  style?: { [key: string]: string }
  onChange?: () => void
}

const ALL = 'all'
const PARTIAL = 'partial'
const customSelectConfig = {
  placeholder: '请选择来源',
  allText: '全部来源',
  partialText: '指定来源',
  emptyTipText: '请选择来源标签'
}
const CustomSelect: React.FC<CustomSelectProps> = ({
  config = customSelectConfig,
  options,
  style = {},
  disabled,
  value = { type: ALL, selectedOptions: [] },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (_: valueType) => {}
}) => {
  const [open, setOpen] = useState(false)
  const [showItems, setShowItems] = useState(value.type === PARTIAL)
  const [selectedType, setSelectedType] = useState(value.type || ALL)
  const [selectedOptions, setSelectedOptions] = useState(value.selectedOptions || [])

  useEffect(() => {
    onChange &&
      onChange({
        type: selectedType,
        selectedOptions
      })
  }, [selectedType, selectedOptions])

  useEffect(() => {
    setSelectedType(value.type)
    setSelectedOptions(value.selectedOptions)
    setShowItems(value.type === PARTIAL)
  }, [value])

  const handleRadioChange = (e: any) => {
    const value = e.target.value
    setSelectedType(value)
    setShowItems(value === PARTIAL)
  }

  const handleDropdownVisibleChange = (isVisible: boolean) => {
    if (isVisible) {
      setOpen(true)
    } else if (selectedType === PARTIAL && selectedOptions.length === 0) {
      // message.warning('请选择来源标签')
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const handleCheckboxChange = useCallback(
    (checkedValues: CheckboxValueType[]) => {
      // @ts-ignore
      setSelectedOptions(checkedValues)
    },
    [setSelectedOptions]
  )

  return (
    <div>
      <Select
        style={{ width: '300px', ...style }}
        placeholder={config.placeholder}
        disabled={disabled}
        open={open}
        onDropdownVisibleChange={handleDropdownVisibleChange}
        value={selectedType === ALL ? config.allText : config.partialText}
        dropdownRender={() => {
          return (
            <>
              <div style={{ padding: '10px' }}>
                <Radio.Group onChange={handleRadioChange} value={selectedType}>
                  <Radio value={ALL}>{config.allText}</Radio>
                  <Radio value={PARTIAL}>{config.partialText}</Radio>
                </Radio.Group>
                {showItems && (
                  <Checkbox.Group style={{ padding: '10px 5px 0 5px', width: '100%' }} value={selectedOptions} onChange={handleCheckboxChange}>
                    <Space direction="vertical">
                      {options.map((item) => {
                        return (
                          <Checkbox key={item.value} value={item.value}>
                            {item.label}
                          </Checkbox>
                        )
                      })}
                      {selectedOptions.length === 0 && <Text type="danger">{config.emptyTipText}</Text>}
                    </Space>
                  </Checkbox.Group>
                )}
              </div>
            </>
          )
        }}
      />
    </div>
  )
}

export default CustomSelect
