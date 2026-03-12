import React from "react"
import { Pie } from "@ant-design/plots"

const ProportionCircular = ({ data, colors }) => {
  const config = {
    appendPadding: 10,
    data,
    angleField: "value",
    colorField: "name",
    radius: 0.8,
    label: {
      type: "outer",
      content: "{name} {percentage}"
    },
    interactions: [
      {
        type: "pie-legend-active"
      },
      {
        type: "element-active"
      }
    ],
    color: colors
  }

  return <Pie {...config} />
}

export default ProportionCircular
