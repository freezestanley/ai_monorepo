import loadable from "@loadable/component"

// 创建高阶组件
const withLoadable = (importFunc) => {
  const LoadableComponent = loadable(importFunc, {
    fallback: <div></div> // 加载中样式
  })

  return (props) => <LoadableComponent {...props} />
}

export default withLoadable
