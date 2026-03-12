// 测试变量管理页面

import OverflowTooltip from "@/components/overflowTooltip"
import { LeftOutlined, DeleteOutlined } from "@ant-design/icons/lib"
import { Col, Row, Button, Table, Pagination, Input, Form, Tooltip, Modal, message } from "antd"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { variableModal } from "./components/variableModal"
import { useVariableListByPage, useDeleteVariable } from "@/api/testSet"
import useRouter from "@/router/useRouter"
import { debounce } from "lodash"
import { Space } from "antd"
import { TableFilter } from "@/utils/tableFliter"
import { useRef } from "react"

function TestSetVariable() {
  const { currentLocationParams } = useRouter()
  const { botNo } = currentLocationParams()
  const [params, setParams] = useState({})

  const navigate = useNavigate()
  const [filterForm] = Form.useForm()

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  const [sortAndFilterState, setSortAndFilterState] = useState({
    orderField: "",
    asc: ""
  })

  const searchInput = useRef(null)

  const columns = [
    {
      title: "测试变量名称",
      dataIndex: "variableName",
      width: 300,
      ...TableFilter({
        form: filterForm, // 表单 form
        searchParams: {
          variableName: filterForm.getFieldValue("variableName")
        }, // 搜索条件
        searchInput: searchInput, // useRef(null)
        refresh: (value) => {
          handleQuery(value, "variableName")
        }, // 刷新方法
        dataIndex: "variableName", //item.fieldKey, // index key
        fieldType: "" //item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
        // enums: item.enums // select 枚举
      }),
      render: (text) => <span>{`${text}`}</span>
    },
    {
      title: "测试变量描述",
      dataIndex: "description",
      width: 300,
      ...TableFilter({
        form: filterForm, // 表单 form
        searchParams: {
          description: filterForm.getFieldValue("description")
        }, // 搜索条件
        searchInput: searchInput, // useRef(null)
        refresh: (value) => {
          handleQuery(value, "description")
        }, // 刷新方法
        dataIndex: "description", //item.fieldKey, // index key
        fieldType: "" //item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
        // enums: item.enums // select 枚举
      }),
      render: (text) => <OverflowTooltip text={text} overflowCount={86} singleLine={false} />
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      sorter: true,
      render: (text, { creator }) => {
        return (
          <div>
            {" "}
            {creator} <br /> {text}{" "}
          </div>
        )
      }
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      sorter: true,
      render: (text, { modifier }) => {
        return (
          <div>
            {" "}
            {modifier} <br /> {text}{" "}
          </div>
        )
      }
    },
    {
      title: "操作",
      width: 140,
      render: (record) => (
        <Space size="large">
          <Tooltip placement="bottom" title="编辑">
            <i
              onClick={() => {
                variableModal({
                  detail: {
                    botNo: botNo,
                    ...record,
                    id: record?.variableName
                  },
                  onOk: () => {
                    refetch()
                  }
                })
              }}
              className="iconfont icon-Edit  text-[16px] text-[#0E121B)] cursor-pointer hover:text-[#7f56d9] font-500"
            ></i>
          </Tooltip>

          <Tooltip placement="bottom" title="删除">
            <i
              onClick={() => {
                handleDelete(record)
              }}
              className="iconfont icon-shanchu1 text-[16px] text-[#0E121B)] cursor-pointer hover:text-red-600 font-500"
            ></i>
          </Tooltip>
        </Space>
      )
    }
  ]

  // router 返回
  const goBackHandle = () => {
    navigate(-1)
  }

  const handleSortOrFilterChange = (pagination, filters, sorter) => {
    const { order, field } = sorter
    setSortAndFilterState({
      orderField: !order ? "" : field === "gmtCreated" || field === "gmtModified" ? field : "",
      asc: order === "ascend" ? "true" : order === "descend" ? "false" : ""
    })
  }
  // 测试集列表
  const {
    data: { list = [], totalCount } = {},
    isLoading: pageLoading = false,
    refetch
  } = useVariableListByPage({
    botNo,
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    ...sortAndFilterState,
    ...params
  })

  const tableList = list

  const handleQuery = async (value, key) => {
    const values = await filterForm.validateFields()
    setParams({ ...values, [key]: value?.trim() || undefined })
    setPagination({
      pageSize: pagination.pageSize,
      current: 1
    })
    filterForm.setFieldsValue({ ...values, [key]: value?.trim() })
  }

  // const handleQuery = debounce(() => {
  //   filterForm
  //     .validateFields()
  //     .then((values) => {
  //       setParams(values)
  //       setPagination({ pageSize: pagination.pageSize, current: 1 })
  //     })
  //     .catch((errorInfo) => {
  //       console.log("Failed:", errorInfo)
  //     })
  // }, 1000)

  //删除
  const { mutate: deleteVar } = useDeleteVariable()

  const handleDelete = (record) => {
    Modal.confirm({
      title: "确定删除当前变量吗？",
      icon: <DeleteOutlined />,
      // content: "删除后不可恢复",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        deleteVar(
          { botNo, variableName: record.variableName },
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

  return (
    <div className="admin-container  admin-container-v2">
      <Tooltip title="返回上一层">
        <div
          onClick={goBackHandle}
          className="text-[18px] font-bold mb-[20px] hover:text-[#7F56D9] cursor-pointer w-[150px] mt-[20px]"
        >
          <LeftOutlined className="mr-[10px]  font-bold" />
          测试变量管理
        </div>
      </Tooltip>

      <Form form={filterForm} layout="horizontal">
        <div className="admin-header flex items-center !py-[3px]">
          {/* justify="space-between" */}
          <Row className="w-[100%]">
            {/* <Col span={6}>
              <span className="text-gray-600">变量名称：</span>
              <Form.Item
                name="variableName"
                className="mb-0 w-[100%]"
                rules={[{ required: false, message: "请输入变量名称!" }]}
              >
                <Input
                  placeholder="请输入测试变量名称"
                  allowClear
                  onChange={handleQuery}
                />
              </Form.Item>
            </Col> */}
            {/* <Col span={6}>
              <span className="text-gray-600"> 变量描述：</span>
              <Form.Item
                name="description"
                className="mb-0"
                rules={[{ required: false, message: "请输入变量描述!" }]}
              >
                <Input
                  placeholder="请输入测试变量描述"
                  allowClear
                  onChange={handleQuery}
                />
              </Form.Item>
            </Col> */}

            <Col
              span={24}
              style={{
                display: "flex",
                justifyContent: "flex-end"
              }}
            >
              <Button
                className="w-[84px] h-[36px]"
                type="primary"
                onClick={() => {
                  variableModal({
                    detail: {
                      botNo: botNo
                    },
                    onOk: () => {
                      console.log("我成功了")
                      refetch()
                    }
                  })
                }}
              >
                <i className="iconfont icon-chuangjian mt-[2px]"></i>
                创建
              </Button>
            </Col>
          </Row>
        </div>

        <div className="admin-content mt-[60px]">
          <Table
            // @ts-ignore
            columns={columns}
            dataSource={tableList || []}
            pagination={false}
            // scroll={{ y: 706 }}
            onChange={handleSortOrFilterChange}
            loading={pageLoading}
            scroll={{ y: "81vh", x: 900 }}
            className="table-style-v2"
            rowClassName={(record, index) => {
              if (index % 2 === 0) {
                return "table-style-v2-even-row"
              } else {
                return "table-style-v2-odd-row"
              }
            }}
          />

          <Pagination
            // className="fixed-pagination pagination-v2"
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={totalCount || 0} //totalCount
            onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
            showSizeChanger={true}
            style={{ marginTop: "10px", textAlign: "right" }}
            showTotal={(total) => `共${total}条`}
          />
        </div>
      </Form>
    </div>
  )
}

export default TestSetVariable
