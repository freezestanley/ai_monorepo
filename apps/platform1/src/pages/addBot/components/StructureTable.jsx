import { useEffect, useMemo, useRef, useState } from "react"
import { TableFilter } from "@/utils/tableFliter"
import {
  Table,
  Input,
  Button,
  Switch,
  Form,
  Modal,
  Pagination,
  message,
  Popconfirm,
  Tooltip,
  notification,
  Radio,
  Space,
  Card,
  Typography,
  Select,
  TreeSelect,
  Drawer
} from "antd"
import { useChangeDocumentStatus, useRetryAddDocument } from "@/api/knowledge"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { debounce } from "lodash"
import OverflowTooltip from "@/components/overflowTooltip"
import StatusBadge from "@/components/StatusBadge"
import { Popover } from "antd"
import {
  useChangeStructureDatasetStatus,
  useCreateStructureDataset,
  useDeleteStructureDataset,
  useEditStructureDataset,
  useFetchStructureDatasetDetail,
  useFetchStructureDatasetList
} from "@/api/structureKnowledge"
import DynamicFieldSet from "./DynamicFieldSet"
import { useNavigate, useParams } from "react-router-dom"
import AddStructureDataFromDoc from "./AddStructureDataFromDoc"
import { ALL } from "@/components/CustomSelect"
import useRouter from "@/router/useRouter"
import queryString from "query-string"
import BatchOperations from "@/components/BatchOperations"
import StructureKnowledgeDetailDrawer from "./StructureKnowledgeDetailDrawer"
const { Title } = Typography

const StructureTable = ({
  docCategories = [],
  selectNode,
  selectedKnowledgeBase,
  isAntron,
  viewAvAlible,
  sourceTag,
  onSelect
}) => {
  const [form] = Form.useForm()
  const [searchValue, setSearchValue] = useState("")
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editStrategies, setEditStrategies] = useState([])
  const [initPermissionControl, setInitPermissionControl] = useState(0)
  const [initUseSceneTag, setInitUseSceneTag] = useState(0)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isAddDataModalVisible, setIsAddDataModalVisible] = useState(false)
  const [addModalType, setAddModalType] = useState("1")
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const queryClient = useQueryClient()
  const [docAction, setDocAction] = useState("add") // 'add', 'view', 'edit'
  const [currentFile, setCurrentFile] = useState({ name: "", url: "" })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filterParams, setFilterParams] = useState({
    sourceDesc: null,
    statusDesc: null,
    structureNoSearch: null,
    nameSearch: null,
    sort: {}
  })
  const [switchStatus, setSwitchStatus] = useState({})

  const [sourceSwitch, setSourceSwitch] = useState(false)
  const [sceneSwitch, setSceneSwitch] = useState(false)

  // 添加抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false)
  // 添加当前查看的详情数据
  const [currentDetailData, setCurrentDetailData] = useState(null)

  const searchParams = queryString.parse(window.location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const { token: isIframe, structureNo } = searchParams.token ? searchParams : hashParams

  useEffect(() => {
    structureNo && setSearchValue(structureNo)
  }, [structureNo])

  useEffect(() => {
    pagination.current = 1
    setSelectedRowKeys([])
  }, [selectNode?.catalogNo])

  const structureNoRef = useRef(null)
  // const { botNo } = useParams()
  const { currentLocationParams } = useRouter()
  const { botNo } = currentLocationParams()
  const { data: tableData, refetch: tableDataRefetch } = useFetchStructureDatasetList({
    knowledgeBaseNo: selectedKnowledgeBase,
    catalogNo: selectNode?.catalogNo,
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    search: filterParams.structureNoSearch || filterParams.nameSearch || searchValue,
    status: filterParams.statusDesc,
    source: filterParams.sourceDesc,
    sortFields: filterParams.sort?.order && [
      {
        field: filterParams.sort.field,
        sort: filterParams.sort.order === "ascend" ? "ASC" : "DESC"
      }
    ]
  })

  const rejectDeleteText = useMemo(() => {
    if (selectedRowKeys.length === 0) {
      return ""
    }
    const selectedRows = tableData?.data?.records?.filter((record) =>
      selectedRowKeys.includes(record.structureNo)
    )
    if (selectedRows?.some((record) => record.status === 1)) {
      return "存在已上线知识，无法执行批量删除"
    }
    return ""
  }, [selectedRowKeys, tableData])

  const debounceSetSearch = debounce((value) => {
    setSearchValue(value)
  }, 1000)

  const navigate = useNavigate()

  const { mutate: changeStatus } = useChangeDocumentStatus()
  const { mutate: addDateSet } = useCreateStructureDataset()
  const { mutate: editDataSet } = useEditStructureDataset()
  const { mutate: viewDocument } = useFetchStructureDatasetDetail()
  const { mutate: retryAddDocument } = useRetryAddDocument()
  const { mutate: deleteDataSet } = useDeleteStructureDataset()
  const { mutate: changeStructureDatasetStatus } = useChangeStructureDatasetStatus()

  const handleAddDocument = () => {
    structureNoRef.current = null
    setDocAction("add")
    setIsModalVisible(true)
  }

  const handleSwitchChange = (e, record) => {
    console.log(e, record)
    changeStructureDatasetStatus(
      {
        knowledgeBaseNo: selectedKnowledgeBase,
        catalogNo: record.catalogNo,
        structureNo: record.structureNo,
        status: e ? 1 : 0
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success(e.message)
            queryClient.invalidateQueries([QUERY_KEYS.FETCHSTRUCTUREDATASETLIST])
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const handleTableChange = (pagination, filter, sort) => {
    console.log(filter, sort)
    setFilterParams({
      ...filter,
      sort
    })
  }

  // 查看
  const handleView = (record) => {
    // 保存当前查看的数据
    setCurrentDetailData(record)
    // 显示抽屉
    setDrawerVisible(true)

    // 原来的跳转代码注释掉
    // navigate(
    //   `/viewStructureKnowledgeDetail?knowledgeBaseNo=${selectedKnowledgeBase}&catalogNo=${record.catalogNo}&structureNo=${record.structureNo}&botNo=${botNo}`
    // )
  }

  // 编辑
  const handleEdit = (record) => {
    setDocAction("edit")
    structureNoRef.current = record.structureNo
    viewDocument(
      {
        knowledgeBaseNo: selectedKnowledgeBase,
        catalogNo: record.catalogNo,
        structureNo: record.structureNo
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            // e.data为详情数据,开始回显逻辑
            const current = e.data
            const strategies = current.strategies.map((strategy) => {
              return {
                ...strategy,
                tags: {
                  type: strategy.visibleType,
                  selectedOptions: strategy.tagKeys
                }
              }
            })

            form.setFieldsValue({
              name: current.name,
              remark: current.remark,
              sourceSwitch: current.isPermissionControl == 1 ? true : false,
              sceneSwitch: current.isUseSceneTag == 1 ? true : false,
              strategies,
              catalogNo: current.catalogNo
            })
            setSourceSwitch(current.isPermissionControl == 1 ? true : false)
            setSceneSwitch(current.isUseSceneTag == 1 ? true : false)
            setEditStrategies(strategies || [])
            setInitPermissionControl(current.isPermissionControl || 0)
            setInitUseSceneTag(current.isUseSceneTag || 0)
            setIsModalVisible(true)
          }
        }
      }
    )
  }
  const handleDelete = (record) => {
    console.log(record)
    const title = record.name
    try {
      deleteDataSet(
        {
          knowledgeBaseNo: selectedKnowledgeBase,
          catalogNo: record.catalogNo,
          structureNo: record.structureNo
        },
        {
          onSuccess: (res) => {
            if (res?.success) {
              message.success(`删除 ${title} 成功`)
              // 刷新列表
              queryClient.invalidateQueries([QUERY_KEYS.FETCHSTRUCTUREDATASETLIST])
            } else {
              message.error(`删除 ${title} 失败`)
            }
          }
        }
      )
    } catch (error) {
      message.error(`删除 ${title} 失败`)
      console.log(":===>>>  error:", error)
    }
  }

  const handleOk = () => {
    console.log(form.getFieldsValue())
    form
      .validateFields()
      .then((values) => {
        console.log("Form values:", values)
        console.log(selectNode)
        const params = {
          ...values,
          strategies: values.strategies?.map((strategy) => {
            return {
              ...strategy,
              embeddingModel: +strategy.embeddingModel,
              visibleType: strategy?.tags?.type,
              tagKeys: strategy?.tags?.type === ALL ? [] : strategy?.tags?.selectedOptions
            }
          }),
          knowledgeBaseNo: selectedKnowledgeBase,
          catalogNo: values.catalogNo || selectNode.catalogNo,
          structureNo: structureNoRef.current,
          isPermissionControl: sourceSwitch ? 1 : 0,
          isUseSceneTag: sceneSwitch ? 1 : 0
        }

        onSelect([params.catalogNo])
        const fetch = docAction === "edit" ? editDataSet : addDateSet
        fetch(params, {
          onSuccess: (e) => {
            if (e.success) {
              message.success(e.message)
              queryClient.invalidateQueries([QUERY_KEYS.FETCHSTRUCTUREDATASETLIST])
            } else {
              notification.warning({
                message: "出错了",
                description: e.message
              })
            }
          }
        })

        setIsModalVisible(false)
        form.resetFields()
      })
      .catch((info) => {
        console.log("Validate Failed:", info)
      })
  }

  const handleUploadChange = (e, v) => {
    if (e.file.status === "done") {
      const file = e.file
      if (!form.getFieldValue("title")) {
        form.setFieldsValue({
          title: file.name.split(".").slice(0, -1).join(".")
        })
      }
    }
  }

  const onAddModalChange = (e) => {
    setAddModalType(e.target.value)
  }
  const handleAddModalOk = () => {
    if (addModalType === "2") {
      handleAddDocument()
      setIsAddModalVisible(false)
    } else if (addModalType === "1") {
      setIsAddDataModalVisible(true)
      setIsAddModalVisible(false)
    }
  }
  const handleAddModalCancel = () => {
    setIsAddModalVisible(false)
  }

  const handleAddDataModalOk = () => {
    console.log("hhhhh")
  }

  const handleAddDataModalCancel = () => {
    setIsAddDataModalVisible(false)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const structureNoSearchInput = useRef(null)
  const nameSearchInput = useRef(null)

  const columns = [
    {
      title: "数据集编号",
      dataIndex: "structureNo",
      key: "structureNo",
      width: 230,
      render: (description) => <OverflowTooltip text={description} />,
      ...TableFilter({
        form, // 表单 form
        searchParams: {
          structureNoSearch: filterParams.structureNoSearch
        }, // 搜索条件
        searchInput: structureNoSearchInput, // 使用专用的 ref
        refresh: (value) => {
          setFilterParams((p) => ({
            ...p,
            structureNoSearch: value,
            nameSearch: null // 清除另一个搜索条件，避免冲突
          }))
        }, // 刷新方法
        dataIndex: "structureNoSearch", // index key
        fieldType: "" // fieldType === "select" ： 搜索框，否则 input 输入框
      })
    },
    {
      title: "数据集标题",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (description) => <OverflowTooltip text={description} />,
      ...TableFilter({
        form, // 表单 form
        searchParams: {
          nameSearch: filterParams.nameSearch
        }, // 搜索条件
        searchInput: nameSearchInput, // 使用专用的 ref
        refresh: (value) => {
          setFilterParams((p) => ({
            ...p,
            nameSearch: value,
            structureNoSearch: null // 清除另一个搜索条件，避免冲突
          }))
        }, // 刷新方法
        dataIndex: "nameSearch", // index key
        fieldType: "" // fieldType === "select" ： 搜索框，否则 input 输入框
      })
    },
    {
      title: "摘要说明",
      dataIndex: "remark",
      key: "remark",
      width: 200,
      render: (text) => {
        return text ? <OverflowTooltip text={text} width={150} singleLine={false} /> : "--"
      }
    },
    {
      title: "数据集来源",
      dataIndex: "sourceDesc",
      key: "sourceDesc",
      width: 150,
      filters: [
        { text: "本地上传", value: 1 },
        { text: "线上数据集", value: 2 }
      ]
    },
    {
      title: "数据集状态",
      width: 120,
      dataIndex: "statusDesc",
      key: "statusDesc",
      filters: [
        { text: "未上线", value: 0 },
        { text: "已上线", value: 1 }
      ],
      render: (text, record) => <StatusBadge status={record.status === 1 ? "已上线" : "未上线"} />
    },
    {
      title: "数据集分类路径",
      width: 200,
      dataIndex: "catalogNoPathDesc",
      key: "catalogNoPathDesc"
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 180,
      sorter: true,
      render: (gmtCreator, record) => {
        return (
          <Tooltip
            title={
              <>
                <div>{record.creatorName}</div>
                <div>{gmtCreator}</div>
              </>
            }
          >
            <div>{record.creatorName}</div>
            <div>{gmtCreator}</div>
          </Tooltip>
        )
      }
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      key: "gmtModified",
      sorter: true,
      width: 180,
      render: (gmtModified, record) => {
        return (
          <Tooltip
            title={
              <>
                <div>{record.modifierName}</div>
                <div>{gmtModified}</div>
              </>
            }
          >
            <div>{record.modifierName}</div>
            <div>{gmtModified}</div>
          </Tooltip>
        )
      }
    },
    {
      title: "操作",
      key: "action",
      width: "240px",
      fixed: "right",
      render: (text, record) => (
        <div className="flex flex-wrap">
          <Popconfirm
            title={record.status === 1 ? "是否停用该数据集?" : "是否启用该数据集?"}
            onConfirm={() => {
              handleSwitchChange(record.status !== 1, record)
              setSwitchStatus((prev) => ({
                ...prev,
                [record.knowledgeBaseNo]: record.status !== 1
              }))
            }}
            okText="确认"
            cancelText="取消"
          >
            <span className="mt-[8px] mr-2" onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={
                  switchStatus[record.key] !== undefined
                    ? switchStatus[record.key]
                    : record.status === 1
                }
                checkedChildren="已上线"
                unCheckedChildren="未上线"
                className={`${record.status === 1 ? "!bg-[#1FC16B]" : "!bg-[#D0D5DD]"} [&>.ant-switch-inner-checked]:!text-white [&>.ant-switch-inner-unchecked]:!text-white [&>.ant-switch-inner-checked]:!text-[10px] [&>.ant-switch-inner-unchecked]:!text-[10px]`}
              />
            </span>
          </Popconfirm>
          {viewAvAlible && (
            <Button className="!pl-0" type="link" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}

          <Button type="link" onClick={() => handleView(record)}>
            查看
          </Button>
          {viewAvAlible && (
            <>
              {record.status !== 1 ? (
                <Popconfirm
                  title="是否【删除】该文档"
                  onConfirm={() => handleDelete(record)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button disabled={record.status === 1} type="link">
                    删除
                  </Button>
                </Popconfirm>
              ) : (
                <Popover content="停用后方可做删除操作" trigger="hover">
                  <Button disabled={true} type="link">
                    删除
                  </Button>
                </Popover>
              )}
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <Form form={form}>
      <div className={"container"}>
        <div className={"flex justify-between mb-5"}>
          <div className={"flex items-center gap-2"}>
            {viewAvAlible && (
              <Space>
                <Button
                  className={"addButton"}
                  type="primary"
                  disabled={isAntron}
                  onClick={() => {
                    if (!selectNode?.catalogNo) {
                      message.error("请选择或者新增分类!")
                      return
                    }
                    setSourceSwitch(false)
                    setDocAction("add")
                    setIsAddModalVisible(true)
                  }}
                >
                  <i className="iconfont icon-chuangjian"></i>
                  新增数据集
                </Button>
                <div className="text-gray-500 text-[12px]">
                  已选择目录：
                  {selectNode
                    ? `${selectNode.catalogName || "--"} (ID: ${selectNode.catalogNo || "--"})`
                    : "--"}
                </div>
              </Space>
            )}
          </div>
          {/* <Input
          style={{ width: 240 }}
          placeholder="搜索数据集编号/数据集名"
          suffix={
            <i
              className="iconfont icon-sousuo1 text-[14px] font-[300]"
              style={{ color: "#bfbfbf" }}
            />
          }
          defaultValue={structureNo}
          onChange={(e) => {
            if (e.target.value === "") {
              debounceSetSearch("")
            } else {
              debounceSetSearch(e.target.value)
            }
          }}
        /> */}
        </div>
        <Table
          onChange={handleTableChange}
          dataSource={tableData?.data?.records}
          rowKey={(record) => record.structureNo}
          // rowSelection={{
          //   fixed: true,
          //   selectedRowKeys,
          //   onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys || [])
          // }}
          className="table-style-v2"
          rowClassName={(record, index) => {
            if (index % 2 === 0) {
              return "table-style-v2-even-row"
            } else {
              return "table-style-v2-odd-row"
            }
          }}
          columns={columns}
          pagination={false}
          scroll={{
            y: isIframe ? "calc(100vh - 220px)" : "calc(100vh - 550px)",
            x: 1200
          }}
        />
        <Pagination
          // className="pr-2 pagination-v2"
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={tableData?.data?.total}
          onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
          showSizeChanger={true}
          style={{ marginTop: "10px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
          // size="small"
        />
        <Modal
          title="新增数据库集"
          okText="下一步"
          width={900}
          open={isAddModalVisible}
          onOk={handleAddModalOk}
          onCancel={handleAddModalCancel}
          destroyOnClose
          styles={{
            body: {
              padding: "24px 0"
            }
          }}
          afterClose={() => {
            form.resetFields()
          }}
        >
          <Radio.Group onChange={onAddModalChange} value={addModalType} className="width-full">
            <Space direction="vertical">
              <Radio value="1">
                <Card style={{ width: 700 }} className="ml-4">
                  <Title level={5}>本地文档</Title>
                  <p>上传Excel或者CSV格式的文档</p>
                </Card>
              </Radio>
              <Radio value="2">
                <Card style={{ width: 700 }} className="ml-4">
                  <Title level={5}>自定义</Title>
                  <p>自定义内容，支持创建&编辑</p>
                </Card>
              </Radio>
            </Space>
          </Radio.Group>
        </Modal>
        <Modal
          title={docAction === "add" ? "添加数据集" : docAction === "edit" ? "编辑数据集" : null}
          width={1024}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          destroyOnClose
          afterClose={() => {
            form.resetFields()
          }}
        >
          <Form
            form={form}
            labelCol={{
              span: 3
            }}
            initialValues={{
              sourceSwitch: false,
              sceneSwitch: false
            }}
          >
            <Form.Item
              name="name"
              label="数据集名称"
              rules={[{ required: true, message: "请输入数据集名称!" }]}
            >
              <Input placeholder="请输入数据集名称" />
            </Form.Item>

            <Form.Item name="catalogNo" label="问答目录">
              <TreeSelect
                showSearch
                treeData={docCategories}
                fieldNames={{ label: "catalogName", value: "catalogNo" }}
                filterTreeNode={(input, node) => {
                  const reg = new RegExp(input, "i")
                  return reg.test(node.catalogName)
                }}
              />
            </Form.Item>

            <Form.Item name="remark" label="摘要说明">
              <Input.TextArea />
            </Form.Item>

            <Form.Item name="sourceSwitch" valuePropName="checked" label="调用来源标签">
              <Switch
                value={sourceSwitch}
                disabled={docAction === "edit" && initPermissionControl == 1}
                onChange={(checked) => {
                  console.log("checked111", checked)
                  setSourceSwitch(checked)
                }}
              />
              <span className="text-[13px] text-gray-500 ml-[10px]">
                开启后，支持按来源标签查询字段
              </span>
            </Form.Item>
            <Form.Item name="sceneSwitch" valuePropName="checked" label="调用场景标签">
              <Switch
                value={sceneSwitch}
                disabled={docAction === "edit" && initUseSceneTag == 1}
                onChange={(checked) => {
                  setSceneSwitch(checked)
                }}
              />
              <span className="text-[13px] text-gray-500 ml-[10px]">
                开启后，支持对应标签权限角色用户编辑数据
              </span>
            </Form.Item>

            <Form.Item
              name="strategies"
              label="策略设置"
              rules={[
                {
                  required: true,
                  message: "请新增字段"
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const otherValue = value?.filter((item) => item.name !== "sourceTag")
                    if (otherValue && otherValue?.length > 0) {
                      return Promise.resolve()
                    }
                    return Promise.reject(
                      !otherValue?.length && value?.length && new Error("请新增字段!")
                    )
                  }
                })
              ]}
            >
              <DynamicFieldSet
                isEdit={docAction === "edit"}
                sourceSwitch={sourceSwitch}
                sceneSwitch={sceneSwitch}
                form={form}
                editStrategies={editStrategies}
                sourceTag={sourceTag}
              />
            </Form.Item>
          </Form>
        </Modal>
        <AddStructureDataFromDoc
          structureNoRef={structureNoRef}
          tableDataRefetch={tableDataRefetch}
          sourceTag={sourceTag}
          {...{
            handleAddDataModalCancel,
            isAddDataModalVisible,
            handleAddDataModalOk,
            knowledgeBaseNo: selectedKnowledgeBase,
            catalogNo: selectNode?.catalogNo,
            addDateSet
          }}
        />

        {/* 添加抽屉组件 */}
        <Drawer
          title={`数据集详情: ${currentDetailData?.name || ""}`}
          placement="right"
          width={"90%"}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          destroyOnClose={true}
        >
          {currentDetailData && (
            <StructureKnowledgeDetailDrawer
              knowledgeBaseNo={selectedKnowledgeBase}
              catalogNo={currentDetailData.catalogNo}
              structureNo={currentDetailData.structureNo}
              botNo={botNo}
              isDrawerMode={true}
            />
          )}
        </Drawer>
      </div>
    </Form>
  )
}

export default StructureTable
