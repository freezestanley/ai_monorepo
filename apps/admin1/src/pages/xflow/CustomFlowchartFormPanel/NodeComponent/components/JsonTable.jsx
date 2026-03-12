import OverflowTooltip from "@/components/overflowTooltip"
import { Table } from "antd"

function JsonTable({ dataSource }) {
  // 确保 dataSource 始终是数组
  const safeDataSource = Array.isArray(dataSource) ? dataSource : []

  const columns = [
    {
      title: "层级",
      dataIndex: "layer",
      width: "100px"
    },
    {
      title: "参数名",
      dataIndex: "variableName",
      width: "100px"
    },

    {
      title: "类型",
      dataIndex: "variableValueType",
      width: "70px"
    },
    {
      title: "输出参数说明",
      dataIndex: "description",
      width: "200px",
      render: (text) => {
        return <OverflowTooltip text={text} width={200} />
      }
    }
  ]
  return (
    <Table
      className="mb-8"
      columns={columns}
      // bordered={true}
      dataSource={safeDataSource}
      pagination={false}
      size="small"
      expandable={{
        defaultExpandAllRows: true
      }}
    />
  )
}

export default JsonTable
