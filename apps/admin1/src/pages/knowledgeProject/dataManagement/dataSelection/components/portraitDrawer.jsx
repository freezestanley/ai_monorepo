import { Drawer, Row, Col, Spin, Alert } from "antd"
import { useFetchQueryPortraitCardInfoApi } from "@/api/dataManagement"
import styles from "../../index.module.scss"

const PortraitDrawer = ({ visiable, recordData, setVisiable }) => {
  const { data: portraitCardInfo, isLoading } = useFetchQueryPortraitCardInfoApi(recordData)

  return (
    <Drawer
      open={visiable}
      size="large"
      title="画像"
      onClose={() => setVisiable(false)}
      destroyOnClose
    >
      <div className={styles.portraitTime}>更新时间：{portraitCardInfo?.updateTime ?? "-"}</div>
      <Row className={styles.portraitRow} gutter={24}>
        <Col span={8}>
          <h1>总数</h1>
          <Spin spinning={isLoading}>{portraitCardInfo?.totalCount}</Spin>
        </Col>
        <Col span={8}>
          <h1>会话id</h1>
          <Spin spinning={isLoading}>{portraitCardInfo?.sessionCount}</Spin>
        </Col>
        <Col span={8}>
          <h1>客户数</h1>
          <Spin spinning={isLoading}>{portraitCardInfo?.customersCount}</Spin>
        </Col>
      </Row>
      {!portraitCardInfo && !isLoading && (
        <Alert
          message="提示"
          description="数据加工处理需要一些时间，请耐心等待，建议稍后再试！"
          type="warning"
          showIcon
          className="mt-10"
        />
      )}
    </Drawer>
  )
}

export default PortraitDrawer
