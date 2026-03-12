/**
 * 树编辑组件
 * 接收参数：
 *    treeData: 树
 *    search:是否启用搜索匹配
 *    maxTree:最大层级
 *    defaultSelectedKeys:默认选中ID  String[]
 *    editCallback:树编辑操作 ，
 *                  editCallback(type,node)
 *                  type: 删除0、编辑1、新增2
 *                  node:节点数据
 * **/

import { useEffect, useState } from "react"
import { Tree, Input, Spin, Dropdown } from "antd"
import { ProfileOutlined, SettingOutlined } from "@ant-design/icons"

import "./index.less"
const { Search } = Input
const { DirectoryTree } = Tree

const EditableNode = (props) => {
  const {
    dataNode = {},
    searchValue,
    handlerAddSameNode = (...args) => {},
    handlerAddChildNode = (...args) => {},
    handlerDelNode = (...args) => {},
    edit,
    maxTree,
    showIcon = true
  } = props
  const { depth } = dataNode
  //   搜索高亮匹配
  const searchRegHtml = (v) => {
    if (!v) return
    const index = v.indexOf(searchValue)
    const beforeStr = v.substr(0, index)
    const afterStr = v.substr(index + searchValue.length)
    const title =
      index > -1 ? (
        <span>
          {beforeStr}
          <span className="site-tree-search-value" style={{ color: "#7F56D9" }}>
            {searchValue}
          </span>
          {afterStr}
        </span>
      ) : (
        <span>{v}</span>
      )
    return title
  }
  const items = [
    {
      label: "添加同级",
      key: "1",

      onClick: (e) => {
        e.domEvent.stopPropagation()
        handlerAddSameNode(dataNode)
      }
    },
    {
      label: "添加子级",
      key: "2",
      onClick: (e) => {
        e.domEvent.stopPropagation()
        handlerAddChildNode(dataNode)
      }
    },
    {
      label: "删除",
      key: "3",
      onClick: (e) => {
        e.domEvent.stopPropagation()
        handlerDelNode(dataNode)
      }
    }
  ]
  if (depth && depth >= maxTree) {
    items.splice(1, 1)
  }

  return (
    <div className="tree-node clear">
      <Dropdown menu={{ items }} trigger={["contextMenu"]}>
        <div className="title ellipsis-one-line">
          {showIcon ? (
            dataNode?.resourceType === "MENU" ? (
              <ProfileOutlined className="type-icon" />
            ) : (
              <SettingOutlined className="type-icon" />
            )
          ) : null}
          {searchRegHtml(dataNode?.name)}
        </div>
      </Dropdown>
    </div>
  )
}

// 可编辑树
const EditableTree = (props) => {
  const {
    search = true,
    onSelect = (...args) => {},
    handlerAddSameNode = (...args) => {},
    handlerAddChildNode = (...args) => {},
    handlerDelNode = (...args) => {},
    treeLoading,
    selectedKeys = []
  } = props

  const [treeData, setTreeData] = useState(props?.treeData || [])
  const [expandedKeys, setExpandedKeys] = useState([])
  console.log(expandedKeys)
  const [autoExpandParent, setAutoExpandParent] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  // 默认展开所有层级对应的ID树
  const recursiveGetTreeAllKey = (node) => {
    let allKey = []
    const fn = (node, notIncludeSelf) => {
      if (!notIncludeSelf) {
        allKey.push(node.resourceNo)
      }
      if (node.child && node.child.length > 0) {
        node.child.forEach((item) => {
          allKey.push(item.resourceNo)
          fn(item, true)
        })
      }
    }
    node.map((v) => fn(v))
    setExpandedKeys(allKey)
  }
  useEffect(() => {
    setTreeData(props?.treeData)
    if (!expandedKeys.length) recursiveGetTreeAllKey(props?.treeData)
  }, [props?.treeData])

  const onChange = (e) => {
    const { value } = e.target
    let reg = []
    const clone = treeData
    const fn = (tree) => {
      tree.child.forEach((v) => {
        if (v.name?.indexOf(value) > -1 && value) {
          reg.push(v.resourceNo)
        }
        if (v.child && v.child.length > 0) {
          fn(v)
        }
      })
    }
    clone.map((v) => fn(v))
    setExpandedKeys(reg)
    setAutoExpandParent(true)
    setSearchValue(value)
  }

  const iteraGetTreeHtml = (dataNode) => {
    const htmlNode = {
      id: dataNode.id || dataNode.resourceNo,
      title: (
        <EditableNode
          {...props}
          dataNode={dataNode}
          treeData={treeData}
          searchValue={searchValue}
          handlerAddSameNode={handlerAddSameNode}
          handlerAddChildNode={handlerAddChildNode}
          handlerDelNode={handlerDelNode}
        ></EditableNode>
      )
    }
    if (!dataNode) return null
    if (Array.isArray(dataNode)) return dataNode.map((item) => iteraGetTreeHtml(item))
    if (dataNode.child) {
      htmlNode.child = iteraGetTreeHtml(dataNode.child)
    }
    return htmlNode
  }
  const treeHtml = () => iteraGetTreeHtml(treeData)
  const onExpand = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue)
    setAutoExpandParent(false)
  }
  return (
    <div className="container">
      <Spin spinning={treeLoading}>
        {search ? (
          <Search
            style={{ marginBottom: 8 }}
            placeholder="请输入关键字"
            onChange={onChange}
            allowClear
          />
        ) : null}
        {/* 需要默认节点 */}
        {!treeLoading ? (
          <DirectoryTree
            {...props}
            loading={true}
            fieldNames={{
              children: "child",
              key: "id"
            }}
            showIcon
            showLine
            treeData={treeHtml()}
            defaultExpandAll={true}
            autoExpandParent={autoExpandParent}
            selectedKeys={[...selectedKeys]}
            expandedKeys={[...expandedKeys]}
            onExpand={onExpand}
            onSelect={onSelect}
          />
        ) : null}
      </Spin>
    </div>
  )
}

export default EditableTree
