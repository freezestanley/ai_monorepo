import { useMemo, useRef, useState, useCallback } from "react"
import { SearchOutlined } from "@ant-design/icons"
import { Input } from "antd"
import classNames from "classnames"
import styles from "./index.module.scss"

const toCssSize = (v, fallback) => {
  if (v === undefined || v === null) return fallback
  if (typeof v === "number") return `${v}px`
  return String(v)
}

const SearchExpandInput = ({
  value,
  defaultValue,
  onChange,
  onSearch,
  placeholder,
  collapsedWidth,
  expandedWidth,
  className,
  style,
  disabled
}) => {
  const inputRef = useRef(null)
  const [internalValue, setInternalValue] = useState(defaultValue ?? "")

  const isControlled = value !== undefined
  const currentValue = useMemo(
    () => (value !== undefined ? value : internalValue),
    [value, internalValue]
  )

  const handleChange = useCallback(
    (e) => {
      if (!isControlled) setInternalValue(e.target.value)
      onChange?.(e)
    },
    [isControlled, onChange]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        onSearch?.(currentValue)
      }
    },
    [onSearch, currentValue]
  )

  const cssVars = useMemo(
    () => ({
      ["--collapsedWidth"]: toCssSize(collapsedWidth, "40px"),
      ["--expandedWidth"]: toCssSize(expandedWidth, "320px")
    }),
    [collapsedWidth, expandedWidth]
  )

  const focusInput = useCallback(() => {
    if (disabled) return
    inputRef.current?.focus()
  }, [disabled])

  return (
    <div
      className={`${styles.root} ${disabled ? styles.disabled : ""} ${className ?? ""}`}
      style={{ ...cssVars, ...style }}
      role="search"
      aria-disabled={disabled || undefined}
      onClick={focusInput}
    >
      <SearchOutlined className={styles.icon} aria-hidden="true" />
      <Input
        ref={inputRef}
        className={classNames(
          "text-sm font-bold text-slate-700 placeholder:text-slate-300",
          styles.input
        )}
        type="text"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        bordered={false}
        allowClear
      />
    </div>
  )
}

export default SearchExpandInput
