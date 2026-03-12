/**
 * 画布相关常量
 */

// 节点类型
export const NODE_TYPES = {
  CONTENT: "content",
  STATE_MACHINE_ROOT: "stateMachineRoot",
  STATE_MACHINE_CHILD: "stateMachineChild"
}

// 边类型
export const EDGE_TYPES = {
  CUSTOM: "custom"
}

// 样式常量
export const STYLE_CONSTANTS = {
  // 高亮样式
  HIGHLIGHT: {
    opacity: 1,
    stroke: "rgba(127, 86, 217, 1)",
    strokeWidth: 1.5,
    strokeDasharray: "15, 5",
    animation: "flowAnimation 1s linear infinite",
    boxShadow: "0 0 10px 0 rgba(127, 86, 217, 0.3)"
  },

  // 半透明样式
  DIM: {
    opacity: 0.6
  },

  // 节点高亮类名
  NODE_HIGHLIGHT_CLASSNAME: "node-highlighted"
}

// 流动动画CSS
export const FLOW_ANIMATION_STYLE = `
  @keyframes flowAnimation {
    0% {
      stroke-dashoffset: 20;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
`

// 默认节点尺寸
export const DEFAULT_NODE_SIZE = {
  WIDTH: 300,
  HEIGHT: 150
}

// 默认标签
export const DEFAULT_TAGS = [
  { label: "费用", value: "费用" },
  { label: "否定", value: "否定" }
]

export default {
  NODE_TYPES,
  EDGE_TYPES,
  STYLE_CONSTANTS,
  FLOW_ANIMATION_STYLE,
  DEFAULT_NODE_SIZE,
  DEFAULT_TAGS
}
