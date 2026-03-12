import { useState, useCallback } from "react"
import { Button, Table, Row, Col, Form, Input } from "antd"
import PageContainer from "@/components/PageContainer"
import { debounce } from "lodash"
import styles from "./index.module.scss"

const VersionDetail = () => {
  const [pagination, setPagination] = useState({ pageNum: 1, pageSize: 10 })

  const debounceSetSearch = debounce((v) => {}, 1000)

  const onChangeSearch = useCallback(
    (e) => {
      if (e.target.value === "") debounceSetSearch("")
      else debounceSetSearch(e.target.value)
    },
    [debounceSetSearch]
  )

  const columns = [
    {
      title: "意图id",
      dataIndex: "ID"
    },
    {
      title: "意图层级",
      dataIndex: "name"
    },
    {
      title: "意图名称",
      dataIndex: "name"
    },
    {
      title: "意图描述",
      dataIndex: "status"
    },
    {
      title: "关联话术",
      dataIndex: "name"
    },
    {
      title: "来源",
      dataIndex: "name"
    },
    {
      title: "创建信息",
      dataIndex: "name"
    },
    {
      title: "更新信息",
      dataIndex: "name"
    },
    {
      title: "状态",
      dataIndex: "name"
    }
  ]

  return (
    <PageContainer
      headerTitle={"版本详情"}
      headerCustomeSearch={
        <div className={styles["search-box"]}>
          <Input style={{ width: 300 }} placeholder="检索意图/意图描述" onChange={onChangeSearch} />
        </div>
      }
    >
      <Table
        rowKey={"id"}
        columns={columns}
        dataSource={[{ name: "abc" }]}
        pagination={{
          className: "pr-2",
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          // total,
          onChange: (page, pageSize) => setPagination({ pageNum: page, pageSize }),
          showSizeChanger: true,
          style: { marginTop: "15px", textAlign: "right" },
          showTotal: (total) => `共 ${total} 条`
        }}
        scroll={{ x: "max-content" }}
      />
    </PageContainer>
  )
}

export default VersionDetail
