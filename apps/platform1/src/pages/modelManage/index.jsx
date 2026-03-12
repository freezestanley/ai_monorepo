/*
 * @Author: Dyton
 * @Date: 2024-03-16 10:26:23
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-27 18:07:43
 * @FilePath: /za-aigc-platform-admin-static/src/pages/modelManage/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useEffect, useState } from "react"
import { Table, Pagination, Input, Button } from "antd"
import { debounce } from "lodash"
import styles from "./index.module.scss"
import SwitchDeleteModel from "./SwitchDeleteModel"
import AddEditModel from "./AddEditModel"
import { useModelTypesApi, useModelsListApi } from "@/api/modelManage"
import { translateExecuteMode } from "@/constants/modelManage"
export const ModelManage = () => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [modelName, setModelName] = useState("")
  const debounceSetSearch = debounce((e) => {
    setPagination({ current: 1, pageSize: 10 })
    setModelName(e)
  }, 1000)
  const [openModal, setOpenModal] = useState(false)
  const [record, setRecord] = useState(null)
  // 列表
  const { data: tableData, isLoading: listLoading } = useModelsListApi({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    ...(modelName ? { query: modelName } : {})
  })
  // 模态
  const { data: modelTypeOptions } = useModelTypesApi({})
  const columns = [
    {
      title: "模型名称",
      dataIndex: "name"
    },

    {
      title: "客户端类型",
      dataIndex: "executeMode",
      render: translateExecuteMode
    },
    {
      title: "操作",
      dataIndex: "opration",
      width: 200,
      render: (text, record) => (
        <>
          <SwitchDeleteModel record={record} />
          <Button type="link" onClick={() => setRecord(record)}>
            编辑
          </Button>
        </>
      )
    }
  ]

  const onChangeSearch = (e) => {
    if (e.target.value === "") debounceSetSearch("")
    else debounceSetSearch(e.target.value)
  }

  const onModalOpen = (open) => {
    setOpenModal(open)
    if (!open) setRecord(null)
  }
  useEffect(() => {
    if (record) setOpenModal(true)
  }, [record])

  return (
    <div className={styles["model-main"]}>
      <div className={styles["search-box"]}>
        <Input style={{ width: 300 }} placeholder="请输入模型名称" onChange={onChangeSearch} />
        <div>
          <Button type="primary" onClick={() => onModalOpen(true)}>
            新增
          </Button>
        </div>
      </div>
      <>
        <Table
          loading={listLoading}
          columns={columns}
          pagination={false}
          rowKey={"configNo"}
          dataSource={tableData?.list ?? []}
        />
        <Pagination
          className="pr-2"
          current={pagination?.current}
          pageSize={pagination?.pageSize}
          total={tableData?.totalCount}
          onChange={(page, pageSize) => {
            const p = { current: page, pageSize }
            setPagination(p)
          }}
          showSizeChanger={true}
          style={{ marginTop: "15px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
        />
      </>
      <AddEditModel
        modelTypeOptions={modelTypeOptions}
        openModal={openModal}
        record={record}
        setOpenModal={onModalOpen}
      />
    </div>
  )
}

export default ModelManage
