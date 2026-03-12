import React, { useEffect, useState, useMemo } from "react"
// @ts-ignore
import { Switch, Form, Tooltip, Table, Button, Pagination, Typography, Tag } from "antd"
import OverflowTooltip from "@/components/overflowTooltip"
import StatusBadge from "@/components/StatusBadge"
import { useFetchStructureDatasetList } from "@/api/structureKnowledge"
import { useRecordListByPage } from "@/api/knowledge"
import { useFetchSourceTag } from "@/api/sourceTag"
import { TableFilter } from "@/utils/tableFliter"
import { useRef } from "react"

const { Text } = Typography

// @ts-ignore
const RelationData = (props) => {
  const {
    form,
    relationSwitch,
    botNo,
    relationChoice,
    optionDetail,
    showRelationMsg,
    selectHandle,
    activeKey,
    disabled,
    editDetail,
    availableTags,
    choiceHandle
  } = props

  // const [formRelation] = Form.useForm()
  const searchRelationInput = useRef(null)

  const [selectedRowKeys, setSelectedRowKeys] = useState(undefined)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [filterParams, setFilterParams] = useState({
    sourceDesc: null,
    statusDesc: null,
    sort: {}
  })
  // const [oldSelectData, setOldSelectData] = useState([])
  const [check, setCheck] = useState(false)
  const [selectFilter, setSelectFilter] = useState([])

  const { mutate: fetchSourceTag } = useFetchSourceTag()
  const [sourceTagV2, setSourceTagV2] = useState([])
  useEffect(() => {
    fetchSourceTag(
      {
        botNo,
        tagType: "knowledgeAnswerSource"
      },
      {
        onSuccess: (res) => {
          // @ts-ignore
          if (res.success === true) {
            setSourceTagV2([
              {
                tagDesc: "默认",
                code: "default"
              },
              ...(res.data || [])
            ])
          }
        }
      }
    )
  }, [botNo])

  // 请求数据集列表接口
  const {
    data: tableData,
    refetch: getTableHandle,
    isLoading: tableLoading
  } = useRecordListByPage({
    knowledgeBaseNo: optionDetail?.knowledgeBaseNo,
    catalogNo: optionDetail?.catalogNo,
    structureNo: optionDetail?.structureNo,
    searchConditions: check
      ? [
          {
            key: "id.keyword",
            operation: "in",
            value: selectedRowKeys
          },
          ...selectFilter
        ]
      : selectFilter,
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    filterFieldKey: "sourceTag",
    filterFieldValue: activeKey
  })
  const datasetInfo = tableData?.data?.structure || {}

  const records = tableData?.data?.records || []

  const dataSource = useMemo(
    () =>
      records?.map((record) => {
        const res = { subRecord: record }
        record.forEach(({ key, value }) => {
          res[key] = (value ?? "") + ""
        })
        return res
      }),
    [records]
  )

  const columns = useMemo(() => {
    const _columns = [
      ...(datasetInfo.strategies?.map(({ name, key, tagKeys = [] }) => {
        return {
          title: (
            <div>
              <Text strong>{name}</Text>
            </div>
          ),
          dataIndex: key,
          key: key,
          ...TableFilter({
            form, // 表单 form
            disabled: false,
            searchParams: () => {
              const val = form.getFieldValue(key)
              return {
                [key]: val
              }
            }, // 搜索条件
            searchInput: searchRelationInput, // useRef(null)
            refresh: (value) => {
              filterHandle(value, key)
            }, // 刷新方法
            dataIndex: key, //item.fieldKey, // index key
            fieldType: key !== "sourceTag" ? "" : "select", //item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
            enums: sourceTagV2?.slice(1)?.map((item) => ({
              desc: item?.tagDesc,
              value: item?.code
            }))
          }),
          render: (text) =>
            key !== "sourceTag" ? (
              <div className={`min-w-28 ${key === "payload" ? "max-w-5xl" : "max-w-xs"}`}>
                {text}
              </div>
            ) : (
              <Tag>{sourceTagV2?.find((source) => source?.code === text)?.tagDesc || "默认"}</Tag>
            )
        }
      }) || [])
    ]

    if (!_columns.find(({ key }) => key === "id")) {
      _columns.unshift({
        title: records?.[0]?.find(({ key }) => key === "id")?.name || "编号",
        dataIndex: "id",
        key: "id",
        width: 400
      })
    }
    return _columns
  }, [datasetInfo.strategies, records, form, searchRelationInput, sourceTagV2])

  const handleTableChange = (pagination, filter, sort) => {
    setFilterParams({
      ...filter,
      sort
    })
  }

  // 查看结构化数据集合
  const checkChoiceSelectHandle = () => {
    setCheck(!check)
    getTableHandle()
  }

  useEffect(() => {
    // 获得当前关联数据集合已经选中的
    const selectDataArray =
      editDetail?.faqAnswerWithTag?.find((item) => item.tagKey === activeKey)
        ?.associatedStructureRawData || []
    const currentIds =
      selectDataArray?.find((s) => s?.structureNo === optionDetail?.structureNo)?.rawDataIds || []
    setSelectedRowKeys(currentIds)
  }, [activeKey, optionDetail?.structureNo])

  const filterHandle = (value, key) => {
    let newSelectFilter = selectFilter
    const filterIndex = newSelectFilter.findIndex((s) => s.key === key)

    if (filterIndex > -1) {
      value
        ? (newSelectFilter[filterIndex]["value"] = value)
        : newSelectFilter.splice(filterIndex, 1)
    } else {
      newSelectFilter.push({
        key: key,
        value: value,
        operation: "match"
      })
    }

    setSelectFilter(newSelectFilter)
    getTableHandle()
  }

  useEffect(() => {
    choiceHandle(selectedRowKeys)
  }, [selectedRowKeys])

  return (
    //pl-[8.2%]
    <div className="mt-2 pl-[0]">
      <div
        className={`mt-2 bg-gray-100 px-4 pt-3 pb-3 rounded-md ${(selectedRowKeys && selectedRowKeys?.length === 0) || showRelationMsg ? "bg-red-50" : ""}`}
      >
        <div className="mb2">
          <span className="text-gray-400"> 已选择：{selectedRowKeys?.length || 0}条</span>
          <a className="ml-3" onClick={checkChoiceSelectHandle}>
            {check ? "取消查看" : "查看"}
          </a>
          {(selectedRowKeys && selectedRowKeys?.length === 0) || showRelationMsg ? (
            <span className="ml-3 text-red-500 font-bold">请选择结数据！</span>
          ) : (
            ""
          )}
        </div>

        <Table
          size="small"
          pagination={false}
          scroll={{ x: 1300, y: 600 }}
          onChange={handleTableChange}
          rowSelection={{
            fixed: true,
            selectedRowKeys: selectedRowKeys,
            preserveSelectedRowKeys: true,
            getCheckboxProps: (record) => ({
              disabled: false // Column configuration not to be checked
            }),
            onChange: (newSelectedRowKeys) => {
              setSelectedRowKeys(newSelectedRowKeys)
              selectHandle(newSelectedRowKeys)
            }
          }}
          loading={tableLoading}
          dataSource={dataSource || []}
          rowKey={(row) => row.id}
          columns={columns}
        />

        <Pagination
          className="pr-2"
          current={pagination.current}
          size="small"
          pageSize={pagination.pageSize}
          total={tableData?.data?.total}
          onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
          showSizeChanger={true}
          style={{ marginTop: "15px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
        />
      </div>
    </div>
  )
}
export default RelationData
