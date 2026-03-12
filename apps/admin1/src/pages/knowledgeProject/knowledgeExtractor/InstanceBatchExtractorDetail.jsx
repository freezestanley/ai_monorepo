/*
 * @Author: hantao
 * @Date: 2024-04-24 17:33:04
 * @Descripttion:知识萃取-批次实例列表
 * @LastEditors:  wb_hantao@zhongan.com
 * @LastEditTime: 2024-04-26 16:13:10
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/InstanceBatchExtractorDetail.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useEffect, useRef, useState } from "react"
import { Container, Header } from "./components"
import {
  Table,
  Pagination,
  Input,
  Button,
  Select,
  Drawer,
  message,
  Modal,
  Form,
  Tooltip
} from "antd"
import "./styles/index.scss"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { useFetchIntentionListByPage } from "@/api/InstanceBatchExtractorDetail"
import { exportIntention } from "@/api/InstanceBatchExtractorDetail/api"
import Intention from "./components/drawerIntention"
import DrawerHistory from "./components/drawerHistory"
const isNewEnum = {
  true: "新增",
  false: "已有"
}
const handleStatusEnum = {
  PENDING: "待优化",
  COMPLETED: "完成",
  IN_PROGRESS: "优化中"
}

export const InstanceBatchExtractorDetail = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, batchCode, source } = queryParams
  const [pagination, setPagination] = useState({ pageSize: 10, pageNum: 1 })
  const [showEdit, setShowEdit] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [formType, setFormType] = useState("show")
  // 操作了表单没保存不允许关闭抽屉
  const [changeFlag, setChangeFlag] = useState(false)
  // 表单数据
  const [searchParams, setSearchParams] = useState({})
  const [data, setData] = useState({ records: [], total: 0 })
  // 查看 编辑 编辑历史需要的值
  const [currentData, setCurrentData] = useState({ id: "" })
  const [form] = Form.useForm()
  const childRef = useRef(null)
  useEffect(() => {
    getList()
  }, [pagination])
  // 获取详情列表
  const { mutate: getListPage } = useFetchIntentionListByPage()
  const getList = () => {
    if (!batchCode) {
      return message.warning("缺少参数batchCode")
    }
    getListPage(
      {
        batchNo: batchCode || "-",
        ...pagination,
        ...(form.getFieldsValue() || {})
      },
      {
        onSuccess: (v) => {
          setData(v)
        }
      }
    )
  }
  // 关闭意图抽屉
  const onClose = () => {
    if (changeFlag) {
      Modal.confirm({
        content: "当前变更未保存，是否确认关闭页面！",
        onOk: () => {
          setShowEdit(false)
          setCurrentData({ id: "" })
          setChangeFlag(false)
        }
      })
    } else {
      getList()
      setShowEdit(false)
      setCurrentData({ id: "" })
    }
  }
  // 关闭操作历史抽屉
  const onCloseHistory = () => {
    setShowHistory(false)
  }
  // 子组件是否操作过
  const getChildChangeFn = (v) => {
    setChangeFlag(v)
  }
  // 查询
  const searchFn = () => {
    setSearchParams(form.getFieldsValue() || {})
    setPagination({
      ...pagination,
      pageNum: 1
    })
  }
  // 导出
  const handleExport = () => {
    if (!batchCode) {
      return message.warning("缺少参数batchCode")
    }
    exportIntention({
      ...searchParams,
      ...pagination,
      batchNo: batchCode || "-"
    }).then((res) => {
      console.log(res)
    })
  }
  const columns = [
    {
      title: "生成意图",
      dataIndex: "originName",
      width: 200
    },
    {
      title: "意图类型",
      dataIndex: "isNew",
      width: 100,
      render: (v) => {
        return isNewEnum[v] || "-"
      }
    },
    {
      title: "处理状态",
      dataIndex: "handleStatus",
      width: 100,
      render: (v) => {
        return handleStatusEnum[v]
      }
    },
    {
      title: "采纳意图",
      dataIndex: "name",
      width: 200,
      render: (v) => {
        return v || "-"
      }
    },
    {
      title: "生成话术",
      dataIndex: "originDialogueList",
      width: 300,
      ellipsis: {
        showTitle: false
      },
      render: (v, record) => {
        const arr = v.map((item) => item.text)
        return (
          <Tooltip trigger="hover" placement="topLeft" title={arr?.join(",") || "-"}>
            {arr?.join(",") || "-"}
          </Tooltip>
        )
      }
    },
    {
      title: "采纳话术",
      dataIndex: "suggestDialogueList",
      width: 300,
      ellipsis: {
        showTitle: false
      },
      render: (v, record) => {
        const arr = v.map((item) => item.text)
        return (
          <Tooltip trigger="hover" placement="topLeft" title={arr?.join(",") || "-"}>
            {arr?.join(",") || "-"}
          </Tooltip>
        )
      }
    },

    {
      title: "处理人",
      width: 150,
      dataIndex: "modifier"
    },
    {
      title: "处理时间",
      width: 200,
      dataIndex: "gmtModified"
    },
    {
      title: "操作",
      dataIndex: "id",
      width: 240,
      fixed: "right",
      render: (text, record) => [
        <Button
          type="link"
          onClick={() => {
            ;(setShowEdit(true), setFormType("show"), setCurrentData(record))
          }}
        >
          查看
        </Button>,
        <Button
          type="link"
          onClick={() => {
            ;(setShowEdit(true), setFormType("edit"), setCurrentData(record))
          }}
        >
          编辑
        </Button>,
        <Button
          type="link"
          onClick={() => {
            ;(setShowHistory(true), setCurrentData(record))
          }}
        >
          处理记录
        </Button>
      ]
    }
  ]
  return (
    <div id="InstanceBatchExtractorDetail">
      <Header title="萃取任务详情" backUrl={`/${source || "knowledgeExtraction"}?botNo=${botNo}`}>
        <div className="extractor-search-box">
          <Form form={form} layout="inline">
            <Form.Item name="intentionText" label="意图" style={{ marginBottom: "10px" }}>
              <Input style={{ width: 200 }} placeholder="请输入意图" allowClear />
            </Form.Item>
            <Form.Item name="isNew" label="意图类型">
              <Select
                allowClear
                style={{ width: 200 }}
                placeholder="请选择意图类型"
                options={[
                  { label: "新增", value: true },
                  { label: "已有", value: false }
                ]}
              />
            </Form.Item>
            <Form.Item name="handleStatus" label="处理状态">
              <Select
                allowClear
                style={{ width: 200 }}
                placeholder="请选择处理状态"
                options={[
                  { label: "待优化", value: "PENDING" },
                  { label: "完成", value: "COMPLETED" },
                  { label: "优化中", value: "IN_PROGRESS" }
                ]}
              />
            </Form.Item>
            <Form.Item name="modifier" label="处理人">
              <Input allowClear style={{ width: 200 }} placeholder="请输入处理人" />
            </Form.Item>
          </Form>
        </div>
        <div className="extractor-tool">
          <Button onClick={searchFn}>查询</Button>
          {/* <Button style={{ marginLeft: "5px" }} onClick={handleExport}>
            导出
          </Button> */}
        </div>
      </Header>
      <Container>
        <Table
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            onChange: (page, size) => {
              setPagination({
                pageNum: page,
                pageSize: size
              })
            },
            total: data?.total || 0,
            pageSize: pagination.pageSize,
            current: pagination.pageNum
          }}
          dataSource={data?.records || []}
          scroll={{ x: 1200 }}
          columns={columns}
        ></Table>

        <Drawer
          getContainer={() => document.getElementById("InstanceBatchExtractorDetail")}
          title={
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between"
              }}
              classNames="IntentionDrawer"
            >
              <div>{formType === "show" ? "查看" : "编辑"}</div>
              <Button
                type="primary"
                disabled={formType === "show"}
                onClick={() => {
                  childRef?.current?.save()
                }}
              >
                保存
              </Button>
            </div>
          }
          onClose={onClose}
          open={showEdit}
          width="90%"
        >
          {showEdit && (
            <Intention
              ref={childRef}
              getChildChange={getChildChangeFn}
              type={formType}
              intentionId={currentData.id}
              botNo={botNo}
            ></Intention>
          )}
        </Drawer>
        <Drawer title="操作历史" onClose={onCloseHistory} open={showHistory} width="90%">
          {showHistory && <DrawerHistory intentionId={currentData.id}></DrawerHistory>}
        </Drawer>
      </Container>
    </div>
  )
}

export default InstanceBatchExtractorDetail
