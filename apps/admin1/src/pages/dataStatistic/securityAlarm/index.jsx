import { useRef } from "react"
import TableRender from "table-render"
import { getSchema } from "./schema"
import { searchApi } from "./request"
import { useFetchAuthPermissionGroupList } from "@/api/permission"
import { useState } from "react"
import { fetchFeedbackColumns, updateFeedbackColumns } from "@/api/userFeedback/api"
import { useEffect } from "react"
import { PAGE_CODE } from "@/constants/pageCode"
import { Button } from "antd"
import { cloneDeep, initial } from "lodash"
import { Tag } from "antd"
import { DislikeOutlined, LikeOutlined } from "@ant-design/icons"
import DetailDrawer from "./detailDrawer"
import { Typography } from "antd"
import { getImgSrc } from "../userFeedback"
import { Image } from "antd"
import RangeTimePicker from "@/components/RangeTime"

export default () => {
  const tableRef = useRef()
  const [columnsSettingValue, setColumnsSettingValue] = useState([]) // 列设置
  const [columns, setColumns] = useState([]) // 列

  const [visible, setVisible] = useState(false)
  const [formData, setFormData] = useState({})

  const { data: groupList = [] } = useFetchAuthPermissionGroupList()

  const handleView = (record) => {
    const _record = { ...record }
    _record.sensitiveWords = _record.sensitiveWords.join(",")

    setFormData(_record)
    setVisible(true)
  }

  const actionRow = {
    title: "操作",
    key: "action",
    hidden: false,
    dataIndex: "action",
    fixed: "right",
    width: 100,
    render: (_, record) => (
      <Button type="link" onClick={() => handleView(record)}>
        详情
      </Button>
    )
  }

  const isImg = (context) => context.indexOf("<img src=") > -1

  const onColumnsSettingChange = (setting) => {
    const removeActionList = initial(setting)
    setColumnsSettingValue([...removeActionList, actionRow])
    const fields = []
    removeActionList.forEach((item) => {
      columns.forEach((column) => {
        if (item.key === column.key) {
          fields.push({
            fieldKey: column.dataIndex,
            fieldName: column.title,
            fieldNo: column.key,
            supportSort: column.sorter,
            hidden: item.hidden,
            fixed: item.fixed
          })
        }
      })
    })
    updateFeedbackColumns({
      fields,
      pageCode: PAGE_CODE.SECURITY_ALARM
    })
  }

  const formatColumns = (columns) => {
    const _columns = cloneDeep(columns)
    _columns.push(actionRow)
    setColumnsSettingValue(_columns)

    // 列具体配置
    _columns.forEach((item) => {
      if (item.dataIndex === "feedbackResult") {
        item.render = (text) => {
          return text === 1 ? (
            <LikeOutlined style={{ color: "#7f56d9", fontSize: "16px" }} />
          ) : text === -1 ? (
            <DislikeOutlined style={{ color: "red", fontSize: "16px" }} />
          ) : (
            "--"
          )
        }
      }
      if (["responseContext", "requestContext", "sensitiveWords"].includes(item.dataIndex)) {
        item.width = 300
        item.align = "left"
        item.render = (text) => {
          const imgSrc = getImgSrc(text)
          return imgSrc ? (
            <Image height={58} src={imgSrc} />
          ) : (
            <Typography.Paragraph style={{ margin: 0 }} ellipsis={{ rows: 2, tooltip: text }}>
              {item.dataIndex === "sensitiveWords" ? text?.join(",") || "" : text}
            </Typography.Paragraph>
          )
        }
      }
      if (item.dataIndex === "modelType") {
        item.render = (text) => text?.join(",")
      }
      if (item.dataIndex === "feedbackTag") {
        item.render = (text) => {
          return text ? text.split(",").map((item) => <Tag color="processing">{item}</Tag>) : null
        }
      }
    })
    return _columns
  }

  const getSelectColumns = async () => {
    const res = await fetchFeedbackColumns(PAGE_CODE.SECURITY_ALARM)
    const _columns = res.map((item) => ({
      key: item.fieldNo,
      title: item.fieldName,
      dataIndex: item.fieldKey,
      sorter: item.supportSort,
      fixed: item.fixed,
      hidden: item.hidden,
      width: 200
    }))
    setColumns(formatColumns(_columns))
  }

  useEffect(() => {
    getSelectColumns()
  }, [])

  return (
    <>
      <TableRender
        ref={tableRef}
        rowKey={"gmtCreated"}
        search={{ schema: getSchema(groupList), widgets: { RangeTimePicker } }}
        scroll={{ x: 1500 }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共${total}条`
        }}
        // @ts-ignore
        request={searchApi}
        // @ts-ignore
        columns={columns}
        toolbarAction={{
          // @ts-ignore
          columnsSettingValue,
          onColumnsSettingChange
        }}
      />
      <DetailDrawer visible={visible} setVisible={setVisible} formData={formData} />
    </>
  )
}
