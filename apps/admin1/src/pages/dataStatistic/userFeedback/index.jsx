import { useRef } from "react"
import TableRender from "table-render"
import { getSchema } from "./schema"
import { searchApi } from "./request"
import { useFetchAuthPermissionGroupList } from "@/api/permission"
import { useFetchFeedbackSource, useFetchFeedbackTag } from "@/api/userFeedback"
import { useState } from "react"
import { fetchFeedbackColumns, updateFeedbackColumns } from "@/api/userFeedback/api"
import { useEffect } from "react"
import { PAGE_CODE } from "@/constants/pageCode"
import { Button, Tag } from "antd"
import { cloneDeep, initial } from "lodash"
import DetailDrawer from "./detailDrawer"
import { Typography } from "antd"
import { Image } from "antd"
import RangeTimePicker from "@/components/RangeTime"

export const likedSrc =
  "https://alicdn.zaticdn.com/zaip/zaip-toolweb-file-service/upload/uG8HmH3MxEkG7Wn4Sx6VA7-已赞.png"
export const disLikedSrc =
  "https://alicdn.zaticdn.com/zaip/zaip-toolweb-file-service/upload/mLYC9LUVcRZUFWjAMssaz1-已踩.png"

export const getImgSrc = (context) => {
  if (typeof context !== "string") return
  const matches = context.match(/<img src="([^"]*)"/)
  return matches?.[1]
}
export default () => {
  const tableRef = useRef()
  const [columnsSettingValue, setColumnsSettingValue] = useState([]) // 列设置
  const [columns, setColumns] = useState([]) // 列

  const [visible, setVisible] = useState(false)
  const [formData, setFormData] = useState({})

  const { data: groupList = [] } = useFetchAuthPermissionGroupList()
  const { data: tagList = [] } = useFetchFeedbackTag()
  const { data: sourceList = [] } = useFetchFeedbackSource()

  const handleView = (record) => {
    setFormData(record)
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

  const onColumnsSettingChange = (setting) => {
    const removeActionList = initial(setting)
    removeActionList.forEach((item) => {
      if (!item.fixed) {
        item.fixed = null
      }
    })
    setColumnsSettingValue([...removeActionList, actionRow])
    const fields = []
    removeActionList.forEach((item) => {
      columns.forEach((column) => {
        if (item.key === column.key) {
          fields.push({
            fieldKey: column.key,
            fieldName: column.title,
            fieldNo: column.dataIndex,
            supportSort: column.sorter,
            hidden: item.hidden,
            fixed: item.fixed
          })
        }
      })
    })
    updateFeedbackColumns({
      fields,
      pageCode: PAGE_CODE.USER_FEED_BACK
    })
  }

  const formatColumns = (columns) => {
    const _columns = cloneDeep(columns)
    _columns.push(actionRow)
    setColumnsSettingValue(_columns)

    // 列具体配置
    _columns.forEach((item) => {
      item.align = "center"
      if (item.dataIndex === "feedbackResult") {
        item.render = (text) => {
          return <img style={{ width: "20px" }} src={text === 1 ? likedSrc : disLikedSrc} />
        }
      }
      if (item.dataIndex === "feedbackTag") {
        item.align = "left"
        item.render = (text) => {
          return text
            ? text.split(",").map((item) => (
                <Tag style={{ marginBottom: "5px" }} color="processing">
                  {item}
                </Tag>
              ))
            : null
        }
      }

      if (["responseContext", "requestContext"].includes(item.dataIndex)) {
        item.width = 300
        item.align = "left"
        item.render = (text) => {
          const imgSrc = getImgSrc(text)
          return imgSrc ? (
            <Image height={58} src={imgSrc} />
          ) : (
            <Typography.Paragraph style={{ margin: 0 }} ellipsis={{ rows: 2, tooltip: text }}>
              {text}
            </Typography.Paragraph>
          )
        }
      }
    })
    return _columns
  }

  const getSelectColumns = async () => {
    const res = await fetchFeedbackColumns(PAGE_CODE.USER_FEED_BACK)
    const _columns = res.map((item) => ({
      key: item.fieldKey,
      title: item.fieldName,
      dataIndex: item.fieldNo,
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
        rowKey={(record) => `${record.gmtCreated}_${Math.random()}`}
        search={{
          schema: getSchema(groupList, tagList, sourceList),
          widgets: { RangeTimePicker }
        }}
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
