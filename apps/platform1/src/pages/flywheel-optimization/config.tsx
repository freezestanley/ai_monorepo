export const lineConfig = {
  xField: "date",
  yField: "percent",
  smooth: true, // 光滑曲线
  padding: [30, 40, 40, 40],
  color: "#8C71F6",
  lineStyle: {
    lineWidth: 3
  },
  area: {
    style: {
      fill: "l(90) 0:#8c71f64d 1:#8c71f619" //
    }
  },
  // 数据点样式
  point: {
    size: 4,
    shape: "circle",
    style: {
      fill: "#8C71F6",
      stroke: "#fff",
      lineWidth: 2
    }
  },
  tooltip: {
    showMarkers: false,
    customContent: (title, items) => {
      if (!items || items.length === 0) return null
      const data = items[0]?.data || {}
      const { value, percent } = data
      return `
        <div style="padding: 10px 12px;">
          <div style="margin-bottom: 8px; font-weight: 600; color: #374151;">
            ${title}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #6B7280;">优化单数:</span>

            <span style="font-weight: 600; color: #111827;">
              ${value}
            </span>

            ${
              percent !== undefined
                ? `
              <span style="color: #8C71F6; font-weight: 500;">
                (${percent}%)
              </span>
            `
                : ""
            }
          </div>
        </div>
      `
    }
  },
  xAxis: {
    label: {
      style: {
        fill: "#6B7280",
        fontSize: 12
      }
    }
  },
  yAxis: {
    label: {
      style: {
        fill: "#6B7280",
        fontSize: 12
      },
      formatter: (value) => {
        return value + "%"
      }
    },
    grid: {
      line: {
        style: {
          stroke: "#E4E7EC",
          lineDash: [4, 4],
          lineWidth: 0.8
        }
      }
    }
  }
}

export const columnConfig = {
  xField: "problem",
  yField: "count",
  isStack: true,
  seriesField: "clusterId", // 使用clusterKey作为系列字段，确保全局唯一性
  legend: false,
  // minColumnWidth: 30,
  maxColumnWidth: 100,
  columnWidthRatio: 0.5, // 柱子宽度占比，值越小空隙越大
  xAxis: {
    label: {
      // 旋转标签以适应长文本
      rotate: -45,
      // 或者使用自动省略
      autoHide: false, // 不自动隐藏，确保所有标签都显示
      autoEllipsis: true, // 自动省略过长的标签
      style: {
        fontSize: 12
      },
      // 设置标签的偏移量，确保旋转后的标签能完整显示
      offset: 40,
      // 对超过指定字符的标签显示为省略号
      formatter: (text) => {
        if (!text) return text
        if (text.length > 5) {
          return `${text.substring(0, 5)}...`
        }
        return text
      }
    }
    // 限制x轴显示的标签个数
    // tickCount: 5 // 限制最多显示10个标签
  },
  tooltip: {
    shared: true,
    customContent: (title, data) => {
      if (!data || data.length === 0) {
        return ""
      }

      // 计算总数 - 根据实际数据结构 item.data.count
      const totalOrderCount = data.reduce((acc, item) => {
        const value = item?.data?.count || 0
        return acc + value
      }, 0)
      // 生成每个数据项的HTML
      const itemsHtml = data
        .map((item) => {
          const name = item?.data?.clusterName || ""
          const value = item?.data?.count || 0
          const color = item?.color || "#5B8FF9"
          const percent =
            totalOrderCount > 0
              ? "( " + ((value / totalOrderCount) * 100).toFixed(1) + "% )"
              : "(0.0%)"

          return `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div>
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 4px; margin-right: 6px; background-color: ${color};"></span>
              <span>${name}</span>
            </div>
            <div style="margin-left: 20px;">
              <span>${value}</span>
              <span style="font-weight: 500; margin-left: 8px;">${percent}</span>
            </div>
          </div>
        `
        })
        .join("")

      return `
        <div style="padding: 8px 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 500; margin-bottom: 12px; margin-top: 8px;">
            <div>${title}</div>
            <span style="margin-left: 16px;">${totalOrderCount}</span>
          </div>
          ${itemsHtml}
        </div>
      `
    }
  }
}
