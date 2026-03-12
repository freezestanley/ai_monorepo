import { Col, Row } from "antd"
import styles from "./index.module.scss"

const Skeleton = () => {
  const list = new Array(8).fill(1).map((v, i) => `${2 * i}`)

  return (
    <Row gutter={[32, 32]}>
      {list.map((v, i) => (
        <Col xs={24} md={12} lg={8} key={i}>
          <div className={styles["item"]}></div>
        </Col>
      ))}
    </Row>
  )
}

export default Skeleton
