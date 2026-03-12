import React, { createContext, useState, useContext } from "react"

// 创建标签上下文
const TagsContext = createContext()

// 标签Provider组件
export const TagsProvider = ({ children }) => {
  const [tags, setTags] = useState([])

  // 更新标签的方法
  const updateTags = (newTags) => {
    // 只存储最新的标签，不再自动同步到所有节点
    console.log("TagsContext - 存储当前标签:", newTags)
    setTags(newTags)
  }

  // 提供状态和方法给子组件
  return <TagsContext.Provider value={{ tags, updateTags }}>{children}</TagsContext.Provider>
}

// 自定义Hook，用于在组件中访问标签状态
export const useTags = () => {
  const context = useContext(TagsContext)
  if (!context) {
    throw new Error("useTags必须在TagsProvider内部使用")
  }
  return context
}
