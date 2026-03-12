import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Table, Button, Input, Space } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import classNames from "classnames"
import HeaderTitle from "../HeaderTitle"
import { ENTITY_OPTIONS, getEntityDetail } from "../../versionRelease/CreateVersionModal"
import ExpandedTable from "@/pages/versionManage/versionRelease/CreateVersionModal/ExpandedTable"
import styles from "@/pages/versionManage/versionRelease/CreateVersionModal/index.module.less"

const ReleaseList = ({ currentNode, data, botNo, parentOrigin, studioenv }) => {
  const navigate = useNavigate()
  const [filterData, setFilterData] = useState({})

  // 重置搜索
  const handleReset = (clearFilters, dataIndex) => {
    clearFilters()
    setFilterData((preState) => {
      delete preState[dataIndex]
      return preState
    })
  }

  // 搜索处理函数
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setFilterData((preState) => ({
      ...preState,
      [dataIndex]: selectedKeys[0]
    }))
  }
  // 根据filterData过滤data
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data.filter((item) => {
      // 检查每个过滤条件
      for (const [key, value] of Object.entries(filterData)) {
        if (value && value.trim()) {
          const itemValue = item[key]
          if (!itemValue || !itemValue.toString().toLowerCase().includes(value.toLowerCase())) {
            return false
          }
        }
      }
      return true
    })
  }, [data, filterData])

  function getColumnSearchProps(dataIndex, placeholder) {
    return {
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            className={`search-input-${dataIndex}`}
            placeholder={`搜索${placeholder}`}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{ marginBottom: 8, display: "block" }}
          />
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
              onClick={() => handleReset(clearFilters, dataIndex)}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilterDropdownOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => {
            document.querySelector(`.search-input-${dataIndex}`)?.focus()
          }, 100)
        }
      }
    }
  }

  const handleBatchTest = (record) => {
    navigate(
      `/batch-testing?type=${record?.entityType === "AGENT" ? "agent" : "skill"}&${record?.entityType === "AGENT" ? "agentNo" : "skillNo"}=${record?.entityNo}&botNo=${botNo}&versionNo=${record?.changeRecordDTOS?.[0]?.afterVersion || ""}&name=${encodeURIComponent(record?.entityName || "")}&view=${currentNode !== "PRD_PRE_DEPLOY"}&disableChooseVersion=true&studioenv=${studioenv || ""}`
    )
  }

  const columns = [
    {
      title: "类型",
      dataIndex: "entityType",
      key: "entityType",
      width: 100,
      filters: ENTITY_OPTIONS,
      onFilter: (value, record) => record.entityType === value,
      render: (text) => !!text && ENTITY_OPTIONS.find((item) => item.value === text)?.text
    },
    {
      title: "名称",
      dataIndex: "entityName",
      key: "entityName",
      width: 200,
      ...getColumnSearchProps("entityName", "名称")
    },
    {
      title: "Agent/工作流编号",
      dataIndex: "entityNo",
      key: "entityNo",
      width: 180,
      ...getColumnSearchProps("entityNo", "Agent/工作流编号")
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 200,
      sorter: {
        compare: (a, b) => a.gmtCreated - b.gmtCreated
      },
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
      width: 200,
      sorter: {
        compare: (a, b) => a.gmtModified - b.gmtModified
      },
      render: (text, record) => (
        <>
          {record.modifier || "--"}
          <br />
          {text || "--"}
        </>
      )
    },
    {
      title: "操作",
      key: "action",
      width: ["PRD_PRE_DEPLOY", "PRD_GRAYSCALE_DEPLOY", "PRD_DEPLOY"].includes(currentNode)
        ? 150
        : 80,
      render: (_, record) => (
        <>
          <Button
            type="link"
            className="!p-0"
            onClick={() => getEntityDetail(record, parentOrigin, botNo)}
          >
            查看
          </Button>
          {!!record?.changeRecordDTOS?.[0]?.afterVersion &&
            ["PRD_PRE_DEPLOY", "PRD_GRAYSCALE_DEPLOY", "PRD_DEPLOY"].includes(currentNode) && (
              <Button type="link" onClick={() => handleBatchTest(record)}>
                {currentNode === "PRD_PRE_DEPLOY" ? "批量测试" : "查看批测结果"}
              </Button>
            )}
        </>
      )
    }
  ]

  return (
    <>
      <HeaderTitle title={`发布清单 (${data?.length || 0}条）`} />
      <div className="mt-[16px] pl-[20px] pr-[20px]">
        <Table
          className={classNames("table-style-v2", styles.table)}
          rowClassName={(record, index) =>
            index % 2 === 0 ? "table-style-v2-even-row" : "table-style-v2-odd-row"
          }
          columns={columns}
          dataSource={filteredData || []}
          rowKey="recordId"
          pagination={false}
          rowExpandable={(record) => record.childrenList?.length > 0}
          expandedRowRender={(record) => {
            if (record.childrenList?.length > 0) {
              return <ExpandedTable dataSource={record.childrenList} />
            }
            return null
          }}
        />
      </div>
    </>
  )
}

export default ReleaseList
