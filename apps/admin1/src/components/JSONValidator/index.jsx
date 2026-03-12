import React, { useState, useImperativeHandle, forwardRef } from "react"
import ReactJson from "react-json-view"
import { Input, Alert } from "antd"

const { TextArea } = Input

const JSONValidator = forwardRef(({ value = "", onChange }, ref) => {
  const [parsedJSON, setParsedJSON] = useState(null)
  const [error, setError] = useState(null)

  const handleInputChange = (inputValue) => {
    try {
      const parsedValue = JSON.parse(inputValue)
      setParsedJSON(parsedValue)
      setError(null)
    } catch (err) {
      setParsedJSON(null)
      setError(err.toString())
    }

    if (onChange) {
      onChange(inputValue) // Pass value to Form
    }
  }

  useImperativeHandle(ref, () => ({
    handleInputChange
  }))

  return (
    <div>
      <TextArea
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="请输入JSON"
        rows={10}
      />
      {parsedJSON && (
        <div style={{ marginTop: 20 }}>
          <ReactJson src={parsedJSON} />
        </div>
      )}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 20 }}
        />
      )}
    </div>
  )
})

export default JSONValidator
