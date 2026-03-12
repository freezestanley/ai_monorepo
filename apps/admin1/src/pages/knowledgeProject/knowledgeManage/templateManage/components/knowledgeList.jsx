import { useNavigate, useLocation } from "react-router-dom"
import queryString from "query-string"
import { Row, Col, Tag } from "antd"
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  SettingFilled,
  DeleteFilled,
  ClockCircleOutlined
} from "@ant-design/icons"
import Empty from "@/components/Empty"
import { cancelBubble } from "@/utils"
import styles from "../index.module.scss"

const KnowledgeList = ({ data, setDrawerData }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams

  return (
    <Row gutter={{ xs: 8, sm: 16, md: 16, lg: 16, xl: 24 }}>
      {data?.map((item) => (
        <Col xs={24} sm={12} lg={8} xl={6} key={item.id}>
          <div
            className={styles.knowledgeItem}
            onClick={() => navigate(`/templateDetail?templateId=${item.id}&botNo=${botNo}`)}
          >
            <div className={styles.knowledgeItemBtns} onClick={cancelBubble}>
              <SettingFilled onClick={() => setDrawerData({ visiable: true, recordData: item })} />
              <DeleteFilled style={{ cursor: "not-allowed" }} />
            </div>
            <h1>
              <span className="truncate max-w-40" title={item.templateName}>
                {item.templateName}
              </span>
              {/* <Tag
                icon={<CheckCircleFilled />}
                bordered={false}
                color="success"
              >
                LLM
              </Tag> */}
            </h1>
            <p>场景：{item.businessSceneName}</p>
            <div className={styles.knowledgeItemDesc} title={item.templateDescripe}>
              {item.templateDescripe}
            </div>
            <div className={styles.knowledgeItemFooter}>
              <div className={styles.tagBox}>
                {item.usingChannels?.map((item) => (
                  <Tag bordered={false} color={item === "人工" ? "warning" : "geekblue"} key={item}>
                    {item}
                  </Tag>
                ))}
              </div>
              <div className={styles.time}>
                <ClockCircleOutlined />
                {item.gmtModified}
              </div>
            </div>
          </div>
        </Col>
      ))}
      {data?.length === 0 && (
        <Col span={24}>
          <Empty />
        </Col>
      )}
    </Row>
  )
}

export default KnowledgeList
