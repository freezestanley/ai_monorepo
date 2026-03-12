import { useCallback, useMemo, useState } from "react"
import PageContainer from "@/components/PageContainer"
import {
  Button,
  Cascader,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tooltip,
  Upload,
  message,
  Modal
} from "antd"
import {
  useFetchDialogueUsableSwitch,
  useFetchDialogueUsableQuery,
  useFetchDialogueUsableImport,
  useFetchDialogueUsableEdit,
  useFetchDialogueUsableCreate,
  useFetchDialogueUsableDeleteApi,
  useFetcListByDialogueId,
  useFetchBatchSwitchApi,
  useFetchEditBindWithDialogueAndTemplate
} from "@/api/talkManagement"
import { fetchDownLoadExcludeTemplate, fetchQueryTemplateCount } from "@/api/talkManagement/api"
import { useLocation, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useFetchListByParentAndType, useFetchListByType } from "@/api/knowledgeManage"
import queryString from "query-string"
import { CheckOutlined, CloseOutlined, InboxOutlined } from "@ant-design/icons"
import { findKnowledgeLayerNodes } from "@/pages/knowledgeProject/utils"
import styles from "./index.module.scss"

const { RangePicker } = DatePicker

const OriginTypeEnum = {
  SYNC: "萃取任务同步",
  MANUAL: "手动添加",
  EXCEL_IMPORT: "导入"
}

const TalkManagement = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [formDrawer] = Form.useForm()
  const [formImport] = Form.useForm()
  const [resData, setResData] = useState({ list: [], total: 0 })
  const [formType, setFormType] = useState("")
  const [currentData, setCurrentData] = useState({
    id: "",
    businessSceneId: [],
    initLayer: [],
    text: "",
    status: "ON"
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [importDrawerOpen, setImportDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [templateId, setTemplateId] = useState("")
  const [paginationInfo, setPaginationInfo] = useState({
    pageNum: 1,
    pageSize: 10
  })
  const [tableKey, setTableKey] = useState(1)
  const [downloading, setDownloading] = useState(false)
  const [businessSceneId, setBusinessSceneId] = useState("")
  const [selectedRows, setSelectedRows] = useState([])
  const [templateSelectedRows, setTemplateSelectedRows] = useState([])
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, batchCode } = queryParams
  const { mutate: getList } = useFetchDialogueUsableQuery()
  const { mutate: handleSave } = useFetchDialogueUsableCreate()
  const { mutate: handleEdit } = useFetchDialogueUsableEdit()
  const { mutate: handleImport } = useFetchDialogueUsableImport()
  const { mutate: handleSwitch } = useFetchDialogueUsableSwitch()
  const { mutate: handleDelete } = useFetchDialogueUsableDeleteApi()
  const { mutate: handleBatchSwitch } = useFetchBatchSwitchApi()
  const { mutate: handleEditBindWithDialogueAndTemplate } =
    useFetchEditBindWithDialogueAndTemplate()
  const { data: templateList, refetch: refetchFetcListByDialogueId } = useFetcListByDialogueId({
    templateId: templateId
  })
  // const watchBusinessSceneId = Form.useWatch('businessSceneId', formDrawer)
  // useEffect(() => {
  //     console.log(watchBusinessSceneId)
  // }, [watchBusinessSceneId])
  const { data: listByParentAll } = useFetchListByType({
    type: "BUSINESS_SCENE",
    botNo
  })
  // 意图层级
  const { data: listByParentAndType } = useFetchListByParentAndType({
    parentId: businessSceneId,
    parentType: "BUSINESS_SCENE",
    type: "INTENTION_LEVEL",
    botNo
  })

  const data = useMemo(() => {
    const newcurrentData = { ...currentData }

    if (businessSceneId) {
      newcurrentData.businessSceneId = findKnowledgeLayerNodes(listByParentAll, businessSceneId, {
        isToId: true
      })
    }
    console.log(newcurrentData)
    return newcurrentData
  }, [businessSceneId, listByParentAll])

  const data2 = useMemo(() => {
    const newcurrentData = { ...data }
    if (newcurrentData?.initLayer && listByParentAndType?.length) {
      newcurrentData.initLayer = findKnowledgeLayerNodes(
        listByParentAndType,
        newcurrentData.initLayer,
        { isToId: true }
      )
    }
    console.log(newcurrentData)
    return newcurrentData
  }, [data, listByParentAndType])

  useEffect(() => {
    formDrawer.setFieldsValue({
      ...data2,
      intentionLayer: data2.initLayer,
      dialogue: "",
      useStatus: false
    })
  }, [data2])

  const searchList = () => {
    const formData = form.getFieldsValue()
    if (formData.startAndEndtime && formData?.startAndEndtime?.length > 0) {
      console.log(formData.startAndEndtime)
      ;((formData.beginTime = formData?.startAndEndtime[0].format("YYYY-MM-DD HH:mm:ss")),
        (formData.endTime = formData?.startAndEndtime[1].format("YYYY-MM-DD HH:mm:ss")))
    }
    if (formData.businessScene) {
      formData.businessScene = formData.businessScene[formData.businessScene.length - 1]
    }
    console.log(formData)
    const params = {
      ...paginationInfo,
      ...formData,
      botNo
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

  const onUnBind = async (ids) => {
    const list = Array.isArray(ids) ? ids : [ids]
    const params = {
      knowledgeTemplateEditOperationVOS: [
        {
          operation: "解绑",
          knowledgeTemplateEditOperationDetailVOS: [
            {
              dialogueId: templateId
            }
          ]
        }
      ],
      templateInfoList: list.map(({ id, enableVersion, templateName }) => ({
        enableVersion,
        templateName,
        templateId: id
      }))
    }
    handleEditBindWithDialogueAndTemplate(params, {
      onSuccess: (res) => {
        if (res?.success) {
          if (res?.data?.failMsg) {
            message.warning(res.data.failMsg)
            return
          }
          message.success("解绑成功")
          refetchFetcListByDialogueId()
          Array.isArray(ids) && setTemplateSelectedRows([])
        }
      }
    })
  }

  const onBatchSwitch = (useStatus) => {
    const params = {
      botNo,
      ids: selectedRows?.filter((v) => v.useStatus !== useStatus)?.map(({ id }) => id),
      useStatus
    }
    if (!params.ids?.length) {
      setSelectedRows([])
      message.success("操作成功")
      return
    }
    handleBatchSwitch(params, {
      onSuccess: (res) => {
        if (res?.success) {
          searchList()
          setSelectedRows([])
          message.success("操作成功")
        }
      }
    })
  }

  const handleDeleteService = (params, isBatch) => {
    handleDelete(params, {
      onSuccess: (res) => {
        if (res?.success) {
          searchList()
          isBatch && setSelectedRows([])
          message.success("删除成功")
        }
      }
    })
  }

  const onDelete = async (ids) => {
    const isBatch = Array.isArray(ids)
    const idList = isBatch ? ids.map(({ id }) => id) : [ids]
    const params = { botNo, ids: idList }
    const res = await fetchQueryTemplateCount(params)
    if (res?.data > 0) {
      if (isBatch) {
        Modal.confirm({
          title: "提示",
          content: `所选数据共有${res.data}条记录存在关联模板，建议先解绑！是否继续操作？`,
          okText: "解绑&删除",
          cancelText: "取消",
          onOk: () => {
            handleDeleteService(params, isBatch)
          }
        })
      } else {
        Modal.warning({
          title: "提示",
          content: "存在关联模板，请先解绑后重试！"
        })
      }
      return
    }
    Modal.confirm({
      title: "提示",
      content: "是否确认删除？",
      onOk: () => {
        handleDeleteService(params, isBatch)
      }
    })
  }

  const submitFn = () => {
    formDrawer.validateFields().then((v) => {
      const params = {
        ...v,
        botNo,
        businessSceneId: v.businessSceneId && v.businessSceneId[v.businessSceneId.length - 1],
        intentionLayer: v.intentionLayer && v.intentionLayer[v.intentionLayer.length - 1],
        useStatus: v.useStatus ? "ON" : "OFF"
      }
      if (formType === "新增" || formType === "复制") {
        handleSave(params, {
          onSuccess: (res) => {
            console.log(res)
            if (res.success) {
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
        handleEdit(params, {
          onSuccess: (res) => {
            if (res.success) {
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

  const searchDom = () => {
    return (
      <div className={styles["searchbox"]}>
        <Form form={form}>
          <Row gutter={24}>
            <Col sm={12} lg={8} xl={6}>
              <Form.Item label="业务场景" name="businessScene">
                <Cascader
                  fieldNames={{
                    label: "name",
                    value: "id",
                    children: "childKnowledgeConfigs"
                  }}
                  options={listByParentAll}
                  allowClear
                  placeholder="请输入业务场景"
                />
              </Form.Item>
            </Col>
            <Col sm={12} lg={8} xl={6}>
              <Form.Item name="source" label="来源">
                <Select
                  allowClear
                  placeholder="请选择来源"
                  options={[
                    {
                      label: "萃取任务同步",
                      value: "SYNC"
                    },
                    {
                      label: "手动添加",
                      value: "MANUAL"
                    },
                    {
                      label: "导入",
                      value: "EXCEL_IMPORT"
                    }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col sm={12} lg={8} xl={6}>
              <Form.Item name="useStatus" label="使用状态">
                <Select
                  allowClear
                  placeholder="使用状态"
                  options={[
                    { label: "启用", value: "ON" },
                    { label: "禁用", value: "OFF" }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col sm={12} lg={8} xl={6}>
              <Form.Item name="matchIntentionName" label="检索意图/意图示例">
                <Input allowClear placeholder="请输入检索意图/意图示例" />
              </Form.Item>
            </Col>
            <Col sm={12} lg={8} xl={6}>
              <Form.Item name="startAndEndtime" label="时间范围">
                <RangePicker className="w-100" format="YYYY-MM-DD HH:mm:ss" showTime />
              </Form.Item>
            </Col>
            <Col sm={12} lg={8} xl={18} className="text-right">
              <Button type="primary" onClick={searchList}>
                查询
              </Button>
              <Button
                style={{ marginLeft: 8 }}
                onClick={() => {
                  form.resetFields()
                  searchList()
                }}
              >
                重置
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    )
  }

  const importFn = () => {
    formImport.validateFields().then((v) => {
      console.log(v)
      if (v.file.fileList[0]?.originFileObj) {
        const formData = new FormData()
        formData.append("file", v.file.fileList[0].originFileObj)
        handleImport(
          {
            botNo,
            file: formData
          },
          {
            onSuccess: (v) => {
              if (v.success) {
                message.success("上传成功")
                setImportDrawerOpen(false)
                form.resetFields()
              }
            }
          }
        )
      } else {
        message.warning("请先上传文件")
      }
    })
  }

  // 处理下载模板的函数
  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      await fetchDownLoadExcludeTemplate({ botNo })
    } finally {
      setDownloading(false)
    }
  }, [botNo])

  const columns = [
    {
      title: "业务场景",
      dataIndex: "businessSceneName"
    },
    {
      title: "初始层级",
      dataIndex: "layerName"
    },
    {
      title: "意图名称",
      dataIndex: "intentionName"
    },
    {
      title: "意图描述",
      dataIndex: "intentionDescription"
    },
    {
      editable: true,
      title: "关联话术",
      dataIndex: "text",
      width: 200,
      render: (v, record) => {
        if (record.isChange) {
          return (
            <Space>
              <Input.TextArea
                autoFocus
                defaultValue={v}
                onChange={(e) => {
                  record.reqText = e.target.value
                }}
                // onBlur={() => {
                //     record.isChange = false
                //     if (!record.reqText) {
                //         setTableKey(tableKey + 1)
                //         return
                //     }
                //     const params = {
                //         id: record.id,
                //         dialogue: record.reqText,
                //     }
                //     handleEdit(params, {
                //         onSuccess: (res) => {
                //             if (res.success) {
                //                 setTableKey(tableKey + 1)
                //                 searchList()
                //                 message.success('编辑成功')
                //             } else {
                //                 message.error(res.message)
                //             }

                //         }
                //     })
                // }}
              />
              <div style={{ width: "100%", textAlign: "right" }}>
                <CheckOutlined
                  style={{ color: "green" }}
                  onClick={() => {
                    record.isChange = false
                    if (!record.reqText) {
                      setTableKey(tableKey + 1)
                      return
                    }
                    const params = {
                      id: record.id,
                      dialogue: record.reqText
                    }
                    handleEdit(params, {
                      onSuccess: (res) => {
                        if (res.success) {
                          setTableKey(tableKey + 1)
                          searchList()
                          message.success("编辑成功")
                        } else {
                          message.error(res.message)
                        }
                      }
                    })
                  }}
                />
                <CloseOutlined
                  style={{ color: "red" }}
                  onClick={() => {
                    record.isChange = false
                    setTableKey(tableKey + 1)
                  }}
                />
              </div>
            </Space>
          )
        } else {
          return <Tooltip title={v}>{v?.length > 10 ? v?.slice(0, 10) + "..." : v}</Tooltip>
        }
      }
    },
    {
      title: "来源",
      dataIndex: "source",
      render: (v) => {
        return OriginTypeEnum[v]
      }
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified"
    },
    {
      title: "关联模板",
      dataIndex: "template",
      render: (v, record) => {
        return (
          <Button
            type="link"
            onClick={() => {
              setTemplateId(record.id)
              setTemplateDrawerOpen(true)
              // getTemplateList(record.id)
            }}
          >
            详情
          </Button>
        )
      }
    },
    {
      title: "操作",
      dataIndex: "gmtModified",
      fixed: "right",
      width: "200",
      render: (v, record) => {
        return [
          <Button
            type="link"
            disabled={record.isChange}
            onMouseDown={() => {
              // formDrawer.setFieldsValue({
              //     businessSceneId: [record.businessSceneId],
              // })
              setBusinessSceneId(record.businessSceneId)
              setCurrentData(record)
              setDrawerOpen(true)
              setFormType("复制")
            }}
          >
            复制
          </Button>,
          <Button
            disabled={record.isChange}
            type="link"
            onClick={(e) => {
              e.stopPropagation()
              record.isChange = true
              setTableKey(tableKey + 1)
            }}
          >
            编辑
          </Button>,
          <Popconfirm
            disabled={record.isChange}
            title="确认操作？"
            onConfirm={() => {
              console.log(botNo)
              handleSwitch(
                {
                  useStatus: record.useStatus === "ON" ? "OFF" : "ON",
                  botNo: botNo,
                  id: record.id
                },
                {
                  onSuccess: (v) => {
                    if (v.success) {
                      searchList()
                      message.success(v.message)
                    } else {
                      message.error(v.message)
                    }
                  }
                }
              )
            }}
          >
            <Switch
              disabled={record.isChange}
              value={record.useStatus === "ON"}
              checkedChildren="启用"
              unCheckedChildren="禁用"
            ></Switch>
          </Popconfirm>,
          <Button type="link" danger onClick={() => onDelete(record.id)}>
            删除
          </Button>
        ]
      }
    }
  ]

  useEffect(() => {
    searchList()
  }, [paginationInfo])

  return (
    <PageContainer headerTitle="全部话术" headerCustomeSearch={searchDom()}>
      <div className="flex justify-between" style={{ marginBottom: "10px" }}>
        <Button onClick={() => navigate(`/operationLog?botNo=${botNo}`)}>操作日志</Button>
        <Space
          style={{
            textAlign: "right",
            justifyContent: "right"
          }}
        >
          <Button
            onClick={() => {
              setImportDrawerOpen(true)
            }}
          >
            导入
          </Button>
          {/* <Button disabled>导出</Button> */}
          <Popconfirm title="确认批量启用？" onConfirm={() => onBatchSwitch("ON")}>
            <Button disabled={!selectedRows.length}>批量启用</Button>
          </Popconfirm>
          <Popconfirm title="确认批量禁用？" onConfirm={() => onBatchSwitch("OFF")}>
            <Button disabled={!selectedRows.length}>批量禁用</Button>
          </Popconfirm>
          <Button disabled={!selectedRows.length} onClick={() => onDelete(selectedRows)}>
            批量删除
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setFormType("新增")
              setDrawerOpen(true)
            }}
          >
            新增
          </Button>
          {/* <Button type='primary'>绑定至</Button> */}
        </Space>
      </div>

      <Table
        rowKey={"id"}
        key={tableKey}
        columns={columns}
        scroll={{ x: "max-content" }}
        dataSource={resData.list}
        pagination={{
          showTotal: (total) => `共 ${total} 条`,
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
        rowSelection={{
          fixed: true,
          selectedRowKeys: selectedRows?.map(({ id }) => id),
          onChange: (_, _selectedRows) => {
            setSelectedRows(_selectedRows)
          }
        }}
      />
      <Drawer
        open={drawerOpen}
        width="600px"
        title={formType}
        onClose={() => {
          setDrawerOpen(false)
          formDrawer.resetFields()
          setBusinessSceneId("")
          setCurrentData({})
        }}
      >
        <Form labelCol={{ span: 5 }} form={formDrawer}>
          <Form.Item
            label="意图"
            name="intentionName"
            rules={[{ required: true, message: "请填写" }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item
            label="业务场景"
            name="businessSceneId"
            rules={[{ required: true, message: "请选择" }]}
          >
            <Cascader
              placeholder="请选择"
              options={listByParentAll}
              fieldNames={{
                label: "name",
                value: "id",
                children: "childKnowledgeConfigs"
              }}
              onChange={(e) => {
                const strid = e ? e[e.length - 1] : ""
                if (!strid) return
                setBusinessSceneId(strid)
                setTimeout(() => {
                  formDrawer.setFieldValue("intentionLayer", null)
                }, 500)
              }}
            />
          </Form.Item>
          <Form.Item
            label="意图层级"
            name="intentionLayer"
            rules={[{ required: true, message: "请填写意图层级" }]}
          >
            <Cascader
              placeholder="请选择"
              options={listByParentAndType}
              fieldNames={{
                label: "name",
                value: "id",
                children: "childKnowledgeConfigs"
              }}
            />
          </Form.Item>
          <Form.Item
            label="意图描述"
            name="intentionDescription"
            rules={[{ required: true, message: "请填写" }]}
          >
            <Input.TextArea showCount maxLength={500} placeholder="请输入" />
          </Form.Item>
          <Form.Item
            label="关联话术"
            name="dialogue"
            rules={[{ required: true, message: "请填写" }]}
          >
            <Input.TextArea showCount maxLength={500} placeholder="请输入" />
          </Form.Item>
          <Form.Item valuePropName="checked" label="使用状态" name="useStatus">
            <Switch />
          </Form.Item>
        </Form>
        <div style={{ width: "100%", textAlign: "right" }}>
          <Button type="primary" style={{ marginRight: "5px" }} onClick={submitFn}>
            保存
          </Button>
        </div>
      </Drawer>
      <Drawer
        destroyOnClose={true}
        open={importDrawerOpen}
        width="600px"
        title="导入"
        onClose={() => {
          setImportDrawerOpen(false)
          form.resetFields()
        }}
      >
        <Form form={formImport}>
          <Form.Item name="file">
            <Upload.Dragger
              // defaultFileList={newRecord?.file?.fileList || undefined}
              maxCount={1}
              accept=".xls,.xlsx"
              beforeUpload={(file) => {
                const isLt10M = file.size / 1024 / 1024 < 10
                const allowedExtensions = [".xls", ".xlsx"]
                const fileExtension = "." + file.name.split(".").pop().toLowerCase()
                if (!isLt10M) {
                  message.error("文件大小超过10MB!")
                  return false
                }
                if (!allowedExtensions.includes(fileExtension)) {
                  message.error("不支持的文件格式!")
                  return false
                }
                return true
              }}
              customRequest={(options) => {
                options.onSuccess({}, options.file)
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p>将文档拖拽到此处，或 本地上传</p>
            </Upload.Dragger>
          </Form.Item>
          <Button
            loading={downloading}
            type="link"
            onClick={() => {
              handleDownload()
            }}
          >
            下载模板
          </Button>
        </Form>
        <div style={{ width: "100%", textAlign: "right" }}>
          <Button type="primary" onClick={importFn}>
            导入
          </Button>{" "}
          <Button
            onClick={() => {
              setImportDrawerOpen(false)
            }}
          >
            取消
          </Button>
        </div>
      </Drawer>
      <Drawer
        size="large"
        open={templateDrawerOpen}
        title="关联模板详情"
        onClose={() => {
          setTemplateSelectedRows([])
          setTemplateDrawerOpen(false)
        }}
      >
        <Table
          rowKey={"id"}
          pagination={false}
          dataSource={templateList}
          columns={[
            {
              dataIndex: "stageType",
              title: "阶段类型",
              width: 100
            },
            {
              dataIndex: "businessSceneName",
              title: "业务场景",
              width: 120
            },
            {
              dataIndex: "templateName",
              title: "模板名称"
            },
            {
              dataIndex: "gmtCreated",
              title: "绑定时间"
            },
            {
              title: "操作",
              dataIndex: "operation",
              fixed: "right",
              render: (_, record) => (
                <Popconfirm title="确认解绑吗?" onConfirm={() => onUnBind(record)}>
                  <Button type="link">解绑</Button>
                </Popconfirm>
              )
            }
          ]}
          scroll={{ y: "calc(100vh - 250px)", x: "max-content" }}
          rowSelection={{
            fixed: true,
            selectedRowKeys: templateSelectedRows?.map(({ id }) => id),
            onChange: (_, _selectedRows) => {
              setTemplateSelectedRows(_selectedRows)
            }
          }}
        />
        <div style={{ marginTop: "20px", width: "100%", textAlign: "right" }}>
          <Button
            type="primary"
            disabled={!templateSelectedRows?.length}
            onClick={() => {
              Modal.confirm({
                title: "提示",
                content: "是否确认解绑？",
                onOk: () => onUnBind(templateSelectedRows)
              })
            }}
          >
            批量解绑
          </Button>
        </div>
      </Drawer>
    </PageContainer>
  )
}

export default TalkManagement
