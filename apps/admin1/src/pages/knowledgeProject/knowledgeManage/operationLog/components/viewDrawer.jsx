import { useMemo } from "react"
import { Drawer, Row, Col } from "antd"
import { OperationLogSubType } from "../index"
import styles from "../index.module.scss"

const OperationDesc = {
  intentionId: "意图id",
  intentionName: "意图名称",
  layerName: "意图层级",
  intentionDesc: "意图描述",
  text: "关联话术"
}

const OperationBehaviorDesc = {
  MOVE: "移动至",
  BIND: "绑定至",
  UNBIND: "解绑自"
}

const ViewDrawer = ({ viewData, visiable, setVisiable }) => {
  const listData = useMemo(() => {
    const list = [
      {
        label: "操作类型",
        value: OperationLogSubType[viewData?.operationLogSubType]
      },
      {
        label: "操作人",
        value: viewData?.operator
      },
      {
        label: "操作时间",
        value: viewData?.operationTime
      },
      {
        label: "操作内容",
        value: viewData?.operationContent?.map((item) => {
          const data = Object.keys(OperationDesc).map((key) => ({
            label: OperationDesc[key],
            value: item[key]
          }))
          if (["MOVE", "BIND", "UNBIND", "UPDATE"].includes(viewData?.operationLogSubType)) {
            data.splice(4, 0, {
              label: "操作说明",
              value:
                viewData?.operationLogSubType === "UPDATE"
                  ? `话术修改自“${item?.oldText || ""}”`
                  : `${OperationBehaviorDesc[viewData?.operationLogSubType]}“${item?.templateName}”`
            })
          }
          return data
        })
      }
    ]

    return list
  }, [viewData])

  return (
    <Drawer
      open={visiable}
      width={"70%"}
      title="详情"
      onClose={() => setVisiable(false)}
      destroyOnClose
    >
      <ul className={styles.logViewList}>
        {listData.map(({ name, label, value }) => (
          <li key={name} className={Array.isArray(value) ? styles.logViewListItem : ""}>
            <h1>{label}</h1>
            {Array.isArray(value) ? (
              <>
                {value?.map((item, index) => (
                  <div className={styles.logViewContent} key={index}>
                    <Row gutter={24} className={styles.logViewContentRow}>
                      {item?.slice(0, 3)?.map(({ label: childLabel, value: childValue }, index) => (
                        <Col span={index === 1 ? 6 : 9} key={childLabel}>
                          <h1>{childLabel}</h1>
                          <span className="truncate" title={childValue}>
                            {childValue}
                          </span>
                        </Col>
                      ))}
                    </Row>
                    {item?.slice(3)?.map(({ label: childLabel, value: childValue }) => (
                      <div className={styles.logViewContentItem} key={childLabel}>
                        <h1>{childLabel}</h1>
                        {childValue}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <p>{value}</p>
            )}
          </li>
        ))}
      </ul>
    </Drawer>
  )
}

export default ViewDrawer
