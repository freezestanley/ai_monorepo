import { useMemo } from "react"
import { Drawer, Steps, Empty, Button, Spin } from "antd"
import classNames from "classnames"
import { useFetchPublishEventRecords } from "@/api/versionRelease"
import empty from "@/assets/img/empty.png"
import styles from "./index.module.less"

const EVENT_NAME_MAP = {
  ORDER_CREATED: "发布单创建",
  ORDER_CLOSED: "发布单关闭",
  ORDER_STOP: "发布单终止",
  ORDER_REVERSION: "发布单回退",
  ORDER_ROLLBACK: "发布单回滚",
  NODE_SKIP: "节点跳过",
  NODE_EXECUTION: "节点执行",
  NODE_ROLLBACK: "节点回滚",
  NODE_TRACK_BACK: "节点回退"
}

const HistoryDrawer = ({
  publishOrderId,
  visible,
  setIsRead,
  setIsGrayscaleDeployVisible,
  onClose
}) => {
  const { data, isLoading } = useFetchPublishEventRecords(
    { publishOrderId, pageNum: 1, pageSize: 1000 },
    {
      enabled: !!(publishOrderId && visible)
    }
  )

  const items = useMemo(() => {
    return data?.data?.data?.map((item) => {
      return {
        title:
          (EVENT_NAME_MAP[item.eventType] || "") +
          (item.nodeName && EVENT_NAME_MAP[item.eventType] ? " - " : "") +
          item.nodeName,
        key: item.id,
        status: item.eventStatus === "FAILED" ? "error" : "wait",
        description: (
          <>
            <div className="flex items-center justify-between">
              <div className="text-[#475467] text-[12px]">{item.operationTime}</div>
              <div className="text-[#475467] text-[12px]">{item.operator}</div>
            </div>
            {item.eventType === "NODE_EXECUTION" && (
              <div className="flex items-center mt-[4px]">
                {item.eventStatus === "SUCCESS" && (
                  <>
                    {item?.nodeType === "PRD_GRAYSCALE_DEPLOY" && (
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
              </div>
            )}
          </>
        )
      }
    })
  }, [data])

  return (
    <Drawer
      title="历史记录"
      open={visible}
      footer={null}
      onClose={onClose}
      rootClassName={styles.historyDrawer}
      mask={false}
      getContainer={false}
      destroyOnClose
    >
      <Spin spinning={isLoading}>
        {data?.data?.data?.length > 0 ? (
          <Steps
            className={classNames(styles.steps, styles.historySteps)}
            progressDot
            direction="vertical"
            items={items}
          />
        ) : (
          <Empty image={empty} description="暂无数据" />
        )}
      </Spin>
    </Drawer>
  )
}

export default HistoryDrawer
