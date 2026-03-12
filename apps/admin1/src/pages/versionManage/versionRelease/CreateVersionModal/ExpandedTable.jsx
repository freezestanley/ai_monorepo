import { Table } from "antd"
import { ENTITY_OPTIONS } from "./index"

const ExpandedTable = ({ dataSource }) => {
  // 子表格列定义
  const childrenColumns = [
    {
      title: "类型",
      dataIndex: "entityType",
      key: "entityType",
      width: 100,
      render: (text) => !!text && ENTITY_OPTIONS.find((item) => item.value === text)?.text
    },
    {
      title: "名称",
      dataIndex: "entityName",
      key: "entityName",
      width: 200
    },
    {
      title: "Agent/工作流编号",
      dataIndex: "entityNo",
      key: "entityNo",
      width: 150
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 200,
      render: (text, record) => (
        <>
          {record.creator || "--"}
          <br />
          {text || "--"}
        </>
      )
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      key: "gmtModified",
      width: 280,
      render: (text, record) => (
        <>
          {record.modifier || "--"}
          <br />
          {text || "--"}
        </>
      )
    }
  ]
  return (
    <Table
      rowKey="recordId"
      className="table-style-v2"
      columns={childrenColumns}
      dataSource={dataSource}
      rowClassName={(record, index) =>
        index % 2 === 0 ? "table-style-v2-even-row" : "table-style-v2-odd-row"
      }
      pagination={false}
      showHeader={false}
      size="small"
    />
  )
}

export default ExpandedTable
