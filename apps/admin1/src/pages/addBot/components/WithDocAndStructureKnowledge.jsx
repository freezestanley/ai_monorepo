import { useState, useEffect } from "react"
import { Form, Tree, Menu, Modal, Input, Spin, Select, Button } from "antd"
import { DownOutlined, FolderOutlined, PlusOutlined } from "@ant-design/icons"
import ReactDOM from "react-dom/client"
import "./KnowledgeBase.scss"
import { useAuthResources, useCurrentKnowledgeAndCatalog } from "@/store"
import { RESOURCE_CODE } from "@/constants/resourceCode"
import { findItemsInTree } from "@/api/tools"
import { useLocation, useParams } from "react-router-dom"
import queryString from "query-string"
import { CaretDownFilled } from "@ant-design/icons"
import { Tooltip } from "antd"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"

function WithDocAndStructureKnowledge(TableComponent) {
  return function DocumentKnowledge({
    selectedKnowledgeBase,
    treeData,
    setExpandedKeys,
    treeDataLoading,
    onSelect,
    handleMenuClick,
    showEditModal,
    setShowEditModal,
    setInputValue,
    inputValue,
    handleModalOk,
    editFlag,
    sourceTag,
    designatedSourceTagList
  }) {
    const location = useLocation()
    const { search } = location
    const queryParams = queryString.parse(search)

    const [form] = Form.useForm()
    const { knowledgeAndCatalog, changeKnowledgeAndCatalog } = useCurrentKnowledgeAndCatalog()
    const selectedKeys = knowledgeAndCatalog.currentSelectedCatalog
    const currentSelectedKnowledgeBase = knowledgeAndCatalog.currentSelectedKnowledgeBase

    const selectNodeData = findItemsInTree(currentSelectedKnowledgeBase, selectedKeys)
    const [contextMenuVisible, setContextMenuVisible] = useState(false)
    // 是否拥有编辑权限，没有权限则隐藏按钮
    const resourceCodeList = useAuthResources((state) => state.resourceCodeList)
    const hasEditAuth = resourceCodeList.includes(RESOURCE_CODE.BTN_KNOW_EDIT)
    const isAntron = currentSelectedKnowledgeBase?.catalogTypeCode === "2"
    const viewAvAlible =
      designatedSourceTagList !== undefined && designatedSourceTagList?.length === 0
    const isStructureKnowledge = queryParams?.knowledgeType === "structure"

    const onKnowledgeSelectChange = (catalogTypeCode) => {
      const currentSelectedKnowledgeBase = treeData?.catalogsTreeList?.find(
        (item) => item.catalogTypeCode === catalogTypeCode
      )
      const currentSelectedCatalog =
        currentSelectedKnowledgeBase?.children?.length > 0
          ? [currentSelectedKnowledgeBase?.children[0].catalogNo]
          : []
      changeKnowledgeAndCatalog({
        currentSelectedKnowledgeBase,
        currentSelectedCatalog
      })
    }

    // 监听知识库，如果发现知识库为安创知识库，则强行切换到第一个知识库
    useEffect(() => {
      if (isAntron) {
        // 筛选出不是安创的第一个知识库
        const currentSelectedKnowledgeBase = treeData?.catalogsTreeList?.find(
          (item) => item.catalogTypeCode !== "2"
        )
        // 找出第一个目录
        const currentSelectedCatalog =
          currentSelectedKnowledgeBase?.children?.length > 0
            ? [currentSelectedKnowledgeBase?.children[0].catalogNo]
            : []
        changeKnowledgeAndCatalog({
          currentSelectedKnowledgeBase,
          currentSelectedCatalog
        })
      }
    }, [isAntron, treeData])

    const onRightClick = ({ event, node }) => {
      if (isAntron || !hasEditAuth || (!viewAvAlible && isStructureKnowledge)) {
        return
      }
      const { pageX, pageY } = event
      const existingMenu = document.getElementById("context-menu")
      if (existingMenu) {
        document.body.removeChild(existingMenu)
      }
      const depth = node.pos?.split("-") || []
      const isLessThanMax = depth.length < 4
      const menu = (
        <Menu
          style={{
            position: "absolute",
            left: pageX,
            top: pageY,
            border: "1px solid #efefef",
            borderRadius: "0 6px 6px 6px"
          }}
          onClick={(e) => handleMenuClick(e, node)}
        >
          <Menu.Item key="addSameLevel">添加同级</Menu.Item>
          {isLessThanMax && <Menu.Item key="addSubLevel">添加子级</Menu.Item>}
          <Menu.Item key="edit">编辑名称</Menu.Item>
          <Menu.Item key="delete">删除</Menu.Item>
        </Menu>
      )

      const container = document.createElement("div")
      container.setAttribute("id", "context-menu")
      document.body.appendChild(container)
      ReactDOM.createRoot(container).render(menu)

      setContextMenuVisible(true)
      event.preventDefault()
    }

    useEffect(() => {
      const hideContextMenu = () => {
        const menu = document.getElementById("context-menu")
        if (menu) {
          document.body.removeChild(menu)
        }
        setContextMenuVisible(false)
      }
      if (contextMenuVisible) {
        document.addEventListener("click", hideContextMenu)
      }
      return () => {
        document.removeEventListener("click", hideContextMenu)
      }
    }, [contextMenuVisible])

    const searchParams = queryString.parse(window.location.search) || {}
    const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
    const { token: isIframe } = searchParams.token ? searchParams : hashParams

    useEffect(() => {
      if (localStorage.getItem("meauCatalogNo")) {
        console.log("meauCatalogNo1111", localStorage.getItem("meauCatalogNo"))
        changeKnowledgeAndCatalog({
          currentSelectedKnowledgeBase,
          currentSelectedCatalog: [localStorage.getItem("meauCatalogNo")]
        })
      }
    }, [localStorage.getItem("meauCatalogNo")])

    return (
      <>
        <Form form={form}>
          <div className="knowledge-base-wrapper">
            <div
              // className={`${!isIframe ? "tree-wrapper-noiframe" : "tree-wrapper"}`}
              className="tree-wrapper"
              style={{
                maxHeight:
                  // @ts-ignore
                  treeData?.children?.length > 10 ? "calc(100vh - 210px)" : ""
              }}
            >
              <Select
                style={{ width: "100%", marginBottom: 12 }}
                placeholder="请选择知识"
                value={currentSelectedKnowledgeBase?.catalogTypeCode}
                onChange={onKnowledgeSelectChange}
                options={treeData.catalogsTreeList?.filter((item) => item.catalogTypeCode !== "2")}
                fieldNames={{ label: "catalogType", value: "catalogTypeCode" }}
              />

              <Spin spinning={treeDataLoading}>
                {(!currentSelectedKnowledgeBase?.children ||
                  currentSelectedKnowledgeBase?.children?.length < 1) &&
                hasEditAuth ? (
                  <Button
                    className={`-ml-[5px]  ${isIframe ? "mt-[68px]" : ""}`}
                    icon={<PlusOutlined />}
                    style={{
                      color: "var(--main-1, #7F56D9)"
                    }}
                    type="link"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      editFlag.current = false
                      handleMenuClick(
                        { key: "addSameLevel" },
                        {
                          parentCatalogNo: currentSelectedKnowledgeBase.knowledgeBaseNo
                        }
                      )
                    }}
                  >
                    新增分类
                  </Button>
                ) : (
                  <Tree
                    showLine={{ showLeafIcon: false }}
                    switcherIcon={
                      <CaretDownFilled
                        style={{
                          fontSize: "13px",
                          color: "#475467",
                          verticalAlign: "middle",
                          marginLeft: "-4px"
                        }}
                      />
                    }
                    onSelect={onSelect}
                    selectedKeys={selectedKeys}
                    defaultExpandAll={true}
                    autoExpandParent={true}
                    defaultExpandParent={true}
                    treeData={currentSelectedKnowledgeBase?.children || []}
                    titleRender={(nodeData) => (
                      <Tooltip title={nodeData.catalogName}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            width: "100%"
                          }}
                        >
                          {nodeData.catalogName}
                        </div>
                      </Tooltip>
                    )}
                    fieldNames={{
                      title: "catalogName",
                      key: "catalogNo"
                    }}
                    onRightClick={onRightClick}
                    onExpand={setExpandedKeys}
                  />
                )}
              </Spin>
            </div>
            <div className="table-wrapper">
              <TableComponent
                isAntron={isAntron}
                docCategories={currentSelectedKnowledgeBase?.children || []}
                selectNode={selectNodeData}
                selectedKnowledgeBase={selectedKnowledgeBase}
                viewAvAlible={viewAvAlible}
                sourceTag={sourceTag}
                onSelect={onSelect}
              />
            </div>
          </div>
        </Form>
        <Modal
          title={editFlag.current ? "编辑" : "添加"}
          open={showEditModal}
          onCancel={() => setShowEditModal(false)}
          onOk={handleModalOk}
        >
          <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        </Modal>
      </>
    )
  }
}

export default WithDocAndStructureKnowledge
