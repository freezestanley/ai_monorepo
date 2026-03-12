/*
 * @Author: Dyton
 * @Date: 2024-03-16 10:26:23
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-15 17:17:35
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/TaskExtractor.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useState } from "react"
import { Container, Header } from "./components"
import { Table, Pagination, Input, Button, Popconfirm, Upload, message, Spin } from "antd"
import { debounce } from "lodash"
import "./styles/index.scss"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import { useTaskListApi, useDisabledTaskApi, useTaskOptionsApi } from "@/api/knowledgeExtractor"
import { fetchUploadTask } from "@/api/knowledgeExtractor/api"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useExtractor } from "./ExtractorProvider"
import { getTokenAndServiceName } from "@/api/sso"

/**
 * @description: 任务上传
 * @param {*} record
 * @return {*}
 */
const UploadExtra = (record) => {
  const { taskCode, batchCode, status } = record || {}
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const handleUpload = () => {
    return fetchUploadTask({
      taskCode
    })
  }
  const onUploadDone = () => {
    queryClient.invalidateQueries([QUERY_KEYS.TASK_LIST])
    setLoading(false)
    message.success("上传成功")
  }
  const onUploadError = (e) => {
    setLoading(false)
    message.warning(e ?? "上传失败")
  }
  const onBeforeUpload = (file) => {
    const isExcel =
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    if (!isExcel) {
      message.error("请上传Excel文件")
    }
    return isExcel
  }
  const uploadHeader = {
    "X-Usercenter-Session": getTokenAndServiceName().token
  }
  const onUploadChange = (info, e) => {
    if (info.file.status === "uploading") {
      setLoading(true)
      return
    }
    if (info.file.status === "done") {
      if (info?.file?.response?.code != 200) {
        onUploadError(info?.file?.response?.message)
        return
      }
      onUploadDone()
      return
    }
    if (info.file.status === "error") {
      onUploadError()
    }
  }

  return (
    <Spin spinning={loading}>
      <Upload
        accept=".xlsx,.xls"
        name="file"
        action={handleUpload()}
        headers={uploadHeader}
        beforeUpload={onBeforeUpload}
        showUploadList={false}
        onChange={onUploadChange}
      >
        <Button type="link">上传</Button>
      </Upload>
    </Spin>
  )
}

export const TaskExtractor = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { setSessionPagination, getSessionPagination } = useExtractor()
  const [pagination, setPagination] = useState(getSessionPagination("TaskExtractor"))
  const [extractorBatchNo, setExtractorBatchNo] = useState("")
  const { botNo } = queryParams
  const [filters, setFilters] = useState({})
  const debounceSetSearch = debounce((value) => {
    setExtractorBatchNo(value)
  }, 1000)
  // 任务停用/删除
  const { mutate } = useDisabledTaskApi()
  // 萃取任务列表
  const { data: tableData, isLoading: listLoading } = useTaskListApi({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    botNo,
    search: extractorBatchNo,
    ...filters
  })

  // 萃取任务 全量筛选列表
  const { data: taskNameOptions } = useTaskOptionsApi({
    batchCode: extractorBatchNo,
    botNo
  })

  const columns = [
    {
      title: "萃取任务编号",
      dataIndex: "taskCode",
      key: "taskCode",
      width: 300
    },

    {
      title: "萃取任务名称",
      filters: taskNameOptions,
      filterSearch: true,
      dataIndex: "taskName",
      key: "taskName",
      width: 300
    },
    {
      title: "批次数",
      dataIndex: "batchCount",
      key: "batchCount",
      width: 300
    },

    {
      title: "创建时间",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 300
    },
    {
      title: "操作",
      dataIndex: "key",
      key: "key",
      with: 100,
      render: (text, record) => (
        <div className="flex">
          <UploadExtra {...record} />
          <Button
            type="link"
            onClick={() => {
              const { taskCode } = record || {}
              const url = `/addTaskExtractor${search}&taskCode=${taskCode}`
              navigate(url)
            }}
          >
            查看
          </Button>
          <Popconfirm
            placement="top"
            title={text}
            description={"【删除】后，对应萃取任务将停用"}
            okText="确定"
            cancelText="取消"
            onConfirm={() => {
              mutate(record?.taskCode, {
                onSuccess: (e) => {
                  if (e?.success) {
                    message.success(e?.message)
                  } else {
                    message.error(e?.message)
                  }
                }
              })
            }}
          >
            <Button type="link">删除</Button>
          </Popconfirm>
        </div>
      )
    }
  ]
  const onChangeSearch = (e) => {
    if (e.target.value === "") debounceSetSearch("")
    else debounceSetSearch(e.target.value)
  }
  const handleFilterChange = (paginations, filters) => {
    setPagination({ ...pagination, current: 1 })
    setSessionPagination("TaskExtractor", { ...pagination, current: 1 })
    const obj = {}
    Object.keys(filters).map((k) => (obj[`${k}List`] = filters[k]))
    setFilters({ ...obj })
  }

  return (
    <div>
      <Header title="萃取任务" backUrl={`/knowledgeExtractor?botNo=${botNo}`}>
        <div className="extractor-search-box">
          <Input
            style={{ width: 300 }}
            placeholder="请输入萃取批次编号"
            onChange={onChangeSearch}
          />
          <div>
            <Button
              type="primary"
              onClick={() => {
                navigate(`/addTaskExtractor${search}`)
              }}
            >
              新增萃取任务
            </Button>
          </div>
        </div>
      </Header>
      <Container>
        <Table
          onChange={handleFilterChange}
          loading={listLoading}
          columns={columns}
          pagination={false}
          rowKey={"taskCode"}
          dataSource={tableData?.records ?? []}
        />
        <Pagination
          className="pr-2"
          current={pagination?.current}
          pageSize={pagination?.pageSize}
          total={tableData?.total}
          onChange={(page, pageSize) => {
            const p = { current: page, pageSize }
            setSessionPagination("TaskExtractor", p)
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
