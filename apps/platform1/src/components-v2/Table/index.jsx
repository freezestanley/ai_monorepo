import { Table as AntTable, Space, Input, Button } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import classNames from "classnames"
import styles from "./index.module.scss"

export const getColumnSearchProps = (options) => {
  const { dataIndex, placeholder, handleSearch, handleReset, color, ...rest } = options || {}
  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }}>
        <Space className="w-full mb-[8px] justify-between">
          <Space>
            <Button
              type="primary"
              onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => handleReset(clearFilters, confirm, dataIndex)}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </Space>
          <Button size="small" type="link" onClick={close} className="!border-0 !p-0">
            关闭
          </Button>
        </Space>
        <Input
          placeholder={`搜索${placeholder}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ display: "block" }}
        />
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? color : undefined }} />,
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => {
          document.querySelector("input")?.focus()
        }, 100)
      }
    },
    filterDropdownProps: { placement: "bottomLeft" },
    ...rest
  }
}

const Table = ({ className, ...props }) => {
  return (
    <AntTable
      className={classNames("shadow-[0_4px_24px_rgba(0,0,0,0.03)]", styles.table, className)}
      pagination={false}
      rowKey={"id"}
      scroll={{ x: "max-content" }}
      {...props}
    />
  )
}

export default Table
