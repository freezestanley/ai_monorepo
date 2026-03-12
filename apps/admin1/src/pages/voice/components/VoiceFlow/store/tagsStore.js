// 全局标签存储，用于CustomNode和CustomControls之间共享标签数据
let selectedTags = []
let listeners = []

// 注册监听器
export const registerTagListener = (callback) => {
  listeners.push(callback)
  // 返回取消注册的函数
  return () => {
    listeners = listeners.filter((listener) => listener !== callback)
  }
}

// 更新标签
export const updateTags = (tags) => {
  selectedTags = [...tags]
  // 通知所有监听器
  listeners.forEach((listener) => listener(selectedTags))
}

// 获取当前标签
export const getCurrentTags = () => {
  return selectedTags
}
