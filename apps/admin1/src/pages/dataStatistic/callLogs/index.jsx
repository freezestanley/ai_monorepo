// @ts-nocheck
import { useMemo, useRef, useEffect, useState } from "react"
import TableRender from "table-render"
import { getSchema } from "./schema"
import { exportCallRecords, searchApi, getSearchParams } from "./request"
import { useFetchAuthPermissionGroupList } from "@/api/permission"
import { useFetchLlmModelType, useFetchChannelType } from "@/api/common"
import dayjs from "dayjs"
import { fetchCallLogsColumns, updateFeedbackColumns } from "@/api/userFeedback/api"
import { useFetchSourceTagList } from "@/api/sourceTag"
import { PAGE_CODE } from "@/constants/pageCode"
import { cloneDeep, initial } from "lodash"
import {
  Tag,
  message,
  Space,
  Button,
  Input,
  Select,
  Typography,
  Image,
  Tooltip,
  Form,
  Badge
} from "antd"
import { DislikeOutlined, LikeOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons"
import DetailDrawer from "./detailDrawer"
import { getImgSrc } from "../userFeedback"
import RangeTimePicker from "@/components/RangeTime"
import { useLocation } from "react-router-dom"
import Highlighter from "react-highlight-words"
import queryString from "query-string"
import ExecuteProcessDrawer from "./ExecuteProcessDrawer"
import TagModal from "./tagModal"
import OptimizeDrawer from "./optimizeDrawer"
import { TableFilter } from "@/utils/tableFliter"
import "./index.less"
import LogDetailDrawer from "./LogDetailDrawer"
import AnimatedDropdown from "@/components/AnimatedDropdown"
import Iconfont from "@/components/Icon"
import CustomPopconfirm from "@/components/CustomPopconfirm"
import { getCreateOptimizationPreCheck } from "@/api/optimize/api"
import { getTagColor, getStatusColor } from "./utils"
import { useCallLogsColumns } from "@/hooks/useCallLogsColumns"

export default () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, studioenv, iframeStyle, startTime, endTime } = queryParams

  const tableRef = useRef()
  const [columnsSettingValue, setColumnsSettingValue] = useState([]) // 列设置
  const { columns, setColumns } = useCallLogsColumns() // 使用自定义 Hook

  const [realTotal, setRealTotal] = useState(0)
  const [visible, setVisible] = useState(false)
  const [formData, setFormData] = useState({})

  const [executeProcessVisible, setExecuteProcessVisible] = useState(false)
  const [executeProcessParams, setExecuteProcessParams] = useState({})

  const [tagModalData, setTagModalData] = useState({
    visible: false,
    mode: "manage",
    record: null
  })

  const [optimizeData, setOptimizeData] = useState({
    visible: false,
    record: null
  })

  const searchInput = useRef(null)
  const [searchParams, setSearchParams] = useState({})
  const [form] = Form.useForm()

  const [messageApi, contextHolder] = message.useMessage()

  const { data: groupList = [] } = useFetchAuthPermissionGroupList()
  const { data: modelList = [] } = useFetchLlmModelType()
  const { data: channelList = [] } = useFetchChannelType(botNo)
  const { data: { data: tagList = [] } = {} } = useFetchSourceTagList({
    botNo,
    tagType: "callRecordsMark"
  })

  const refreshTableData = () => tableRef.current?.refresh({ stay: false }) // 页码停留在原页

  const [logDetailVisible, setLogDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState({})
  const [activeTab, setActiveTab] = useState("callChain") // 默认激活调用链

  const handleOptimizeOrder = (record) => {
    setCurrentRecord(record)
    setActiveTab("optimize")
    setLogDetailVisible(true)
  }

  const handleView = (record) => {
    setCurrentRecord(record)
    // if (record?.optimizationOrder?.orderNo) {
    //   setActiveTab("optimize")
    // } else {
    //   setActiveTab("process")
    // }
    // 修改：调用日志默认打开调用链
    setActiveTab("callChain")
    setLogDetailVisible(true)
  }

  const checkFn = async (record) => {
    const { sessionId, requestId, botNo } = record
    const response = await getCreateOptimizationPreCheck({
      sessionId,
      requestId,
      botNo
    })
    if (response?.data?.length > 0) {
      return response?.data
    }
    handleOptimizeOrder({ ...record, _type: "create" })
  }

  const labelingColumn = {
    title: "标注",
    key: "mark",
    dataIndex: "mark",
    width: "80px",
    fixed: "right",
    render: (text, record) => {
      return text || "--"
    }
  }

  const optimizeColumn = {
    title: "优化单",
    key: "optimizationOrder",
    dataIndex: "optimizationOrder",
    width: "156px",
    fixed: "right",
    inputType: "select",
    render: (optimizationOrder, record) => {
      return (
        <>
          {!optimizationOrder?.status?.code ? (
            <CustomPopconfirm
              title="该会话关联优化单已存在，是否继续创建？"
              content={""}
              checkFn={() => checkFn(record)}
              buttons={[
                { text: "否", onClick: () => {} },
                {
                  text: "是",
                  onClick: () => {
                    handleOptimizeOrder({ ...record, _type: "create" })
                  }
                },
                {
                  text: "查看",
                  onClick: (orderNo) => {
                    handleOptimizeOrder({ ...record, _type: "view", _orderNo: orderNo })
                  },
                  type: "primary"
                }
              ]}
            >
              <a>创建优化单</a>
            </CustomPopconfirm>
          ) : record.optimizationOrderCount > 1 ? (
            <Tag color="purple">{record.optimizationOrderCount}</Tag>
          ) : (
            <Tag color={getTagColor(record.optimizationOrder?.status?.code)}>
              <Badge
                status={getStatusColor(record.optimizationOrder?.status?.code)}
                style={{ marginRight: 5 }}
              />
              {record.optimizationOrder?.status?.name || "未知状态"}
            </Tag>
          )}
        </>
      )
    }
  }

  const actionRow = {
    title: "操作",
    key: "action",
    hidden: false,
    dataIndex: "action",
    fixed: "right",
    width: 137,
    render: (_, record) => {
      const menuItems = [
        {
          label: "优化到问答",
          onClick: () => setOptimizeData({ visible: true, record })
        }
      ]

      return (
        <div className="flex">
          <Space>
            {/* 
            <a onClick={() => handleOptimizeOrder(record)}>优化单</a> */}
            <a onClick={() => handleView({ ...record, _type: "view" })}>查看</a>
            <a onClick={() => setTagModalData({ visible: true, record, mode: "setting" })}>标注</a>
            <AnimatedDropdown items={menuItems}>
              <Iconfont type={"icon-gengduo"} className="text-lg cursor-pointer" />
            </AnimatedDropdown>
          </Space>
        </div>
      )
    }
  }

  const onColumnsSettingChange = (setting) => {
    const removeActionList = initial(setting)
    setColumnsSettingValue([...removeActionList, actionRow])
    const fields = []
    removeActionList.forEach((item) => {
      columns.forEach((column) => {
        if (item.key === column.fieldNo) {
          fields.push({
            ...column,
            hidden: item.hidden,
            fixed: item.fixed
          })
        }
      })
    })
    updateFeedbackColumns({
      fields,
      pageCode: PAGE_CODE.CALL_LOGS
    }).then(getSelectColumns)
  }

  const formatColumns = (columns) => {
    const _columns = cloneDeep(columns)
    _columns.push(labelingColumn)
    _columns.push(optimizeColumn)
    _columns.push(actionRow)

    setColumnsSettingValue(_columns)

    // 列具体配置
    _columns.forEach((item) => {
      if (
        ![actionRow.dataIndex, labelingColumn.dataIndex, optimizeColumn.dataIndex].includes(
          item.dataIndex
        )
      ) {
        item.render = (text, record) => {
          if (item.dataIndex === "feedbackResult") {
            text =
              text === 1 ? (
                <LikeOutlined style={{ color: "#7f56d9", fontSize: "16px" }} />
              ) : text === -1 ? (
                <DislikeOutlined style={{ color: "red", fontSize: "16px" }} />
              ) : (
                "--"
              )
          }
          if (
            ["responseContext", "requestContext", "sensitiveWords", "errMsg"].includes(
              item.dataIndex
            )
          ) {
            item.width = 300
            item.align = "left"
            const imgSrc = getImgSrc(text)
            const newText = item.dataIndex === "sensitiveWords" ? text?.join(",") || "" : text
            text = imgSrc ? (
              <Image height={58} src={imgSrc} />
            ) : (
              <Typography.Paragraph style={{ margin: 0 }} ellipsis={{ rows: 2, tooltip: text }}>
                {(typeof newText === "string" || typeof newText === "number") &&
                item.inputType === "input" &&
                searchParams[item.dataIndex] ? (
                  <Highlighter
                    highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                    searchWords={[searchParams[item.dataIndex]]}
                    autoEscape
                    textToHighlight={newText ? newText.toString() : ""}
                  />
                ) : (
                  newText || "--"
                )}
              </Typography.Paragraph>
            )
          }
          if (item.dataIndex === "modelType") {
            text = text?.join(",")
          }
          if (item.dataIndex === "feedbackTag") {
            text = text ? text.split(",").map((item) => <Tag color="processing">{item}</Tag>) : null
          }
          if (item.dataIndex === "success") {
            text = item.enums?.find(({ value }) => value === text)?.desc || "--"
          }
          if (["mark"].includes(item.dataIndex)) {
            //["mark", "optimize"]
            const [firstLine, ...restLines] = text?.split("\n") || []
            text = (
              <>
                {firstLine}
                <br />
                {restLines.join("\n")}
              </>
            )
          }
          if (
            (typeof text === "string" || typeof text === "number") &&
            item.inputType === "input" &&
            searchParams?.[item.dataIndex]
          ) {
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={[searchParams[item.dataIndex]]}
                autoEscape
                textToHighlight={text ? text.toString() : ""}
              />
            )
          }
          return text || "--"
        }
      }
    })
    return _columns
  }

  const getSelectColumns = async () => {
    const res = await fetchCallLogsColumns(PAGE_CODE.CALL_LOGS)
    setColumns(res)
  }

  useEffect(() => {
    getSelectColumns()
  }, [])

  const columnWithHandle = (key) => {
    if (["optimize"].includes(key)) {
      return 180
    } else if (["mark"].includes(key)) {
      return 160
    } else if (["requestId", "traceId"].includes(key)) {
      return 200
    } else if (["success", "cost", "isWithdrawal"].includes(key)) {
      return 130
    } else {
      return 200
    }
  }

  const tableColumns = useMemo(() => {
    const _columns = columns?.map((item) => {
      if (item.fieldKey === "modelType") {
        item.enums = modelList?.map(({ name, model }) => ({
          value: model,
          desc: name
        }))
      }
      if (item.fieldKey === "mark") {
        item.enums = [
          { value: "未处理", desc: "未处理" },
          ...(tagList?.map(({ code, tagDesc }) => ({
            value: code,
            desc: tagDesc
          })) || [])
        ]
      }
      // 如果是访问渠道
      if (item.fieldKey === "accessChannel") {
        item.enums = channelList?.map((item) => ({
          value: item?.accessChannel,
          desc: item?.accessChannel
        }))
      }
      return {
        key: item.fieldNo,
        title: () => {
          let searchTitle = item.fieldName
          if (searchParams?.[item.fieldKey]) {
            if (item.inputType === "select") {
              searchTitle = item.enums?.find(
                ({ value }) => value === searchParams?.[item.fieldKey]
              )?.desc
            } else {
              searchTitle = searchParams?.[item.fieldKey]
            }
            searchTitle = (
              <Tooltip placement="top" title={item.fieldName}>
                <div style={{ color: "#7F56D9" }} className="truncate" title={searchTitle}>
                  {searchTitle}
                </div>
              </Tooltip>
            )
          }
          return searchTitle
        },
        dataIndex: item.fieldKey,
        sorter: item.supportSort,
        fixed: item.fixed,
        hidden: item.hidden,
        width: columnWithHandle(item.fieldKey),
        inputType: item.inputType,
        enums: item.enums,
        ...(["input", "select"].includes(item.inputType)
          ? TableFilter({
              form, // 表单 form
              searchParams, // 搜索条件
              searchInput, // useRef(null)
              refresh: refreshTableData, // 刷新方法
              dataIndex: item.fieldKey, // index key
              fieldType: item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
              enums: item.enums // select 枚举
            }) //getColumnSearchProps(item.fieldKey, item.inputType, item.enums)
          : {})
      }
    })
    return formatColumns(_columns)
  }, [columns, searchParams, JSON.stringify(modelList), JSON.stringify(tagList)])

  const onExportCallRecords = () => {
    if (tableRef) {
      const formValues = tableRef.current.form.getValues()
      const formData = {
        ...formValues,
        ...getSearchParams(searchParams),
        botNo,
        startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
        endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
      }
      exportCallRecords(formData, studioenv)
        .then((res) => {
          if (res === true) {
            messageApi.destroy()
            messageApi.open({
              type: "success",
              content: "下载完成!",
              duration: 3
            })
          }
        })
        .catch(() => {
          messageApi.destroy()
          messageApi.open({
            type: "success",
            content: "下载失败!",
            duration: 3
          })
        })
      messageApi.open({
        type: "info",
        content: "开始下载，可能需要一段时间，请耐心等待~",
        duration: 10
      })
    }
  }

  const request = async (params, sorter) => {
    const searchParam = form.getFieldsValue()
    setSearchParams(searchParam)
    const res = await searchApi({ ...searchParam, ...params, botNo }, sorter)
    setRealTotal(res?.realTotal)
    return res
  }

  return (
    <div className="overflow-auto h-full table-xrender-container bg-white">
      <div className="table-xrender-container-insert">
        <Form form={form}>
          <TableRender
            className="call-logs-table call-logs-render-v2"
            ref={tableRef}
            rowKey={Math.random}
            search={{
              schema: getSchema(groupList, {
                botNo,
                iframeStyle,
                startTime: startTime && decodeURIComponent(startTime),
                endTime: endTime && decodeURIComponent(endTime)
              }),
              widgets: {
                RangeTimePicker: (props) => {
                  return <RangeTimePicker {...props} isSecond={true} />
                }
              },
              props: { botNo },
              mode: "simple",
              retainBtn: [] // ['rest', 'submit']
              // searchBtnRender: (submit, clearSearch) => [
              //   <Button type="primary" key="search" onClick={submit}>
              //     查询
              //   </Button>,
              //   <Button
              //     key="reset"
              //     onClick={() => {
              //       form.resetFields()
              //       clearSearch()
              //     }}
              //   >
              //     重置
              //   </Button>
              // ]
            }}
            scroll={{ x: 1800, y: "77vh" }}
            pagination={{
              showSizeChanger: true,
              size: "default",
              showTotal: () => `共${realTotal || 0}条`
            }}
            request={request}
            columns={tableColumns}
            toolbarAction={{
              enabled: ["refresh", "columnsSetting", "density"],
              columnsSettingValue,
              onColumnsSettingChange
            }}
            toolbarRender={
              <>
                <Button onClick={onExportCallRecords}>导出</Button>
                {iframeStyle === "true" && (
                  <Button
                    key="manageLabel"
                    type="primary"
                    // ghost
                    // style={{ marginLeft: 20 }}
                    onClick={() =>
                      setTagModalData({
                        visible: true,
                        record: null,
                        mode: "manage"
                      })
                    }
                  >
                    管理标注标签
                  </Button>
                )}
              </>
            }
          />
        </Form>
      </div>

      {/* <DetailDrawer visible={visible} setVisible={setVisible} formData={formData} /> */}

      {/* <ExecuteProcessDrawer
        visible={executeProcessVisible}
        setVisible={setExecuteProcessVisible}
        executeProcessParams={executeProcessParams}
      /> */}
      <TagModal
        {...tagModalData}
        botNo={botNo}
        refreshTableData={refreshTableData}
        setVisible={(bool) => setTagModalData((preState) => ({ ...preState, visible: bool }))}
      />
      <OptimizeDrawer
        {...optimizeData}
        queryParams={queryParams}
        refreshTableData={refreshTableData}
        setVisible={(bool) => setOptimizeData((preState) => ({ ...preState, visible: bool }))}
      />
      <LogDetailDrawer
        visible={logDetailVisible}
        setVisible={setLogDetailVisible}
        record={currentRecord}
        tableColumns={columns}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        refreshTableData={refreshTableData}
        from="callLogs"
      />

      {contextHolder}
    </div>
  )
}
