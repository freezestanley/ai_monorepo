import { useEffect, useState } from "react"
import { Button, Row, Col, Tooltip, Popconfirm } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import "./index.less"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import SelectRobotModal from "@/components/SelectRobotModal"
import { useFetchBotListByPage } from "@/api/bot"
import { useSubscribeApi, useCancelSubscribeApi } from "@/api/market"
import { postMessageForLX } from "@/utils"
import { MessageType } from "@/constants/postMessageType"
import { message } from "antd"

const SKILL_TYPES_MAP = {
  1: "快速问答",
  2: "表单类型",
  3: "API类型"
}

const SubscribeSkillInfo = (props) => {
  const { currentSkillInfo = {} } = props
  const queryParams = queryString.parse(useLocation().search)
  const [isSubscribed, setIsSubscribed] = useState(queryParams.hasSubscribed !== "false")
  const marketSub = queryParams.marketSub === "true"
  const botNoiframe = queryParams.botNoiframe
  const skillCanRead = queryParams.skillCanRead !== "false"
  const detailNotAvailable = !skillCanRead
  const navigate = useNavigate()
  const [isRobotModalVisible, setIsRobotModalVisible] = useState(false)
  const [currentSelectedRobotId, setCurrentSelectedRobotId] = useState(null)

  const { data: robotListData, isLoading: robotListLoading } = useFetchBotListByPage({
    pageNum: 1,
    pageSize: 10000
  })

  const { mutate: mutateSubscribe } = useSubscribeApi(() => {
    // 订阅成功后的回调
    setIsSubscribed(true)
    postMessageForLX({
      type: MessageType.SUBSCRIBE_SUCCESS,
      // 如果是市场订阅，使用选择的空间ID；否则使用 botNoiframe
      botNo: marketSub ? currentSelectedRobotId : botNoiframe
    })
  })

  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(() => {
    // 取消订阅成功后的回调
    setIsSubscribed(false)
    postMessageForLX({
      type: MessageType.SUBSCRIBE_SUCCESS,
      botNo: botNoiframe
    })
  })

  const handleBack = () => {
    const { isIframe } = queryParams
    if (isIframe === "true") {
      window.history.back()
    } else {
      navigate(`/addbot/${botNoiframe}`)
    }
  }

  const handleSubscribe = () => {
    if (marketSub && !isSubscribed) {
      setIsRobotModalVisible(true)
    } else if (!isSubscribed) {
      // 使用 URL 上的 botNoiframe 进行订阅
      if (!botNoiframe) {
        message.warning("未获取到空间信息，请重试")
        return
      }
      mutateSubscribe({
        bizType: "SKILL",
        bizNo: currentSkillInfo.skillNo,
        botNo: botNoiframe
      })
    }
  }

  const handleCancelSubscribe = () => {
    if (!botNoiframe) {
      message.warning("未获取到空间信息，请重试")
      return
    }
    mutateCancelSubscribe({
      bizType: "SKILL",
      bizNo: currentSkillInfo.skillNo,
      botNo: botNoiframe
    })
  }

  const handleRobotSelect = (selectedRobotId) => {
    setCurrentSelectedRobotId(selectedRobotId)
    mutateSubscribe({
      bizType: "SKILL",
      bizNo: currentSkillInfo.skillNo,
      botNo: selectedRobotId
    })
    setIsRobotModalVisible(false)
  }

  return (
    <div className="subscribe-skill-info">
      <ArrowLeftOutlined className="back-btn" onClick={handleBack} />
      <Row className="base-info" gutter={14}>
        <Col span={9}>
          <Tooltip title={currentSkillInfo.skillName}>
            <div className="title">{currentSkillInfo.skillName}</div>
          </Tooltip>
          <div className="field-item">{currentSkillInfo.description}</div>
        </Col>
        <Col className="" span={6}>
          <div className="field-item">来源：{currentSkillInfo.botName}</div>
          <div className="field-item">类型：{SKILL_TYPES_MAP[currentSkillInfo.type]}</div>
        </Col>
        <Col className="" span={6}>
          <div className="field-item">最近更新时间：{currentSkillInfo.gmtModified}</div>
          <div className="field-item">版本名称：{currentSkillInfo.currentSkillVersionName}</div>
        </Col>
        <Col className="" span={3}>
          {isSubscribed && !marketSub ? (
            <Popconfirm
              title="温馨提醒"
              description="【取消订阅】将无法调用对应工作流。"
              okText="确认"
              cancelText="取消"
              onConfirm={handleCancelSubscribe}
            >
              <Button size="small" type="primary" disabled={detailNotAvailable}>
                已订阅
              </Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              type={isSubscribed ? "primary" : "default"}
              onClick={handleSubscribe}
              disabled={detailNotAvailable}
            >
              {isSubscribed ? "已订阅" : "未订阅"}
            </Button>
          )}
        </Col>
      </Row>

      <SelectRobotModal
        open={isRobotModalVisible}
        onOk={handleRobotSelect}
        onCancel={() => setIsRobotModalVisible(false)}
        robotList={robotListData?.botList || []}
        robotListLoading={robotListLoading}
      />
    </div>
  )
}

export default SubscribeSkillInfo
