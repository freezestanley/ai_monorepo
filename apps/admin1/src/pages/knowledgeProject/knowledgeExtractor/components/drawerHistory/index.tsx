/*
 * @Author: hantao
 * @Date: 2024-04-24 17:33:04
 * @Descripttion:知识萃取-批次实例列表
 * @LastEditors:  wb_hantao@zhongan.com
 * @LastEditTime: 2024-04-26 16:13:10
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/drawerHistory.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import React, { useState } from "react"
import { useFetchIntentionOperationLogListByPage } from "@/api/InstanceBatchExtractorDetail"
import { Pagination, Table, Empty, Spin } from "antd"
import styles from "./index.module.scss"
const statusEnum = {
  ACCEPT: "采纳",
  REJECT: "不采纳",
  INIT: "待确认"
}
const drawerHistory = ({ intentionId }) => {
  const [pagination, setPagination] = useState({ pageSize: 10, pageNum: 1 })
  const { data, isLoading } = useFetchIntentionOperationLogListByPage({
    ...pagination,
    intentionId
  })
  const columns = [
    {
      dataIndex: "text",
      title: "建议话术",
      width: 300,
      render: (v) => {
        return v || "--"
      }
    },
    {
      dataIndex: "status",
      title: "采纳状态",
      width: 50,
      render: (v) => {
        return statusEnum[v] || "--"
      }
    }
  ]
  return (
    <div className={styles.drawerHistory}>
      <div className={styles.historyList}>
        {data?.records && data.records.length > 0 ? (
          data?.records?.map((item) => {
            return (
              <div className={styles.historyItem}>
                <div className={styles.content}>
                  <div className={styles.label}>操作人:</div>
                  <div className={styles.value}>{item?.operator || "--"}</div>
                </div>
                <div className={styles.content}>
                  <div className={styles.label}>操作时间:</div>
                  <div className={styles.value}>{item?.operationTime || "--"}</div>
                </div>
                <div className={styles.content}>
                  <div className={styles.label}>操作内容:</div>
                  <div className={styles.value}></div>
                </div>
                <div style={{ background: "#fff", padding: "15px", borderRadius: "5px" }}>
                  <div className={styles.content} style={{ padding: "5px", background: "#fff" }}>
                    <div className={styles.label}>意图:</div>
                    <div className={styles.value}>{item?.intentionDetail?.name || "--"}</div>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <div className={styles.value}>{statusEnum[item?.intentionDetail?.status]}</div>
                  </div>
                  <Table
                    pagination={false}
                    scroll={{ y: 300 }}
                    size="small"
                    dataSource={item?.intentionDetail?.dialogueList || []}
                    columns={columns}
                  ></Table>
                </div>
              </div>
            )
          })
        ) : (
          <Empty description="该条记录无操作历史"></Empty>
        )}
      </div>
      {data?.records && data.records.length > 0 ? (
        <Pagination
          size="small"
          className="pr-2"
          current={pagination?.pageNum}
          pageSize={pagination?.pageSize}
          total={data?.total}
          onChange={(page, pageSize) => {
            const p = { pageNum: page, pageSize }
            setPagination(p)
          }}
          showSizeChanger={true}
          style={{ marginTop: "15px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
        />
      ) : null}
    </div>
  )
}

export default drawerHistory
