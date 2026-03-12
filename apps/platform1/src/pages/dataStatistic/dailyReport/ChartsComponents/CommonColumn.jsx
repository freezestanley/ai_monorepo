import { Column } from "@ant-design/plots"
function CommonColumn(props) {
  const data = props.data || []
  const extraConfig = props.extraConfig || {}
  const config = {
    data,
    xField: "name",
    yField: "value",
    label: {
      // 可手动配置 label 数据标签位置
      position: "middle",
      // 'top', 'bottom', 'middle',
      // 配置样式
      style: {
        fill: "#FFFFFF",
        opacity: 0.6
      }
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: true,
        autoEllipsis: false,
        layout: [
          {
            type: "text-rotation",
            cfg: {
              rotate: -Math.PI / 6, // 将标签向左旋转 30 度
              translate: [-10, 10] // 应用偏移来调整标签的位置
            }
          },
          {
            type: "text-spacing",
            cfg: {
              dy: -10,
              minSpacing: 4
            }
          }
        ]
      }
    },
    meta: {
      name: {
        alias: "名称"
      },
      value: {
        alias: "次数"
      }
    },
    tooltip: {
      showMarkers: false,
      formatter: (datum) => {
        return { name: datum.name, value: datum.value }
      }
    },
    ...extraConfig
  }
  return <Column {...config} />
}

export default CommonColumn
