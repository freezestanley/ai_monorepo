import { useMemo, useCallback, useEffect } from "react"
import { Drawer, Modal, Table } from "antd"
import { findKnowledgeLayerNodes } from "@/pages/knowledgeProject/utils"
import { OPTION_TYPE } from "./operationBox"
import { bindColumns } from "./operationDrawer"

const titleMap = {
  [OPTION_TYPE.BIND]: "绑定-保存详情",
  [OPTION_TYPE.MOVE]: "移动至层级-保存详情",
  [OPTION_TYPE.UNBIND]: "解绑-保存详情"
}

const DetailEditDrawer = ({
  visiable,
  setVisiable,
  state,
  dispatch,
  optionStatus,
  relationDetailInfo
}) => {
  const { goalData, temporaryData } = useMemo(() => state || {}, [state])

  const tableList = useMemo(() => {
    const list = goalData?.[optionStatus] || []
    if (optionStatus !== OPTION_TYPE.MOVE) {
      return list
    }
    return [...list].map((item) => {
      const targetLevel = findKnowledgeLayerNodes(relationDetailInfo || [], item.targetLevelId, {
        childName: "childIntentionLevelVOS"
      })
      return { ...item, targetLevel }
    })
  }, [goalData, optionStatus, relationDetailInfo])

  useEffect(() => {
    visiable &&
      dispatch({
        type: "setTemporaryData",
        data: goalData?.[optionStatus] || []
      })
  }, [dispatch, goalData, optionStatus, visiable])

  const onSelectedRowKeys = useCallback(
    (_, selectedRows) => {
      dispatch({
        type: "setTemporaryData",
        data: selectedRows || []
      })
    },
    [dispatch]
  )

  const tableProps = useMemo(() => {
    let tProps = {}
    switch (optionStatus) {
      case OPTION_TYPE.BIND:
        tProps = {
          columns: bindColumns,
          rowSelection: {
            fixed: true,
            selectedRowKeys: temporaryData?.map(({ id }) => id),
            onChange: onSelectedRowKeys
          }
        }
        break
      case OPTION_TYPE.MOVE:
        tProps = {
          columns: [
            {
              title: "意图名称",
              dataIndex: "intentionName"
            },
            {
              title: "意图描述",
              dataIndex: "intentionDesc"
            },
            {
              title: "关联话术",
              dataIndex: "dialogueName",
              width: 220
            },
            {
              title: "当前层级",
              dataIndex: "intentionLevelName"
            },
            {
              title: "目标移动至",
              dataIndex: "targetLevel",
              render: (text) =>
                Array.isArray(text) ? text.map(({ name }) => name)?.join("/") : text
            }
          ],
          rowKey: "dialogueId",
          rowSelection: {
            fixed: true,
            selectedRowKeys: temporaryData?.map(({ dialogueId }) => dialogueId),
            onChange: onSelectedRowKeys
          }
        }
        break
      case OPTION_TYPE.UNBIND:
        tProps = {
          columns: [
            {
              title: "意图id",
              dataIndex: "intentionId"
            },
            {
              title: "意图名称",
              dataIndex: "intentionName"
            },
            {
              title: "意图描述",
              dataIndex: "intentionDesc"
            },
            {
              title: "关联话术",
              dataIndex: "dialogueName",
              width: 220
            },
            {
              title: "绑定信息",
              dataIndex: "creator",
              render: (text, record) => (
                <>
                  {text}
                  <br />
                  {record.gmtCreated}
                </>
              )
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
          ],
          rowKey: "dialogueId",
          rowSelection: {
            fixed: true,
            selectedRowKeys: temporaryData?.map(({ dialogueId }) => dialogueId),
            onChange: onSelectedRowKeys
          }
        }
        break
      default:
        break
    }
    return tProps
  }, [onSelectedRowKeys, optionStatus, temporaryData])

  return (
    <Drawer
      open={visiable}
      size="large"
      title={titleMap[optionStatus]}
      destroyOnClose
      onClose={() => {
        if (!temporaryData?.length) {
          setVisiable(false)
          return
        }
        Modal.confirm({
          title: "提示",
          content: "操作尚未保存，关闭后将全部清空，是否确定关闭？",
          onOk: () => {
            dispatch({
              type: "setTemporaryData",
              data: []
            })
            setVisiable(false)
          }
        })
      }}
    >
      <Table
        className="template-edit-detail-table"
        rowKey={"id"}
        dataSource={tableList}
        scroll={{ x: "max-content" }}
        pagination={false}
        {...tableProps}
      />
    </Drawer>
  )
}

export default DetailEditDrawer
