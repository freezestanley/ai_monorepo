/*
 * @Author: Dyton
 * @Date: 2024-03-16 10:26:23
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-26 17:23:00
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtraction/components/KnowledgeExtraction.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useState, useCallback } from "react"
import { Table, Pagination, Input, Button } from "antd"
import { debounce } from "lodash"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import { useExtractorListApi, useJumpExtractTaskParamsApi } from "@/api/knowledgeExtraction"
import { fetchMarkResultExport } from "@/api/knowledgeExtraction/api"
import { useMemoryStorage } from "@/components/MemoryProvider"
import { skillTypeEnum } from "@/pages/knowledgeProject/knowledgeManage/extractionType"
import { MEMORY_STORAGE_KEYS } from "@/constants/memoryStorage"
import PageContainer from "@/components/PageContainer"
import { StatusBar, auditStatusEnum } from "./CustomUI"
import styles from "./index.module.scss"

export const KnowledgeExtraction = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const mpk = MEMORY_STORAGE_KEYS.KNOWLEDGE_EXTRACTOR_PAGINATION
  const queryParams = queryString.parse(search) ?? {}
  const { setMemoryPagination, getMemoryPagination } = useMemoryStorage()
  const [pagination, setPagination] = useState(getMemoryPagination(mpk))
  const [taskName, setTaskName] = useState("")
  const [downloading, setDownloading] = useState({})
  const { botNo } = queryParams
  const debounceSetSearch = debounce(setTaskName, 1000)
  // 萃取任务列表
  const { data: tableData, isLoading: listLoading } = useExtractorListApi({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    botNo,
    taskName
  })
  const { mutate: jumpExtractTaskParams } = useJumpExtractTaskParamsApi()

  const exportMarkResult = useCallback(async (record) => {
    setDownloading((preState) => ({ ...preState, [record.batchNo]: true }))
    try {
      await fetchMarkResultExport(record.batchNo, record.batchCode)
    } finally {
      setDownloading((preState) => ({ ...preState, [record.batchNo]: false }))
    }
  }, [])

  const jumpUrl = useCallback(
    (params) => {
      const { batchCode, skillType } = params || {}
      let urls = queryString.stringifyUrl({
        url: "/InstanceBatchExtractorDetail",
        query: {
          batchCode,
          botNo
        }
      })
      if (skillType === "1") {
        jumpExtractTaskParams(
          { botNo, batchCode },
          {
            onSuccess: (res) => {
              if (res?.success) {
                const { knowledgeBaseNo, catalogNo, structureNo, key, value } = res.data || {}
                urls = queryString.stringifyUrl({
                  url: "/viewStructureKnowledgeDetail",
                  query: {
                    knowledgeBaseNo,
                    catalogNo,
                    structureNo,
                    botNo,
                    searchKey: key,
                    searchValue: value
                  }
                })
                navigate(urls)
              }
            }
          }
        )
      } else {
        navigate(urls)
      }
    },
    [botNo, jumpExtractTaskParams, navigate]
  )

  const columns = [
    {
      title: "萃取批次编号",
      dataIndex: "batchCode",
      width: 300
    },
    {
      title: "工作流类型",
      dataIndex: "skillType",
      filters: Object.entries(skillTypeEnum).map(([value, text]) => ({
        value,
        text
      })),
      onFilter: (value, record) => {
        return record.skillType === value
      },
      render: (text) => skillTypeEnum[text]
    },
    {
      title: "萃取任务",
      dataIndex: "taskName",
      width: 300,
      render: (text, record) => (
        <div className="flex">
          <Button
            type="link"
            onClick={() => {
              const { batchCode } = record || {}
              const urls = queryString.stringifyUrl({
                url: "/knowledgeExtractionAdd",
                query: {
                  batchCode,
                  botNo
                }
              })
              navigate(urls)
            }}
          >
            {text}
          </Button>
        </div>
      )
    },
    {
      title: "数据样本量",
      dataIndex: "originDataCount"
    },
    {
      title: "实例数",
      dataIndex: "instanceCount"
    },

    {
      title: "状态",
      dataIndex: "status",
      render: (text) => <StatusBar type={text} />
    },
    {
      title: "创建时间",
      dataIndex: "gmtCreated"
    },
    {
      title: "审核状态",
      dataIndex: "auditStatus",
      render: (text) => auditStatusEnum[text]
    },
    {
      title: "完成时间",
      dataIndex: "auditEndTime"
    },
    {
      title: "操作",
      dataIndex: "opration",
      fixed: "right",
      render: (text, record) => (
        <div className="flex">
          {record.skillType === "1" ? (
            <Button
              type="link"
              onClick={() => {
                exportMarkResult(record)
              }}
              loading={downloading[record.batchNo]}
            >
              导出
            </Button>
          ) : (
            <Button
              type="link"
              onClick={() => {
                jumpUrl(record)
              }}
            >
              详情
            </Button>
          )}
        </div>
      )
    }
  ]
  const onChangeSearch = (e) => {
    if (e.target.value === "") debounceSetSearch("")
    else debounceSetSearch(e.target.value)
  }
  return (
    <PageContainer
      headerTitle="知识萃取"
      headerCustomeSearch={
        <div className={styles["search-box"]}>
          <Input
            style={{ width: 300 }}
            placeholder="请输入萃取任务名称"
            onChange={onChangeSearch}
          />
          <div>
            <Button
              type="primary"
              onClick={() => {
                navigate(`/knowledgeExtractionAdd?botNo=${botNo}`)
              }}
            >
              新增萃取任务
            </Button>
          </div>
        </div>
      }
    >
      <>
        <Table
          loading={listLoading}
          columns={columns}
          pagination={false}
          rowKey={"batchCode"}
          dataSource={tableData?.records ?? []}
          scroll={{ x: "max-content" }}
        />
        <Pagination
          className="pr-2"
          current={pagination?.current}
          pageSize={pagination?.pageSize}
          total={tableData?.total}
          onChange={(page, pageSize) => {
            const p = { current: page, pageSize }
            setMemoryPagination(mpk, p)
            setPagination(p)
          }}
          showSizeChanger={true}
          style={{ marginTop: "15px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
        />
      </>
    </PageContainer>
  )
}
