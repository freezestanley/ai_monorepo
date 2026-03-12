import { useRef, useState } from "react"

export const useKnowledgeState = () => {
  const [treeData, setTreeData] = useState([])
  const [expandedKeys, setExpandedKeys] = useState([])
  const [tableData, setTableData] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [drawerVisible, setDrawerVisible] = useState(false) // New state for drawer visibility

  const [currentParentCatalogNo, setCurrentParentCatalogNo] = useState("")

  //记录批量表格选择
  const [rowSelected, setRowSelected] = useState([])
  // 保存编辑详情列表
  const [editDetailList, setEditDetailList] = useState([])

  const editFlag = useRef(false)
  const currentCatalog = useRef(null)

  return {
    treeData,
    setTreeData,
    expandedKeys,
    setExpandedKeys,
    tableData,
    setTableData,
    showEditModal,
    setShowEditModal,
    inputValue,
    setInputValue,
    editFlag,
    currentCatalog,
    drawerVisible,
    setDrawerVisible,
    rowSelected,
    setRowSelected,
    editDetailList,
    setEditDetailList,
    currentParentCatalogNo,
    setCurrentParentCatalogNo
  }
}

export default useKnowledgeState
