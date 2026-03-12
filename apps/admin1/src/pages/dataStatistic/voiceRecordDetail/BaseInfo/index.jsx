import { Col, Row } from "antd"
import { memo } from "react"
import "./index.less"

const BaseInfo = ({ baseInfoLists }) => {
  return (
    <div className={"baseInfoContainer"}>
      <div className={"baseInfoWrap"}>
        <Row gutter={24}>
          {baseInfoLists.map((data, key) => {
            return (
              <Col
                xl={baseInfoLists.length % 2 !== 0 && key === baseInfoLists.length - 1 ? 24 : 12}
                lg={24}
                key={data.code}
              >
                <div className={"baseInfoItem"}>
                  <div className={"baseInfoTitle"}>{data.name}：</div>
                  <div className={"baseInfoContent"}>{data.value}</div>
                </div>
              </Col>
            )
          })}
        </Row>
      </div>
    </div>
  )
}

export default memo(BaseInfo)
