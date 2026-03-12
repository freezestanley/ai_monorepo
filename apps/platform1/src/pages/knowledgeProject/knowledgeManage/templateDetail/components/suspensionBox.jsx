import { useCallback, useMemo, useState } from "react"
import Draggable from "react-draggable"
import { Button, Tag, Modal, message } from "antd"
import {
  CloseCircleOutlined,
  CloseOutlined,
  ProductOutlined,
  CheckCircleOutlined
} from "@ant-design/icons"
import { cancelBubble } from "@/utils"
import DetailEditDrawer from "./detailEditDrawer"
import { OPTION_TYPE } from "./operationBox"
import styles from "./index.module.scss"

const title = {
  [OPTION_TYPE.BIND]: "绑定",
  [OPTION_TYPE.UNBIND]: "解绑",
  [OPTION_TYPE.MOVE]: "移动"
}

const SuspensionBox = ({
  state,
  visiable,
  setVisible,
  dispatch,
  setDrawerOpen,
  drawerOpen,
  form,
  onSubmit,
  onOpenTour,
  tourOpen,
  relationDetailInfo
}) => {
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [optionStatus, setOptionStatus] = useState(null)
  const { optionType, goalData, temporaryData } = useMemo(() => state || {}, [state])

  const isHasValue = useMemo(() => {
    return !!Object.values(goalData)?.find((v) => !!v?.length)
  }, [goalData])

  const onCloseBox = useCallback(() => {
    if (!temporaryData?.length && !isHasValue) {
      setVisible(false)
      setDrawerOpen(false)
      dispatch({ type: "init" })
      return
    }
    Modal.confirm({
      type: "warning",
      title: "提示",
      content: "操作尚未提交，关闭后将全部清空，是否确定关闭？",
      onOk: () => {
        setVisible(false)
        setDrawerOpen(false)
        dispatch({ type: "init" })
      }
    })
  }, [temporaryData, isHasValue, setVisible, setDrawerOpen, dispatch])

  const onClear = useCallback(() => {
    dispatch({ type: "setTemporaryData", data: [] })
  }, [dispatch])

  const onSave = useCallback(async () => {
    if (editDrawerOpen) {
      dispatch({
        type: "setGoalData",
        data: { ...goalData, [optionStatus]: temporaryData }
      })
      setEditDrawerOpen(false)
      onClear()
      return
    }
    if (OPTION_TYPE.BIND === optionType) {
      const list = [...(temporaryData || [])].map(
        ({ initLayer, intentionId }) => initLayer + intentionId
      )
      if (list.length !== new Set(list).size) {
        message.warning("同一层级不能绑定多个相同意图！")
        return
      }
    }
    if (OPTION_TYPE.MOVE === optionType) {
      if (!drawerOpen) {
        setDrawerOpen(true)
        return
      }
      const values = await form.validateFields()
      const newTemporaryData = temporaryData?.map((item) => ({
        ...item,
        targetLevelId: values._targetLevelId
      }))
      dispatch({
        type: "setGoalData",
        data: { [optionType]: [...goalData[optionType], ...newTemporaryData] }
      })
      setDrawerOpen(false)
    } else {
      dispatch({
        type: "setGoalData",
        data: { [optionType]: [...goalData[optionType], ...temporaryData] }
      })
    }
    onClear()
  }, [
    editDrawerOpen,
    optionType,
    onClear,
    dispatch,
    goalData,
    temporaryData,
    drawerOpen,
    form,
    setDrawerOpen,
    optionStatus
  ])

  return (
    <>
      <Draggable bounds="#root">
        <div className={styles["draggable-bottom-box"]}>
          <div
            className={`${styles["box-content"]} ${typeof visiable === "boolean" && styles[visiable ? "show" : "hide"]}`}
          >
            <div className={styles["header-box"]}>
              <span>
                已选中
                <br />（{temporaryData?.length ?? 0}）
              </span>
              <Button size="small" onClick={onClear} disabled={!temporaryData?.length}>
                清除选中
              </Button>
              <Button
                size="small"
                type="primary"
                className="template-save-btn"
                disabled={!temporaryData?.length && !editDrawerOpen}
                onClick={onSave}
              >
                保存
              </Button>
              <CloseOutlined
                onClick={(e) => {
                  cancelBubble(e)
                  onCloseBox()
                }}
              />
            </div>
            <div className={styles["content-box"]}>
              <div className={styles["left-box"]}>
                已保存：
                {Object.entries(goalData)?.map(([key, val]) => {
                  if (!val?.length) return null
                  return (
                    <Tag
                      key={key}
                      bordered={false}
                      color={
                        key === OPTION_TYPE.BIND
                          ? "orange"
                          : key === OPTION_TYPE.UNBIND
                            ? "processing"
                            : "cyan"
                      }
                      closable
                      closeIcon={<CloseCircleOutlined />}
                      onClose={(e) => {
                        cancelBubble(e)
                        e.preventDefault()
                        Modal.confirm({
                          type: "warning",
                          title: "提示",
                          content: "是否清空当前选中记录？",
                          onOk: () =>
                            dispatch({
                              type: "setGoalData",
                              data: { [key]: [] }
                            })
                        })
                      }}
                      style={{
                        cursor: temporaryData?.length ? "initial" : "pointer"
                      }}
                      onClick={(e) => {
                        cancelBubble(e)
                        e.preventDefault()
                        if (temporaryData?.length) return
                        setOptionStatus(key)
                        onOpenTour()
                        setEditDrawerOpen(true)
                      }}
                    >
                      {title[key]}
                      <br />（{val?.length ?? 0}）
                    </Tag>
                  )
                })}
              </div>
              <div className={styles["right-box"]}>
                <Button
                  type="primary"
                  ghost
                  icon={<ProductOutlined />}
                  disabled={
                    tourOpen ||
                    temporaryData?.length ||
                    !optionType ||
                    (editDrawerOpen && !temporaryData?.length)
                  }
                  className="template-continue-btn"
                  onClick={() => {
                    dispatch({ type: "setOptionType", data: null })
                    setDrawerOpen(false)
                  }}
                >
                  继续操作
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  disabled={!isHasValue || temporaryData?.length}
                  onClick={onSubmit}
                  className="template-submit-btn"
                >
                  提交完成
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Draggable>
      <DetailEditDrawer
        visiable={editDrawerOpen}
        setVisiable={setEditDrawerOpen}
        state={state}
        dispatch={dispatch}
        optionStatus={optionStatus}
        relationDetailInfo={relationDetailInfo}
      />
    </>
  )
}

export default SuspensionBox
