import React, { useEffect, useRef, useState } from "react"
import { useLocation, Link } from "react-router-dom"
import queryString from "query-string"
import PageContainer from "@/components/PageContainer"
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Upload,
  message,
  Breadcrumb
} from "antd"
import { DeleteOutlined, InboxOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons"
import { downLoadLableTemplate, batchSaveLable } from "@/api/dataManagement/api"
import {
  useFetchListByPageLable,
  useFetchListLableOperateByDsId,
  useFetchSaveLable,
  useFetchModifyLable,
  useFetchDeleteLable,
  useFetchBatchSaveLable,
  useFetchListAllDsInfoApi
} from "@/api/dataManagement"
import { debounce } from "lodash"
import styles from "../index.module.scss"
const { Dragger } = Upload
const { TextArea } = Input
const dataTypeEnum = {
  1: "枚举型",
  2: "字符型",
  3: "数值型",
  4: "日期型"
}
const DataField = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { dsId, botNo } = queryParams
  const [data, setData] = useState()
  const [resData, setResData] = useState({ list: [], total: 0 })
  const [formType, setFormType] = useState("")
  // const [currentData, setCurrentData] = useState({ id: '' })
  const currentData = useRef({ id: "" })
  const uploadFile = useRef("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paginationInfo, setPaginationInfo] = useState({
    pageNum: 1,
    pageSize: 10
  })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm()
  const [uploadForm] = Form.useForm()
  const labelType = Form.useWatch("labelType", form)
  const { mutate: getList } = useFetchListByPageLable()
  const { mutate: getLableList } = useFetchListLableOperateByDsId()
  const { mutate: handleSave } = useFetchSaveLable()
  const { data: dsList } = useFetchListAllDsInfoApi({ botNo })
  const { mutate: handleEdit } = useFetchModifyLable()
  const { mutate: handleDelete } = useFetchDeleteLable()
  const searchDom = () => {
    return (
      <div className={styles["searchbox"]}>
        <div>
          <Form form={searchForm}>
            <Space>
              <Form.Item name="lableName">
                <Input
                  allowClear
                  placeholder="请输入显示名称或字段名称"
                  style={{ width: "300px" }}
                  onChange={(e) => {
                    changeValueDebounce()
                  }}
                />
              </Form.Item>
              <Form.Item name="dsId" initialValue={dsId}>
                <Select
                  fieldNames={{ label: "dsName", value: "id" }}
                  allowClear
                  placeholder="数据源"
                  style={{ width: "300px" }}
                  options={dsList}
                  onChange={(e) => {
                    changeValueDebounce()
                  }}
                />
              </Form.Item>
            </Space>
          </Form>
        </div>
        <div style={{ textAlign: "right", width: "100%" }}>
          <Button
            type="primary"
            onClick={() => {
              ;(setDrawerOpen(true), setFormType("新增"))
            }}
          >
            新增
          </Button>
        </div>
      </div>
    )
  }
  const changeValueDebounce = debounce(() => {
    setPaginationInfo({
      ...paginationInfo,
      pageNum: 1
    })
  }, 1000)
  const searchList = () => {
    const params = {
      ...paginationInfo,
      lableName: searchForm.getFieldValue("lableName") || "",
      dsId: searchForm.getFieldValue("dsId") || ""
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
  const columns = [
    {
      title: "显示/字段名称",
      dataIndex: "lableName",
      width: 150,
      render: (v, record) => {
        return (
          <div>
            <p>{v}</p>
            <p>{record.targetField}</p>
          </div>
        )
      }
    },
    {
      title: "数据源名称",
      dataIndex: "dsId",
      width: 150,
      ellipsis: { showTitle: true },
      render: (v, record) => {
        const obj = dsList?.find((item) => item.id === v)
        return obj?.dsName || "-"
      }
    },
    {
      title: "描述",
      dataIndex: "desc",
      width: 200
    },
    {
      title: "数据类型",
      dataIndex: "labelType",
      width: 100,
      render: (v) => {
        return dataTypeEnum[v] || "-"
      }
    },
    {
      title: "显示状态",
      dataIndex: "isCondition",
      width: 100,
      render: (v) => {
        return v ? "显示" : "隐藏"
      }
    },
    {
      title: "创建信息",
      dataIndex: "name",
      width: 190,
      render: (v, record) => {
        return (
          <div>
            <p>{record.creator || "-"}</p>
            <p>{record.gmtCreated || "-"}</p>
          </div>
        )
      }
    },
    {
      title: "更新信息",
      dataIndex: "name",
      width: 190,
      render: (v, record) => {
        return (
          <div>
            <p>{record.modifier || "-"}</p>
            <p>{record.gmtModified || "-"}</p>
          </div>
        )
      }
    },
    {
      title: "操作",
      dataIndex: "action",
      align: "center",
      fixed: "right",
      width: 150,
      render: (v, record) => {
        return [
          <Button
            type="link"
            onClick={() => {
              ;(setFormType("编辑"),
                setDrawerOpen(true),
                (currentData.current = record),
                form.setFieldsValue(record))
            }}
          >
            编辑
          </Button>,
          <Popconfirm
            title="确认操作?"
            onConfirm={() => {
              handleDelete(
                { id: record.id },
                {
                  onSuccess: (v) => {
                    if (v.success) {
                      message.success("删除成功")
                      searchList()
                    } else {
                      message.error(e.message)
                    }
                  }
                }
              )
            }}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        ]
      }
    }
  ]
  const props = {
    name: "file",
    multiple: false,
    // action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange(info) {
      console.log(info)
      uploadFile.current = info.file
      // const { status } = info.file;
      // if (status !== 'uploading') {
      //     console.log(info.file, info.fileList);
      // }
      // if (status === 'done') {
      //     message.success(`${info.file.name} file uploaded successfully.`);
      // } else if (status === 'error') {
      //     message.error(`${info.file.name} file upload failed.`);
      // }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files)
    },
    beforeUpload: (e) => {}
  }
  useEffect(() => {
    searchList()
  }, [paginationInfo])
  useEffect(() => {
    // getLableList()
    if (!drawerOpen) {
      form.resetFields()
    }
  }, [drawerOpen])

  const submitFn = () => {
    form.validateFields().then((v) => {
      const params = v
      if (formType === "新增") {
        handleSave(params, {
          onSuccess: (e) => {
            if (e.success) {
              message.success("新增成功")
              setDrawerOpen(false)
              searchList()
            } else {
              message.error(e.message)
            }
          }
        })
      }
      if (formType === "编辑") {
        params.id = currentData?.current.id
        handleEdit(params, {
          onSuccess: (e) => {
            if (e.success) {
              message.success("编辑成功")
              setDrawerOpen(false)
              searchList()
            } else {
              message.error(e.message)
            }
          }
        })
      }
    })
  }
  const uploadSubmit = async () => {
    const formData = new FormData()
    formData.append("file", uploadFile.current)
    formData.append("dsId", uploadForm.getFieldValue("dsId"))
    console.log(formData)
    const res = await batchSaveLable(formData)
    console.log(res)
  }
  return (
    <div>
      <PageContainer
        headerTitle={
          <Breadcrumb
            className={styles.breadcrumb}
            items={[
              {
                title: <Link to={`/dataOrigin?botNo=${botNo}`}>数据管理</Link>
              },
              {
                title: "数据字段"
              }
            ]}
          />
        }
        headerCustomeSearch={searchDom()}
      >
        {/* <Button icon={<UploadOutlined />} type='primary' onClick={() => { setUploadOpen(true) }}>批量上传</Button> */}
        <Table
          scroll={{ x: 1100 }}
          columns={columns}
          dataSource={resData.list}
          pagination={{
            // showTotal:true,
            showSizeChanger: true,
            total: resData.total,
            onChange: (page, size) => {
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
          title="编辑"
          onClose={() => {
            setDrawerOpen(false)
            form.resetFields()
          }}
        >
          {/* <Button onClick={() => { console.log(form.getFieldsValue()) }}>get</Button> */}
          <Form labelCol={{ span: 4 }} form={form}>
            <Form.Item
              label="数据源"
              name="dsId"
              rules={[{ required: true, message: "请选择数据源类型" }]}
            >
              <Select
                options={dsList}
                fieldNames={{ label: "dsName", value: "id" }}
                placeholder="请选择"
              />
            </Form.Item>
            <Form.Item
              label="字段名"
              name="targetField"
              rules={[{ required: true, message: "请选择数据源类型" }]}
            >
              <Input placeholder="请选择" />
            </Form.Item>
            <Form.Item
              label="显示名"
              name="lableName"
              rules={[{ required: true, message: "请选择数据源类型" }]}
            >
              <Input placeholder="请选择" />
            </Form.Item>
            <Form.Item label="描述" name="desc">
              <Input.TextArea placeholder="请选择" />
            </Form.Item>
            <Form.Item
              label="显示状态"
              name="isCondition"
              rules={[{ required: true, message: "请选择数据源类型" }]}
            >
              <Radio.Group>
                <Radio value={true}>显示</Radio>
                <Radio value={false}>隐藏</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="labelType"
              label="数据类型"
              rules={[{ required: true, message: "请选择数据源类型" }]}
            >
              <Radio.Group>
                <Radio value={1}>枚举型</Radio>
                <Radio value={2}>字符型</Radio>
                <Radio value={3}>数值型</Radio>
                <Radio value={4}>日期型</Radio>
              </Radio.Group>
            </Form.Item>
            {labelType === 1 && (
              <Form.Item label="属性说明" required>
                <Form.List name="lableCodeMappingList" initialValue={[{}]}>
                  {(fields, { add, remove }) => {
                    return (
                      <div>
                        {fields.map((item, index) => {
                          return (
                            <Row gutter={[5, 5]} style={{ marginBottom: "12px" }} key={index}>
                              <Col span={12}>
                                <Form.Item noStyle name={[item.name, "code"]}>
                                  <Input placeholder="请输入code"></Input>
                                </Form.Item>
                              </Col>
                              <Col span={12} style={{ display: "flex" }}>
                                <Form.Item noStyle name={[item.name, "value"]}>
                                  <TextArea
                                    autoSize={{ minRows: 1, maxRows: 3 }}
                                    placeholder="请输入value"
                                    style={{ marginRight: "5px" }}
                                  />
                                </Form.Item>
                                <DeleteOutlined
                                  style={{ color: "red" }}
                                  onClick={() => {
                                    remove(index)
                                  }}
                                />
                              </Col>
                            </Row>
                          )
                        })}
                        <div style={{ width: "100%" }}>
                          <Button
                            icon={<PlusOutlined />}
                            style={{ width: "100%" }}
                            onClick={() => {
                              add({ key: 1 })
                            }}
                            type="primary"
                          >
                            添加
                          </Button>
                        </div>
                      </div>
                    )
                  }}
                </Form.List>
              </Form.Item>
            )}
            {labelType === 3 && (
              <Form.Item label="属性说明" name="dataFormatType" required>
                <Select
                  options={[
                    { label: "浮点型", value: "5" },
                    { label: "整数型", value: "3" }
                  ]}
                  placeholder="选择数值格式"
                ></Select>
              </Form.Item>
            )}
            {labelType === 4 && (
              <Form.Item label="属性说明" name="dataFormatType" required>
                <Select
                  options={[
                    { label: "精确到秒", value: "1" },
                    { label: "精确到日", value: "2" }
                  ]}
                  placeholder="选择日期格式"
                ></Select>
              </Form.Item>
            )}
          </Form>

          <div style={{ width: "100%", textAlign: "right", marginTop: "24px" }}>
            <Button type="primary" style={{ marginRight: "5px" }} onClick={submitFn}>
              提交
            </Button>
            <Button>取消</Button>
          </div>
        </Drawer>
        <Drawer
          open={uploadOpen}
          width="600px"
          title="编辑"
          onClose={() => {
            setUploadOpen(false)
          }}
        >
          <Form labelCol={{ span: 5 }} form={uploadForm}>
            <Form.Item
              label="数据源类型"
              name="dsId"
              rules={[{ required: true, message: "请选择数据源类型" }]}
            >
              <Select
                placeholder="请选择"
                options={dsList}
                fieldNames={{ label: "dsName", value: "id" }}
              />
            </Form.Item>
            <Form.Item label="文件导入" style={{ marginBottom: "5px" }} name="file">
              <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">将文件拖拽到此处,或点击上传</p>
                <p className="ant-upload-hint">支持excel文件</p>
              </Dragger>
            </Form.Item>
          </Form>
          <Row>
            <Col span={5}></Col>
            <Col span={19}>
              <Button
                style={{ paddingLeft: "0px" }}
                type="link"
                onClick={() => {
                  downLoadLableTemplate()
                }}
              >
                下载模版
              </Button>
            </Col>
          </Row>
          <Button
            onClick={() => {
              console.log(uploadForm.getFieldsValue())
            }}
          >
            get
          </Button>
          <div style={{ width: "100%", textAlign: "right" }}>
            <Button type="primary" style={{ marginRight: "5px" }} onClick={uploadSubmit}>
              提交
            </Button>
            <Button>取消</Button>
          </div>
        </Drawer>
      </PageContainer>
    </div>
  )
}

export default DataField
