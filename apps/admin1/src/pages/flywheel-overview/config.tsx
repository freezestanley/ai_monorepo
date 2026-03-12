export const barConfig = {
  xField: "count",
  yField: "problemPoint",
  maxBarWidth: 40,
  meta: {
    value: {
      alias: "问题数量"
    }
  },
  yAxis: {
    label: {
      autoRotate: false
    }
  }
}

export const lineConfig = {
  xField: "date",
  yField: "lossRate",
  smooth: true, // 光滑曲线
  padding: [30, 40, 20, 40],
  color: "#de2f30",
  lineStyle: {
    lineWidth: 3
  },
  area: {
    style: {
      fill: "l(90) 0:#de2f304d 1:#de2f3019" //
    }
  },
  // 数据点样式
  point: {
    size: 4,
    shape: "circle",
    style: {
      fill: "#de2f30",
      stroke: "#fff",
      lineWidth: 2
    }
  },
  tooltip: {
    showMarkers: false,
    formatter: (datum) => {
      return {
        name: "流失率",
        value: datum.lossRate + "%"
      }
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

export const scatterConfig = {
  appendPadding: 10,
  xField: "problemSessionCount",
  yField: "seatCount",
  shape: "circle",
  colorField: "Trend", // 添加这一行，指定颜色映射字段
  color: (datum) => {
    return datum.Trend >= 0 ? "#e65957" : "#73c388" // 正数红色，负数绿色
  },
  size: 4,
  legend: false,
  quadrant: {
    xBaseline: "50%",
    yBaseline: "50%",
    lineStyle: {
      lineWidth: 1, // 改为1，让分界线可见
      stroke: "rgba(0,0,0,1)"
    },
    regionStyle: [
      {
        fill: "#ffe5e5",
        fillOpacity: 1
      },
      {
        fill: "#fff5cc",
        fillOpacity: 1
      },
      {
        fill: "#e6f9f0",
        fillOpacity: 1
      },
      {
        fill: "#fff0d9",
        fillOpacity: 1
      }
    ],
    labels: [
      {
        content: "个案惯犯区",
        position: ["98%", "98%"],
        style: {
          fill: "#f18150",
          textAlign: "end",
          fontSize: 16,
          fontWeight: 500
        }
      },
      {
        content: "长尾偶发区",
        position: ["2%", "98%"],
        style: {
          fill: "#73c388",
          textAlign: "start",
          fontSize: 16,
          fontWeight: 500
        }
      },
      {
        content: "扩散趋势区",
        position: ["2%", "2%"],
        style: {
          fill: "#d6a54c",
          textAlign: "start",
          fontSize: 16,
          fontWeight: 500
        }
      },
      {
        content: "核心重灾区",
        position: ["98%", "2%"],
        style: {
          fill: "#e65957",
          textAlign: "end",
          fontSize: 16,
          fontWeight: 500
        }
      }
    ]
  },
  // 单独绘制没颜色的右上和左下
  annotations: [
    // 右上象限 - 个案惯犯区
    {
      type: "region",
      start: ["50%", "50%"],
      end: ["max", "max"],
      style: {
        fill: "#ffe5e5",
        fillOpacity: 1
      }
    },
    // 左下象限 - 扩散趋势区
    {
      type: "region",
      start: ["min", "min"],
      end: ["50%", "50%"],
      style: {
        fill: "#e6f9f0",
        fillOpacity: 1
      }
    }
  ],
  tooltip: {
    customContent: (title, items) => {
      if (!items || items.length === 0) return ""
      const data = items[0]?.data
      if (!data) return ""
      const color = data.Trend >= 0 ? "#e65957" : "#73c388"
      const svgIcvon =
        data.Trend >= 0
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up-icon lucide-trending-up"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-down-icon lucide-trending-down"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>'

      return `
        <div style="padding:12px;font-size: 14px;width: 200px">
         <div style="margin-bottom: 18px;font-size: 16px;font-weight: 600;line-height: 1.2">
            <span style="color: black;">${data.clusterName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #666;">触发频次</span>
            <span style="font-weight: 800;color:black;">${data.problemSessionCount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
            <span style="color: #666;">涉及人数</span>
            <span style="font-weight: 800;color:black;">${data.seatCount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span style="color: #666;">环比趋势</span>
            <span style="font-weight: 800;color:${color}; display: flex; align-items: center;">
              <span style="margin-right: 4px;">${svgIcvon}</span>
              ${Math.abs(data.Trend)}%
            </span>
          </div>
        </div>
      `
    }
  },
  yAxis: {
    min: 0, // y轴从0开始
    label: {
      formatter: (value) => `${value}人`
    },
    line: {
      style: {
        stroke: "#aaa"
      }
    }
  },
  xAxis: {
    min: 0, // x轴从0开始
    label: {
      formatter: (value) => `${value}次`
    },
    grid: {
      line: {
        style: {
          stroke: "#eee"
        }
      }
    },
    line: {
      style: {
        stroke: "#aaa"
      }
    }
  }
}
