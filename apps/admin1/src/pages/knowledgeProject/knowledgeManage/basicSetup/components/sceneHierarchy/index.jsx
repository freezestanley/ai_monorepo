import { useState } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { Button, Table } from "antd"
import { useFetchListByType, useFetchKnowledgeConfigListAllByTypeApi } from "@/api/knowledgeManage"
import FormDrawer from "./formDrawer"

const SceneHierarchy = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const [drawerData, setDrawerData] = useState({
    mode: "add",
    visiable: false,
    recordData: null
  })
  // 业务场景
  const { data: listByParentAndType } = useFetchListByType({
    type: "BUSINESS_SCENE",
    botNo
  })
  const { data: tableData, isLoading: listLoading } = useFetchKnowledgeConfigListAllByTypeApi({
    type: "BUSINESS_SCENE",
    botNo
  })

  const columns = [
    {
      title: "业务场景",
      dataIndex: "name"
    },
    {
      title: "创建信息",
      dataIndex: "creator",
      render: (text, record) => (
        <>
          {text}
          <br />
          {record.gmtCreated}
        </>
      )
    },
    {
      title: "更新信息",
      dataIndex: "modifier",
      render: (text, record) => (
        <>
          {text}
          <br />
          {record.gmtModified}
        </>
      )
    },
    {
      title: "层级目录操作",
      dataIndex: "action",
      fixed: "right",
      render: (_, record) => (
        <>
          <Button
            style={{ paddingLeft: 0, paddingRight: 0 }}
            type="link"
            onClick={() =>
              setDrawerData({
                mode: "view",
                visiable: true,
                recordData: record
              })
            }
          >
            查看
          </Button>
          <Button
            type="link"
            onClick={() =>
              setDrawerData({
                mode: "edit",
                visiable: true,
                recordData: record
              })
            }
          >
            编辑
          </Button>
        </>
      )
    }
  ]

  return (
    <>
      <Table
        rowKey={"id"}
        loading={listLoading}
        columns={columns}
        dataSource={tableData}
        pagination={false}
        scroll={{ x: "max-content", y: "calc(100vh - 180px)" }}
      />
      <FormDrawer
        {...drawerData}
        botNo={botNo}
        listByParentAndType={listByParentAndType}
        setVisiable={(bool) => setDrawerData((preState) => ({ ...preState, visiable: bool }))}
      />
    </>
  )
}

export default SceneHierarchy
