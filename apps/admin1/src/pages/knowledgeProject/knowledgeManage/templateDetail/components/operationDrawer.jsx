import { useState, useCallback, useMemo, useEffect } from "react"
import { Drawer, Table, TreeSelect, Input, Modal, Form, InputNumber, Tag } from "antd"
import { ControlOutlined } from "@ant-design/icons"
import { debounce } from "lodash"
import { useFetchQueryDialogueUsableApi } from "@/api/knowledgeManage"
import { OPTION_TYPE } from "./operationBox"
import styles from "./index.module.scss"

const filterCommon = (tree) => {
  return tree?.filter((v) => v.name !== "通用")
}

const titleMap = {
  [OPTION_TYPE.BIND]: "绑定",
  [OPTION_TYPE.MOVE]: "移动至层级"
}

export const bindColumns = [
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
    dataIndex: "intentionDescription",
    width: 150
  },
  {
    title: "使用状态",
    dataIndex: "useStatus",
    render: (text) => {
      if (!text) return ""
      return (
        <Tag color={text === "ON" ? "green" : "default"}>{text === "ON" ? "已启用" : "已禁用"}</Tag>
      )
    }
  },
  {
    title: "关联话术",
    dataIndex: "text",
    width: 200
  },
  {
    title: "来源",
    dataIndex: "source"
  },
  {
    title: "更新信息",
    dataIndex: "modifier",
    render: (text, record) => (
      <>
        {text}
        <br />
        {record.gmtModified}
      </>
    )
  }
]

const OperationDrawer = ({
  visiable,
  listByParentAndType,
  setVisiable,
  state,
  dispatch,
  botNo,
  relationDetailInfo,
  form,
  setLevelDrawerOpen,
  allTemplateIntentionList,
  businessSceneId
}) => {
  const { optionType, goalData, temporaryData } = useMemo(() => state || {}, [state])
  const [pagination, setPagination] = useState({ pageNum: 1, pageSize: 10 })
  const [queryParam, setQueryParam] = useState({})
  const { data: dialogueUsableInfo, isLoading } = useFetchQueryDialogueUsableApi({
    ...pagination,
    ...queryParam,
    botNo,
    useStatus: "ON"
  })

  const debounceSetSearch = debounce(setQueryParam, 1000)

  const onChangeSearch = useCallback(
    (value) => {
      debounceSetSearch((preState) => ({ ...preState, ...value }))
    },
    [debounceSetSearch]
  )

  const onSelectedRowKeys = useCallback(
    (_, selectedRows) => {
      dispatch({
        type: "setTemporaryData",
        data:
          selectedRows?.filter(
            ({ id }) => !goalData?.[optionType]?.find((item) => item.id === id)
          ) || []
      })
    },
    [dispatch, goalData, optionType]
  )

  useEffect(() => {
    if (businessSceneId && visiable) {
      setQueryParam({ businessScene: businessSceneId })
    } else if (!visiable) {
      form?.resetFields()
    }
  }, [businessSceneId, form, visiable])

  return (
    <Drawer
      open={visiable}
      width={optionType === OPTION_TYPE.BIND ? "85%" : "50%"}
      title={titleMap[optionType]}
      destroyOnClose
      onClose={() => {
        if (optionType === OPTION_TYPE.MOVE) {
          setVisiable(false)
          return
        }
        if (!temporaryData?.length) {
          dispatch({
            type: "setOptionType",
            data: null
          })
          setVisiable(false)
          return
        }
        Modal.confirm({
          title: "提示",
          content: "操作尚未提交，关闭后将全部清空，是否确定关闭？",
          onOk: () => {
            dispatch({
              type: "setData",
              data: { temporaryData: [], optionType: null }
            })
            setVisiable(false)
          }
        })
      }}
    >
      {optionType === OPTION_TYPE.BIND && (
        <div className="template-bind-content">
          <TreeSelect
            style={{ width: 200 }}
            placeholder="请选择业务场景"
            treeData={listByParentAndType}
            fieldNames={{
              label: "name",
              value: "id",
              children: "childKnowledgeConfigs"
            }}
            treeDefaultExpandAll
            showSearch
            allowClear
            onChange={(value) => onChangeSearch({ businessScene: value })}
            value={queryParam?.businessScene}
            disabled
          />
          <Input
            style={{ marginLeft: 8, width: 200 }}
            placeholder="检索意图/意图描述"
            onChange={(e) => onChangeSearch({ matchIntentionName: e.target.value })}
          />
          <Table
            className="pt-3"
            rowKey={"id"}
            loading={isLoading}
            columns={bindColumns}
            dataSource={dialogueUsableInfo?.records ?? []}
            scroll={{ x: "max-content" }}
            pagination={{
              className: "pr-2",
              current: pagination.pageNum,
              pageSize: pagination.pageSize,
              total: dialogueUsableInfo?.total,
              onChange: (pageNum, pageSize) => setPagination({ pageNum, pageSize }),
              showSizeChanger: true,
              style: { marginTop: "15px", textAlign: "right" },
              showTotal: (total) => `共 ${total} 条`
            }}
            rowSelection={{
              fixed: true,
              preserveSelectedRowKeys: true,
              selectedRowKeys: [
                ...(goalData?.[optionType] || []).map(({ id }) => id),
                ...(temporaryData || []).map(({ id }) => id)
              ],
              onChange: onSelectedRowKeys,
              getCheckboxProps: (record) => ({
                disabled:
                  !!allTemplateIntentionList?.find(({ dialogueId }) => dialogueId === record.id) ||
                  !!goalData?.[optionType]?.find(({ id }) => id === record.id)
              })
            }}
          />
        </div>
      )}
      {optionType === OPTION_TYPE.MOVE && (
        <Form form={form} layout="horizontal">
          <Form.Item label="移动数量">
            <InputNumber className="w-100" disabled value={temporaryData?.length} />
          </Form.Item>
          <Form.Item label="移动至" className={styles["move-form-item"]}>
            <Form.Item
              name="_targetLevelId"
              rules={[{ required: true, message: "请选择" }]}
              noStyle
            >
              <TreeSelect
                placeholder="请选择"
                treeData={filterCommon(relationDetailInfo)}
                fieldNames={{
                  label: "name",
                  value: "id",
                  children: "childIntentionLevelVOS"
                }}
                treeDefaultExpandAll
                showSearch
                allowClear
              />
            </Form.Item>
            <ControlOutlined onClick={() => setLevelDrawerOpen(true)} />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  )
}

export default OperationDrawer
