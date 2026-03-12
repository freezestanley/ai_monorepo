import React from "react"
import { Space, Typography } from "antd"

const NumberPanel = ({ numberList = [] }) => {
  return (
    <div className="flex gap-4">
      {numberList.map((item, index) => (
        <div
          key={index}
          className="flex-1 p-4 rounded-lg border border-solid border-[#E5E7EB] bg-white"
        >
          <Typography.Text className="block mb-1" style={{ fontSize: "12px", color: "#6B7280" }}>
            {item.title}
          </Typography.Text>
          <Typography.Text style={{ fontSize: "32px", fontWeight: "600", color: "#1F2937" }}>
            {item.value}
          </Typography.Text>
        </div>
      ))}
    </div>
  )
}

export default NumberPanel
