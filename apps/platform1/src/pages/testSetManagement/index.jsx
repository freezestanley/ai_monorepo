// @ts-nocheck
import { useState, useRef } from "react"
import { Table, Button, Modal, Form, Input, Row, Col, message, Pagination, Tooltip } from "antd"
import { DeleteOutlined, LeftOutlined } from "@ant-design/icons"
import { useDeleteTestSet, useGetTestSetListByPage, useSaveTestSet } from "@/api/testSet"
import { debounce } from "lodash"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import OverflowTooltip from "@/components/overflowTooltip"
import { Space } from "antd"
import { TableFilter } from "@/utils/tableFliter"

function TestSetManagement() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, studioenv } = queryParams
  const navigate = useNavigate()

  const [visible, setVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [params, setParams] = useState({})
  const [sortAndFilterState, setSortAndFilterState] = useState({
    orderField: "",
    asc: ""
  })

  console.log("botNoL:", botNo)

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  const { data: { list = [], totalCount } = {}, refetch } = useGetTestSetListByPage({
    botNo,
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    ...sortAndFilterState,
    ...params
  })

  const { mutate: saveTestSet } = useSaveTestSet()
  const { mutate: deleteTestSet } = useDeleteTestSet()

  const tableList = list

  const handleSortOrFilterChange = (pagination, filters, sorter) => {
    const { order, field } = sorter
    setSortAndFilterState({
      orderField: !order ? "" : field === "gmtCreated" || field === "gmtModified" ? field : "",
      asc: order === "ascend" ? "true" : order === "descend" ? "false" : ""
    })
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: "【删除】后，相关测试任务若运行中将中断",
      icon: <DeleteOutlined />,
      // content: "删除后不可恢复",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        deleteTestSet(
          { botNo, setNo: record.setNo },
          {
            onSuccess: (e) => {
              // @ts-ignore
              if (e.success) {
                message.success("删除成功")
                refetch()
              } else {
                // @ts-ignore
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const searchInput = useRef(null)

  const columns = [
    {
      title: "测试集编号",
      dataIndex: "setNo",
      width: 153,
      ...TableFilter({
        form: filterForm, // 表单 form
        searchParams: {
          setNo: filterForm.getFieldValue("setNo")
        }, // 搜索条件
        searchInput: searchInput, // useRef(null)
        refresh: (value) => {
          handleQuery(value, "setNo")
        }, // 刷新方法
        dataIndex: "setNo", //item.fieldKey, // index key
        fieldType: "" //item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
        // enums: item.enums // select 枚举
      }),
      render: (text) => <OverflowTooltip text={text} overflowCount={86} singleLine={false} />
    },
    {
      title: "测试集名称",
      dataIndex: "setName",
      width: 250,
      ...TableFilter({
        form: filterForm, // 表单 form
        searchParams: {
          setName: filterForm.getFieldValue("setName")
        }, // 搜索条件
        searchInput: searchInput, // useRef(null)
        refresh: (value) => {
          handleQuery(value, "setName")
        }, // 刷新方法
        dataIndex: "setName", //item.fieldKey, // index key
        fieldType: "" //item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
        // enums: item.enums // select 枚举
      })
    },
    {
      title: "用途说明",
      dataIndex: "description",
      width: 250,
      render: (text) => <OverflowTooltip text={text} overflowCount={86} singleLine={false} />
    },
    {
      title: "数据条数",
      dataIndex: "count",
      sorter: true,
      width: 107,
      align: "right"
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      sorter: true,
      width: 207,
      render: (text, { creator }) => {
        return (
          <div>
            {" "}
            {creator} {text}{" "}
          </div>
        )
      }
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      sorter: true,
      width: 207,
      render: (text, { modifier }) => {
        return (
          <div>
            {" "}
            {modifier} {text}{" "}
          </div>
        )
      }
    },
    {
      title: "操作",
      width: 126,
      fixed: "right",
      render: (record) => (
        <Space size="large">
          <Tooltip placement="bottom" title="编辑">
            <i
              onClick={() => handleEdit(record)}
              className="iconfont icon-Edit  text-[16px] text-[#0E121B)] cursor-pointer hover:text-[#7f56d9] font-500"
            ></i>
          </Tooltip>

          {/* <Button
            className="p-0"
            type="link"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button> */}
          <Tooltip placement="bottom" title="查看">
            <i
              onClick={() => handleView(record)}
              className="iconfont icon-View text-[16px] text-[#0E121B)] cursor-pointer hover:text-[#7f56d9] font-500"
            ></i>
          </Tooltip>

          {/* <Button
            className="p-1"
            type="link"
            onClick={() => handleView(record)}
          >
            查看
          </Button> */}
          <Tooltip placement="bottom" title="删除">
            <i
              onClick={() => handleDelete(record)}
              className="iconfont icon-shanchu1 text-[16px] text-[#0E121B)] cursor-pointer hover:text-red-600 font-500"
            ></i>
          </Tooltip>

          {/* <Button
            className="p-1"
            type="link"
            danger
            onClick={() => handleDelete(record)}
          >
            删除
          </Button> */}
        </Space>
      )
    }
  ]

  const handleEdit = (record) => {
    form.setFieldsValue(record)
    setIsEditing(true)
    setCurrentRecord(record)
    setVisible(true)
  }

  const handleView = (record) => {
    const { setNo, setName } = record
    navigate(
      `/test/set/data/list?botNo=${botNo}&setNo=${setNo}&setName=${setName}&studioenv=${studioenv || ""}`
    )
  }

  const handleCreate = () => {
    form.resetFields()
    setIsEditing(false)
    setCurrentRecord(null)
    setVisible(true)
  }
  // 跳转到测试变量管理页面
  const handleToRoute = () => {
    navigate(`/test/variable?botNo=${botNo}`)
  }

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const params = {
          ...values,
          setNo: currentRecord?.setNo,
          botNo
        }

        saveTestSet(params, {
          onSuccess: (e) => {
            if (e.success) {
              message.success("保存成功")
              setVisible(false)
              refetch()
            } else {
              message.error(e.message)
            }
          }
        })
      })
      .catch((info) => {
        console.log("Failed:", info)
      })
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const handleQuery = (value, key) => {
    setParams({ content: value?.trim() || undefined })
    setPagination({
      pageSize: pagination.pageSize,
      current: 1,
      content: value?.trim() || undefined
    })
    filterForm.setFieldsValue({ [key]: value?.trim() })
    // filterForm
    //   .validateFields()
    //   .then((values) => {
    //     setParams(values)
    //     setPagination({ pageSize: pagination.pageSize, current: 1 })
    //   })
    //   .catch((errorInfo) => {
    //     console.log("Failed:", errorInfo)
    //   })
  }

  //   debounce(((value) => {
  //   setParams({ content: value || undefined })
  //   setPagination({ pageSize: pagination.pageSize, current: 1, content: value || undefined })
  //   // filterForm
  //   //   .validateFields()
  //   //   .then((values) => {
  //   //     setParams(values)
  //   //     setPagination({ pageSize: pagination.pageSize, current: 1 })
  //   //   })
  //   //   .catch((errorInfo) => {
  //   //     console.log("Failed:", errorInfo)
  //   //   })
  // }, 1000)

  return (
    <div className="admin-container admin-container-v2">
      <Form
        form={filterForm}
        layout="horizontal"
        initialValues={{
          setNo: undefined,
          setName: undefined,
          description: undefined
        }}
      >
        <div className="admin-header" style={{ display: "block" }}>
          {/* <div className="flex items-center justify-between w-full mb-2">
            <h2 className="flex items-center">测试集管理</h2>
          </div> */}
          <Row justify="space-between">
            {/* <Col span={6}>
              <Form.Item
                name="setNo"
                rules={[
                  { required: false, message: "请输入测试集编号或测试集名称!" }
                ]}
              >
                <Input
                  placeholder="请输入测试集编号/测试集名称"
                  allowClear
                // onChange={handleQuery}
                />
              </Form.Item>
            </Col> */}
            <Col
              span={24}
              style={{
                display: "flex",
                justifyContent: "flex-start"
              }}
            >
              <Button className="w-[84px] h-[36px]" type="primary" onClick={handleCreate}>
                <i className="iconfont icon-chuangjian mt-[2px]"></i>
                创建
              </Button>
              <Button className="ml-3" onClick={handleToRoute}>
                测试变量
              </Button>
            </Col>
          </Row>
        </div>

        <div className="admin-content admin-content-v2">
          <Table
            // @ts-ignore
            columns={columns}
            dataSource={tableList}
            pagination={false}
            scroll={{ y: "77vh", x: 1200 }}
            onChange={handleSortOrFilterChange}
            className="table-style-v2"
            rowClassName={(record, index) => {
              if (index % 2 === 0) {
                return "table-style-v2-even-row"
              } else {
                return "table-style-v2-odd-row"
              }
            }}
          />

          {totalCount > 0 && (
            <Pagination
              // className="fixed-pagination pagination-v2"
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={totalCount}
              onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
              showSizeChanger={true}
              style={{ marginTop: "10px", textAlign: "right" }}
              showTotal={(total) => `共${total}条`}
            />
          )}
        </div>
      </Form>

      <Modal
        title={isEditing ? "编辑测试集" : "新建测试集"}
        open={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        closable={false}
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 24 }} layout={"vertical"}>
          <Form.Item
            name="setName"
            label="测试集名称"
            rules={[{ required: true, message: "请输入测试集名称!" }]}
          >
            <Input placeholder="请输入测试集名称" />
          </Form.Item>
          <Form.Item name="description" label="用途说明">
            <Input.TextArea placeholder="请输入用途说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TestSetManagement
