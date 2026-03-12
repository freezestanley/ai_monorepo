import { Table, Typography } from "antd"
const { Title, Text } = Typography
function DataPreview({ dataSource, columns, title, footerTip }) {
  return (
    <div className=" w-full overflow-x-auto">
      <Title level={5}>{title}</Title>
      <Table bordered pagination={false} dataSource={dataSource} columns={columns} />
      <div className="mt-4">
        <Text>{footerTip}</Text>
      </div>
    </div>
  )
}

export default DataPreview
