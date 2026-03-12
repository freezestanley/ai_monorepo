import { Tree } from "antd"

// 定义你的组件
const YourComponent = (props) => {
  const onSelect = (selectedKeys, info) => {
    console.log("selected", selectedKeys, info)
  }

  const onRightClick = ({ event, node }) => {
    console.log("Right click", event, node)
  }

  return (
    <Tree
      onSelect={onSelect}
      defaultExpandAll
      treeData={treeData}
      onRightClick={onRightClick}
      titleRender={(nodeData) => (
        <div
          style={{ width: "100%" }}
          onContextMenu={(event) => {
            event.stopPropagation() // 阻止事件冒泡
            onRightClick({ event, node: nodeData })
          }}
        >
          {nodeData.title}
        </div>
      )}
      {...props}
    />
  )
}

export default YourComponent
