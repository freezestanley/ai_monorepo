import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import queryString from "query-string"
import PageContainer from "@/components/PageContainer"
import { Button, Col, Drawer, Form, Input, Popconfirm, Row, Select, Table, message } from "antd"
import {
  useFetchlistByPageDsInfo,
  useFetchSaveDataOrigin,
  useFetchModifyDsInfo,
  useFetchTestDsInfo,
  useFetchDeleteDsInfo
} from "@/api/dataManagement"
import styles from "../index.module.scss"
import { useEffect } from "react"
import { debounce } from "lodash"
const OriginTypeEnum = {
  1: "es"
}
const DataOrigin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const [resData, setResData] = useState({ list: [], total: 0 })
  const [formType, setFormType] = useState("")
  const [currentData, setCurrentData] = useState({ id: "" })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paginationInfo, setPaginationInfo] = useState({
    pageNum: 1,
    pageSize: 10
  })
  const { mutate: getList } = useFetchlistByPageDsInfo()
  const { mutate: saveOrigin } = useFetchSaveDataOrigin()
  const { mutate: editOrigin } = useFetchModifyDsInfo()
  const { mutate: testlink } = useFetchTestDsInfo()
  const { mutate: deleteOrigin } = useFetchDeleteDsInfo()
  const [form] = Form.useForm()
  const [formDrawer] = Form.useForm()
  const searchList = () => {
    const params = {
      ...paginationInfo,
      botNo,
      dsName: form.getFieldValue("dsName") || ""
    }
    getList(params, {
      onSuccess: (res) => {
        setResData({
          list: res.records,
          total: res.total
        })
      }
    })
  }
  const submitFn = () => {
    formDrawer.validateFields().then((v) => {
      const params = {
        ...v,
        botNo
      }
      if (formType === "新增") {
        saveOrigin(params, {
          onSuccess: (res) => {
            console.log(res)

            if (res.code === "200") {
              searchList()
              message.success("新增成功")
              setDrawerOpen(false)
            } else {
              message.error(res.message)
            }
          }
        })
      }
      if (formType === "编辑") {
        params.id = currentData.id
        editOrigin(params, {
          onSuccess: (res) => {
            console.log(v)
            if (res.code === "200") {
              searchList()
              message.success("编辑成功")
              setDrawerOpen(false)
            } else {
              message.error(res.message)
            }
          }
        })
      }
    })
  }
  const changeValueDebounce = debounce(() => {
    setPaginationInfo({
      ...paginationInfo,
      pageNum: 1
    })
  }, 1000)
  const deletefn = (id) => {
    const params = {
      id
    }
    deleteOrigin(params, {
      onSuccess: (v) => {
        searchList()
        message.success("删除成功")
      }
    })
  }
  const searchDom = () => {
    return (
      <div className={styles["searchbox"]}>
        <div>
          <Form form={form}>
            <Form.Item name="dsName">
              <Input
                allowClear
                placeholder="请输入数据源名称"
                style={{ width: "300px" }}
                onChange={(e) => {
                  changeValueDebounce()
                }}
              />
            </Form.Item>
          </Form>
        </div>
        <div style={{ textAlign: "right", width: "100%" }}>
          <Button
            type="primary"
            onClick={() => {
              ;(setDrawerOpen(true), setFormType("新增"), setCurrentData({ id: "" }))
            }}
          >
            新增
          </Button>
        </div>
      </div>
    )
  }

  const handleTestlink = () => {
    testlink(
      { botNo, ...(formDrawer.getFieldsValue() || {}) },
      {
        onSuccess: (v) => {
          console.log(v)
          if (v.success) {
            message.success("该连接有效")
          } else {
            message.error(v.message)
          }
        }
      }
    )
  }
  const columns = [
    {
      title: "ID",
      dataIndex: "id"
    },
    {
      title: "数据源名称",
      dataIndex: "dsName"
    },
    {
      title: "数据源类型",
      dataIndex: "dsType",
      render: (v) => {
        return OriginTypeEnum[v] || "-"
      }
    },
    {
      title: "创建人",
      dataIndex: "modifier"
    },
    {
      title: "最近更新时间",
      dataIndex: "gmtModified"
    },
    {
      title: "操作",
      dataIndex: "action",
      align: "center",
      fixed: "right",
      render: (v, record) => {
        return [
          <Button
            type="link"
            onClick={() => navigate(`/dataField?dsId=${record.id}&botNo=${botNo}`)}
          >
            配置字段
          </Button>,
          <Button
            type="link"
            onClick={() => {
              ;(setDrawerOpen(true), setFormType("编辑"), formDrawer.setFieldsValue(record))
              setCurrentData(record)
            }}
          >
            编辑
          </Button>,
          <Popconfirm
            title="确认删除?"
            onConfirm={() => {
              deletefn(record.id)
            }}
          >
            <Button danger type="link">
              删除
            </Button>
          </Popconfirm>
        ]
      }
    }
  ]
  useEffect(() => {
    searchList()
  }, [paginationInfo])
  return (
    <div>
      <PageContainer headerTitle="数据管理" headerCustomeSearch={searchDom()}>
        <Table
          columns={columns}
          scroll={{ x: "max-content" }}
          dataSource={resData.list}
          pagination={{
            showSizeChanger: true,
            total: resData.total,
            onChange: (page, size) => {
              console.log(page, size)
              setPaginationInfo({
                pageNum: page,
                pageSize: size
              })
            }
          }}
        ></Table>
        <Drawer
          open={drawerOpen}
          width="600px"
          title={formType}
          onClose={() => {
            setDrawerOpen(false)
            formDrawer.resetFields()
          }}
        >
          <Form labelCol={{ span: 5 }} form={formDrawer}>
            <Form.Item
              label="数据源名称"
              name="dsName"
              rules={[{ required: true, message: "请填写数据源名称" }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item
              label="数据源类型"
              name="dsType"
              rules={[{ required: true, message: "请选择数据源类型" }]}
            >
              <Select placeholder="请选择" options={[{ label: "es", value: "1" }]} />
            </Form.Item>
            <Form.Item
              label="地址"
              name="dsAddress"
              rules={[{ required: true, message: "请填写地址" }]}
            >
              <Input placeholder="请选择" />
            </Form.Item>
            <Form.Item
              label="集群名称"
              name="dsClusterName"
              rules={[{ required: true, message: "请填写认证Id" }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item
              label="索引名称"
              name="index"
              rules={[{ required: true, message: "请填写认证Key" }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item label="数据同步地址" name="dataSyncAddr">
              <Input placeholder="请输入" />
            </Form.Item>
          </Form>
          <div style={{ width: "100%", textAlign: "right" }}>
            <Button type="primary" style={{ marginRight: "5px" }} onClick={submitFn}>
              保存
            </Button>
            <Button type="primary" style={{ marginRight: "5px" }} onClick={handleTestlink}>
              测试连接
            </Button>
            <Button
              onClick={() => {
                setDrawerOpen(false)
              }}
            >
              取消
            </Button>
          </div>
        </Drawer>
      </PageContainer>
    </div>
  )
}

export default DataOrigin
