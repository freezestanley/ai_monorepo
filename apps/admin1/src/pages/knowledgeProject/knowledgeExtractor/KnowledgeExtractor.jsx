/*
 * @Author: Dyton
 * @Date: 2024-03-14 17:33:04
 * @Descripttion:知识萃取-首页-批次列表
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-27 10:56:40
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/KnowledgeExtractor.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useState } from "react"
import { Container, Header, StatusBar } from "./components"
import { Table, Pagination, Input, Button } from "antd"
import { debounce } from "lodash"
import "./styles/index.scss"
import queryString from "query-string"
import { useFetchBotInfo } from "@/api/bot"
import { useLocation, useNavigate } from "react-router-dom"
import { useExtractorListApi, useTaskOptionsApi } from "@/api/knowledgeExtractor"
import { statusFilters } from "./utils"
import { useExtractor } from "./ExtractorProvider"

/**
 * @description: 知识萃取首页
 * @remark {*} iframe 集成规则
 * https://xxx/#/knowledgeManage?botNo=xxx
 * @params botNo  空间No 必传
 */
export const KnowledgeExtractor = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const [batchCode, setBatchNo] = useState("")
  const [filters, setFilters] = useState({})
  const { setSessionPagination, getSessionPagination } = useExtractor()
  const [pagination, setPagination] = useState(getSessionPagination("KnowledgeExtractor"))
  // 获取空间信息
  const { data: botDetails = {} } = useFetchBotInfo(botNo)
  // 萃取批次列表查询
  const { data: tableData, isLoading: faqListLoading } = useExtractorListApi({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    batchCode,
    botNo,
    ...filters
  })
  // 萃取任务 全量筛选列表
  const { data: taskNameOptions } = useTaskOptionsApi({
    batchCode,
    botNo
  })

  const columns = [
    {
      title: "萃取批次编号",
      dataIndex: "batchCode",
      key: "batchCode",
      width: 300
    },

    {
      title: "萃取任务",
      width: 300,
      dataIndex: "taskName",
      key: "taskName",
      filters: taskNameOptions,
      filterSearch: true
    },
    {
      title: "实例数",
      dataIndex: "sourceCount",
      key: "sourceCount"
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (text) => <StatusBar type={text}></StatusBar>,
      filters: statusFilters,
      filterSearch: true
    },
    {
      title: "创建时间",
      dataIndex: "gmtCreated",
      key: "gmtCreated"
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
            const { batchCode, taskName } = record || {}
            const urls = queryString.stringifyUrl({
              url: "/instanceExtractor",
              query: {
                batchCode,
                taskName,
                botNo,
                knowledgeBaseNo: botDetails?.knowledgeBaseNo
              }
            })
            navigate(urls)
          }}
        >
          查看批次
        </Button>
      )
    }
  ]

  const debounceSetSearch = debounce((value) => {
    setBatchNo(value)
  }, 1000)
  const onChangeSearch = (e) => {
    if (e.target.value === "") debounceSetSearch("")
    else debounceSetSearch(e.target.value)
  }

  const handleFilterChange = (paginations, filters) => {
    const p = { ...pagination, current: 1 }
    setPagination(p)
    setSessionPagination("KnowledgeExtractor", p)
    const obj = {}
    Object.keys(filters).map((k) => (obj[`${k}List`] = filters[k]))
    setFilters({ ...obj })
  }
  return (
    <div>
      <Header title="知识萃取">
        <div className="extractor-search-box">
          <Input
            style={{ width: 300 }}
            placeholder="请输入萃取批次编号"
            onChange={onChangeSearch}
          />
          <Button
            onClick={() => {
              const urls = queryString.stringifyUrl({
                url: "/taskExtractor",
                query: {
                  botNo,
                  knowledgeBaseNo: botDetails?.knowledgeBaseNo
                }
              })
              navigate(urls)
            }}
          >
            查看萃取任务
          </Button>
        </div>
      </Header>
      <Container>
        <Table
          loading={faqListLoading}
          columns={columns}
          onChange={handleFilterChange}
          pagination={false}
          dataSource={tableData?.records}
        ></Table>
        <Pagination
          className="pr-2"
          current={pagination?.current}
          pageSize={pagination?.pageSize}
          total={tableData?.total}
          onChange={(page, pageSize) => {
            const p = { current: page, pageSize }
            setSessionPagination("KnowledgeExtractor", p)
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
