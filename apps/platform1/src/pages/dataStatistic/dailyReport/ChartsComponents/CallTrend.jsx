import { Column } from "@ant-design/plots"
import { maxBy } from "lodash"
import React, { useMemo } from "react"

function CallTrendComponent({ data1 = [], data2 = [], customConfig = {} }) {
  const max1 = useMemo(() => maxBy(data1, "value")?.value || 0, [data1])

  const config = useMemo(
    () => ({
      data: data1,
      xField: "name",
      yField: "value",
      appendPadding: 8,
      yAxis: {
        type: "linear",
        max: max1 * 1.1,
        label: {
          style: {
            fill: "#6B7280",
            fontSize: 12
          }
        },
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
              lineDash: [4, 4]
            }
          }
        }
      },
      xAxis: {
        label: {
          autoHide: true,
          autoRotate: true,
          style: {
            fill: "#6B7280",
            fontSize: 12
          }
        }
      },
      meta: {
        value: {
          alias: "调用人数"
        }
      },
      color: ["#8370EE", "#36BA77"],
      ...customConfig
    }),
    [data1, max1, customConfig]
  )

  return <Column {...config} />
}

const CallTrend = React.memo(CallTrendComponent)

export default CallTrend
