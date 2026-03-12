import { useMemo, useState } from "react"
import { Steps, Space, Button, Dropdown, Modal } from "antd"
import { useQueryClient } from "@tanstack/react-query"
import { CloseCircleOutlined, SyncOutlined, InfoCircleFilled } from "@ant-design/icons"
import {
  useFetchPublishOrder,
  useFetchPublishOrderStepBack,
  useStopPublishOrder,
  useFetchPublishOrderSkipConfirm,
  useFetchPublishOrderRollBack
} from "@/api/versionRelease"
import { QUERY_KEYS } from "@/constants/queryKeys"
import HeaderTitle from "../HeaderTitle"
import HistoryDrawer from "./HistoryDrawer"
import GrayscaleDeployModal from "./GrayscaleDeployModal"
import styles from "./index.module.less"

const STATUS_MAP = {
  PENDING_EXECUTION: "wait",
  EXECUTING: "process",
  COMPLETED: "finish",
  FAILED: "error",
  ROLLED_BACK: "wait"
}

const ReleaseSteps = ({ data, botNo, parentOrigin, publishOrderId }) => {
  const [isHistoryVisible, setIsHistoryVisible] = useState(false)
  const [isGrayscaleDeployVisible, setIsGrayscaleDeployVisible] = useState(false)
  const [isRead, setIsRead] = useState(false)

  const queryClient = useQueryClient()
  const { mutate: fetchPublishOrder, isLoading: isFetching } = useFetchPublishOrder()
  const { mutate: fetchPublishOrderStepBack, isLoading: isFetchingStepBack } =
    useFetchPublishOrderStepBack()
  const { mutate: stopPublishOrder, isLoading: isStopLoading } = useStopPublishOrder()
  const { mutate: fetchPublishOrderSkipConfirm, isLoading: isSkipLoading } =
    useFetchPublishOrderSkipConfirm()
  const { mutate: fetchPublishOrderRollBack, isLoading: isRollBackLoading } =
    useFetchPublishOrderRollBack()

  const currentIndex = useMemo(
    () => data?.publishChain?.nodes?.findIndex((item) => item.nodeType === data?.currentNode),
    [data]
  )

  const nextNodeName = useMemo(
    () => {
      const { skippable, nodeName } = data?.publishChain?.nodes?.[currentIndex + 1] || {}
      return skippable ? data?.publishChain?.nodes?.[currentIndex + 2]?.nodeName : nodeName
    },
    [currentIndex, data?.publishChain?.nodes],
    []
  )

  const disabled = useMemo(() => {
    return !data?.publishChain?.nodes
      ?.slice(0, currentIndex + 1)
      ?.every((item) => item.status === "COMPLETED" || item.status === "SKIPPED")
  }, [data, currentIndex])

  const onCancelRelease = () => {
    Modal.confirm({
      title: "确认【终止】本次发布?",
      content: "终止后相关物料将被释放",
      icon: <InfoCircleFilled className="text-[#7F56D9]" />,
      okText: "确认",
      cancelText: "取消",
      okButtonProps: {
        loading: isStopLoading
      },
      onOk: () => {
        stopPublishOrder(
          {
            publishOrderId
          },
          {
            onSuccess: (res) => {
              if (res.success) {
                queryClient.invalidateQueries([QUERY_KEYS.VERSION_PUBLISH_ORDER_DETAIL])
              }
            }
          }
        )
      }
    })
  }

  const onRollBackRelease = () => {
    Modal.confirm({
      title: "确认【回滚】该发布单?",
      content: "回滚后本次发布单将作废，退回到上一个版本",
      icon: <InfoCircleFilled className="text-[#7F56D9]" />,
      okText: "确认",
      cancelText: "取消",
      okButtonProps: {
        loading: isRollBackLoading
      },
      onOk: () => {
        fetchPublishOrderRollBack({
          publishOrderId,
          nodeTypeEnum: "PRD_DEV_CREATE"
        })
      }
    })
  }

  const onBackCreateRelease = () => {
    Modal.confirm({
      title: "确认【返回创建】?",
      icon: <InfoCircleFilled className="text-[#7F56D9]" />,
      okText: "确认",
      cancelText: "取消",
      okButtonProps: {
        loading: isFetchingStepBack
      },
      onOk: () => {
        fetchPublishOrderStepBack({ publishOrderId, nodeTypeEnum: "PRD_DEV_CREATE" })
      }
    })
  }

  const onNextRelease = () => {
    const { skippable, skipped, nodeType } = data?.publishChain?.nodes?.[currentIndex + 1] || {}
    if (skippable && !skipped) {
      Modal.confirm({
        title: "发布至PRD环境，是否需要灰度验证？",
        width: 550,
        icon: <InfoCircleFilled className="!text-[#7F56D9]" />,
        content: (
          <div className="mt-4 text-right">
            <Button
              className="mr-3"
              loading={isFetching || isSkipLoading}
              onClick={() => {
                Modal.destroyAll()
                fetchPublishOrderSkipConfirm({
                  publishOrderId,
                  skip: true,
                  nodeTypeEnum: nodeType
                })
              }}
            >
              不需要，直接发布到PRD环境
            </Button>
            <Button
              type="primary"
              loading={isFetching || isSkipLoading}
              onClick={() => {
                Modal.destroyAll()
                fetchPublishOrderSkipConfirm({
                  publishOrderId,
                  skip: false,
                  nodeTypeEnum: nodeType
                })
              }}
            >
              需要，开始PRD环境灰度验证
            </Button>
          </div>
        ),
        footer: null,
        closable: true
      })
      return
    }
    Modal.confirm({
      title: `确认发布至${nextNodeName}环境 ？`,
      icon: <InfoCircleFilled className="text-[#7F56D9]" />,
      okText: "确认",
      cancelText: "取消",
      okButtonProps: {
        loading: isFetching || isSkipLoading
      },
      onOk: () => {
        if (skippable && skipped) {
          fetchPublishOrderSkipConfirm({
            publishOrderId,
            skip: true,
            nodeTypeEnum: nodeType
          })
        } else {
          fetchPublishOrder({
            publishOrderId,
            nodeTypeEnum: nodeType
          })
        }
      }
    })
  }

  const items = useMemo(() => {
    return data?.publishChain?.nodes?.map((item, index) => {
      return {
        title: item.nodeName,
        key: item.nodeType,
        status: STATUS_MAP[item.status] || "wait",
        style: item.enabled ? {} : { display: "none" },
        description: (
          <div className="h-[68px]">
            {currentIndex >= index && (
              <div className="flex items-center justify-between">
                <div className="text-[#475467] text-[12px]">{item.startTime}</div>
                <div className="text-[#475467] text-[12px]">{item.modifier || item.creator}</div>
              </div>
            )}
            <div className="flex items-center mt-[4px]">
              {item.status === "COMPLETED" && (
                <>
                  {item?.nodeType === "PRD_GRAYSCALE_DEPLOY" && (
                    <>
                      {data?.currentNode === "PRD_GRAYSCALE_DEPLOY" ? (
                        <Button
                          className="!text-[#7F56D9]"
                          onClick={() => {
                            setIsRead(false)
                            setIsGrayscaleDeployVisible(true)
                          }}
                        >
                          验证计划
                        </Button>
                      ) : (
                        <Button
                          className={styles.retry}
                          icon={<i className="iconfont icon-guizepeizhi" />}
                          onClick={() => {
                            setIsRead(true)
                            setIsGrayscaleDeployVisible(true)
                          }}
                        >
                          查看验证计划结果
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
              {item.status === "FAILED" && (
                <>
                  <Dropdown
                    menu={{ items: [{ key: "1", label: item.failureReason, disabled: true }] }}
                    placement="bottom"
                    overlayClassName={styles.errorReasonDropdown}
                  >
                    <Button className={styles.errorReason} icon={<CloseCircleOutlined />}>
                      失败原因
                    </Button>
                  </Dropdown>
                  {data?.status !== "STOP" && !data?.rollbackFlag && (
                    <Button
                      className={styles.retry}
                      icon={<SyncOutlined />}
                      loading={isFetching}
                      onClick={() =>
                        fetchPublishOrder({
                          publishOrderId,
                          nodeTypeEnum: item?.nodeType
                        })
                      }
                    >
                      重试
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      }
    })
  }, [data, isFetching, currentIndex, publishOrderId])

  return (
    <div className="h-[100%] flex flex-col overflow-hidden">
      <HeaderTitle
        title="发布单步骤"
        rightContent={
          <Button
            className="!p-0"
            icon={<i className="iconfont icon-lishirizhi" />}
            type="link"
            onClick={() => setIsHistoryVisible(true)}
          >
            历史日志
          </Button>
        }
      />
      <div className="p-[20px] flex-1 overflow-y-auto">
        <Steps
          className={styles.steps}
          progressDot
          direction="vertical"
          items={items}
          current={data?.currentNode}
        />
      </div>
      {data?.status !== "STOP" && !data?.rollbackFlag && (
        <Space size={16} className={styles.footer}>
          {data?.currentNode === "PRD_DEPLOY" && data?.status === "SUCCESS" ? (
            <Button
              type="primary"
              loading={isRollBackLoading}
              disabled={disabled}
              onClick={onRollBackRelease}
            >
              回滚发布单
            </Button>
          ) : (
            <>
              <Button className={styles.cancel} loading={isStopLoading} onClick={onCancelRelease}>
                终止发布
              </Button>
              {data?.currentNode !== "PRD_DEV_CREATE" && (
                <Button loading={isFetchingStepBack} onClick={onBackCreateRelease}>
                  返回创建
                </Button>
              )}
              {!!nextNodeName && (
                <Button
                  type="primary"
                  loading={isFetching || isSkipLoading}
                  disabled={disabled}
                  onClick={onNextRelease}
                >
                  发布至{nextNodeName}
                </Button>
              )}
            </>
          )}
        </Space>
      )}
      <HistoryDrawer
        publishOrderId={publishOrderId}
        setIsGrayscaleDeployVisible={setIsGrayscaleDeployVisible}
        setIsRead={setIsRead}
        visible={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
      />
      <GrayscaleDeployModal
        data={data}
        botNo={botNo}
        isRead={isRead}
        parentOrigin={parentOrigin}
        visible={isGrayscaleDeployVisible}
        onCancel={() => setIsGrayscaleDeployVisible(false)}
      />
    </div>
  )
}

export default ReleaseSteps
