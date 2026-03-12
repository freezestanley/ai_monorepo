/*
 * @Author: Dyton
 * @Date: 2024-03-14 17:33:04
 * @Descripttion:知识萃取-批次实例列表
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-01 16:13:10
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/InstanceExtractor.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useState } from "react"
import { Container, Header, StatusBar } from "./components"
import { Table, Pagination, Input, Button } from "antd"
import { debounce } from "lodash"
import "./styles/index.scss"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import { useExtractionInstanceListApi } from "@/api/knowledgeExtractor"
import { statusFilters } from "./utils"
import { useExtractor } from "./ExtractorProvider"

export const InstanceExtractor = () => {
  const [instanceCode, setinstanceCode] = useState("")
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { batchCode, botNo, taskName, knowledgeBaseNo } = queryParams
  const navigate = useNavigate()
  const [filters, setFilters] = useState({})
  const { setSessionPagination, getSessionPagination } = useExtractor()
  const [pagination, setPagination] = useState(getSessionPagination("InstanceExtractor"))
  // 萃取批次列表查询
  const { data: tableData, isLoading: faqListLoading } = useExtractionInstanceListApi({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    batchCode,
    botNo,
    instanceCode,
    ...filters
  })

  const columns = [
    {
      title: "萃取批次编号",
      dataIndex: "batchCode",
      key: "batchCode",
      width: 300
    },

    {
      title: "实例编号",
      width: 300,
      dataIndex: "instanceCode",
      key: "key"
    },

    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 150,
      filters: statusFilters,
      filterSearch: true,
      render: (text) => <StatusBar type={text} />
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      key: "gmtModified",
      sorter: true,
      render: (text, record) => (
        <>
          {record?.modifier ? <p>{record?.modifier}</p> : null}
          {text}
        </>
      )
    },
    {
      title: "操作",
      dataIndex: "key",
      key: "key",
      with: 100,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => {
            const { batchCode, instanceCode, instanceId } = record || {}
            const urls = queryString.stringifyUrl({
              url: "/instanceExtractorDetail",
              query: {
                taskName,
                botNo,
                batchCode,
                instanceCode,
                instanceId,
                knowledgeBaseNo
              }
            })
            navigate(urls)
          }}
        >
          查看实例
        </Button>
      )
    }
  ]
  const debounceSetSearch = debounce((value) => {
    setinstanceCode(value)
  }, 1000)
  const onChangeSearch = (e) => {
    if (e.target.value === "") debounceSetSearch("")
    else debounceSetSearch(e.target.value)
  }
  const handleFilterChange = (paginations, filters) => {
    setPagination({ ...pagination, current: 1 })
    setSessionPagination("InstanceExtractor", { ...pagination, current: 1 })
    const obj = {}
    Object.keys(filters).map((k) => (obj[`${k}List`] = filters[k]))
    setFilters({ ...obj })
  }

  return (
    <div>
      <Header
        title={taskName ? `萃取任务：${taskName}` : "萃取任务"}
        backUrl={`/knowledgeExtractor?botNo=${botNo}`}
      >
        <div className="extractor-search-box">
          <Input style={{ width: 300 }} placeholder="请输入实例编号" onChange={onChangeSearch} />
        </div>
      </Header>
      <Container>
        <Table
          columns={columns}
          pagination={false}
          onChange={handleFilterChange}
          dataSource={tableData?.records}
        ></Table>
        <Pagination
          className="pr-2"
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={tableData?.total}
          onChange={(page, pageSize) => {
            const p = { current: page, pageSize }
            setSessionPagination("InstanceExtractor", p)
            setPagination(p)
          }}
          showSizeChanger={true}
          style={{ marginTop: "15px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
        />
      </Container>
    </div>
  )
}

export default InstanceExtractor
