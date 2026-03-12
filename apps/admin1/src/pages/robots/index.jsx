import Iconfont from "@/components/Icon"
import { LinkOutlined, AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons"
import CopyToClipboard from "react-copy-to-clipboard"
import { newAvatarList } from "@/assets/imgUrl"
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  Divider,
  Input,
  Modal,
  Popconfirm,
  Row,
  Switch,
  Table,
  Tooltip,
  Typography,
  message
} from "antd"
import { useMemo, useState } from "react"
// import "./../addBot/components/SkillList.scss"
import "./skillList.scss"

import { cancelBubble, postMessageForLX } from "@/utils"
import CardSettingModal from "./cardSettingModal"
import { useRobotsList, useUpdateRobotStatus, useUpdateRobotUsingSetting } from "@/api/robots"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import UsingSetting from "./usingSetting"
import { ROBOT_TYPE_MINE, ROBOT_TYPE_SUBSCRIBE } from "./constants"
import { useCancelSubscribeApi, useMarketHomeListApi } from "@/api/market"
import { debounce } from "lodash"
import { useFetchSubscribeSkillListByPage } from "@/api/skill"
import { useFetchApplicationList } from "@/api/application"
import { getThemeConfig, marketCode } from "@/constants/market"
import { MarketProvider } from "../market"
import { MessageType } from "@/constants/postMessageType"
import aiLabIconUrl from "@/assets/img/aiLabIcon.png"

import toolImg from "@/assets/img/tool.png"
import agentAvaterImg from "@/assets/img/agentAvater-new.png?url"
import agentAvaterOLdImg from "@/assets/img/agentAvater.png"
import skillAvater from "@/assets/img/skillAvater.png"
import application from "@/assets/img/application.png"

const SKILLICONTYPE = {
  AGENT: agentAvaterImg,
  SKILL: skillAvater,
  PLUG_IN: toolImg,
  ROBOT: application
}

const { Text } = Typography

function Robots() {
  const [searchText, setSearchText] = useState("")
  const [viewMode, setViewMode] = useState("card") // 'card' | 'list'
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo } = queryParams
  const { data: robotList = [] } = useRobotsList({ botNo, searchText })
  const { data: subscribeData, isLoading: subscribeRobotListLoading = false } =
    useFetchSubscribeSkillListByPage({
      pageNum: 1,
      pageSize: 100,
      botNo,
      bizType: "ROBOT",
      query: searchText
    })
  const { data: applicationData } = useFetchApplicationList({
    pageNum: 1,
    pageSize: 100,
    keyword: searchText
  })

  const subscribeRobotList = useMemo(() => {
    return subscribeData?.list || []
  }, [subscribeData])
  const debounceSetSearch = debounce((value) => {
    setSearchText(value)
  }, 800)

  const dividerStyle = {
    fontSize: "18px",
    fontWeight: "900",
    margin: "40px 0",
    letterSpacing: "10px"
  }

  // 创建共享的状态管理和操作处理
  const { mutate: updateRobotStatus } = useUpdateRobotStatus()
  const { mutate: updateRobotUsingSetting } = useUpdateRobotUsingSetting()
  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(() => {
    queryClient.invalidateQueries([QUERY_KEYS.ROBOT_LIST])
    queryClient.invalidateQueries([QUERY_KEYS.SUBSCRIBE_SKILL_LIST_BY_PAGE])
    postMessageForLX({
      type: MessageType.REFRESH_APP_ROBOT_LIST
    })
  })
  const queryClient = useQueryClient()

  // 处理开关状态变化
  const handleTableSwitchChange = (checked, robot) => {
    const newStatus = checked ? "1" : "0"
    const confirmContent =
      newStatus === "1"
        ? "启用后，将在应用端展示该应用，是否确认？"
        : "停用后，应用端将不再展示该应用，是否确认？"

    Modal.confirm({
      title: "提示",
      content: confirmContent,
      onOk: () => {
        updateRobotStatus(
          {
            botNo,
            robotNo: robot.robotNo || robot.bizNo,
            status: newStatus
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success(e.message)
                queryClient.invalidateQueries([QUERY_KEYS.ROBOT_LIST])
                postMessageForLX({
                  type: MessageType.REFRESH_APP_ROBOT_LIST
                })
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  // 处理使用设置
  const handleTableUsingSetting = (robot) => {
    // 这里需要实现使用设置的逻辑
    console.log("使用设置:", robot)
  }

  // 处理取消订阅
  const handleTableCancelSubscribe = (robot) => {
    Modal.confirm({
      title: "确认取消订阅",
      content: "【取消订阅】后，将无法调用对应应用",
      onOk: () => {
        mutateCancelSubscribe({
          botNo,
          bizType: "ROBOT",
          bizNo: robot.robotNo || robot.bizNo
        })
      }
    })
  }

  // 处理设置
  const handleTableSetting = (robot) => {
    // 这里需要实现设置的逻辑
    console.log("设置:", robot)
  }

  // 表格列配置
  const getTableColumns = (type) => [
    {
      title: "应用信息",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (name, record) => (
        <div className="flex items-center">
          <div className="flex items-center justify-center w-[40px] h-[40px] rounded-[6px] overflow-hidden mr-3">
            <img
              src={
                record.isPublic
                  ? record.iconUrl || aiLabIconUrl
                  : ["AGENT"].includes(record.bizType) && record.iconUrl
                    ? record.iconUrl.includes("/agentAvater") &&
                      !record.iconUrl.includes("/agentAvater-new")
                      ? agentAvaterOLdImg
                      : record.iconUrl
                    : SKILLICONTYPE[record.bizType] || SKILLICONTYPE["SKILL"]
              }
              className="text-base-img max-w-[40px] max-h-[40px]"
              style={
                record.iconUrl?.includes("/agentAvater") &&
                !record.iconUrl?.includes("/agentAvater-new")
                  ? { width: "24px" }
                  : {}
              }
            />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{name ?? "暂无"}</div>
            <div className="text-gray-500 text-xs">{record.bizNo}</div>
          </div>
        </div>
      )
    },
    {
      title: "描述",
      dataIndex: "robotDesc",
      key: "desc",
      render: (desc) => (
        <Tooltip title={desc}>
          <div className="text-sm text-gray-600 truncate max-w-[200px]">
            {desc || "这个人很懒，暂未填写描述～"}
          </div>
        </Tooltip>
      )
    },
    {
      title: "来源",
      dataIndex: "belongToBotName",
      key: "source",
      width: 120,
      render: (source) => <span className="text-sm">{source}</span>
    },
    {
      title: "订阅量",
      dataIndex: "subscribeCount",
      key: "subscribeCount",
      width: 80,
      render: (count) => (count > 0 ? count : "-")
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status, record) => {
        if (type === ROBOT_TYPE_SUBSCRIBE) {
          const using = status === true || status === "1" || status === 1
          return (
            <span
              className={`px-2 py-1 rounded text-xs ${using ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}
            >
              {using ? "启用中" : "已停用"}
            </span>
          )
        } else if (type === ROBOT_TYPE_MINE) {
          return (
            <Switch
              size="small"
              checked={status === "1"}
              onChange={(checked, e) => {
                e.stopPropagation()
                handleTableSwitchChange(checked, record)
              }}
            />
          )
        } else {
          return (
            <span
              className={`px-2 py-1 rounded text-xs ${
                status === "2"
                  ? "bg-blue-100 text-blue-600"
                  : status === "0"
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
              }`}
            >
              {record.statusDisplayName}
            </span>
          )
        }
      }
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => {
        if (record.isPublic) {
          return (
            <div className="flex gap-2">
              {!!record.websiteUrl && (
                <Button
                  type="link"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(record.websiteUrl, "_blank")
                  }}
                >
                  官网
                </Button>
              )}
              {!!record.deploymentUrl && (
                <Button
                  type="link"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(record.deploymentUrl, "_blank")
                  }}
                >
                  使用
                </Button>
              )}
            </div>
          )
        } else {
          return (
            <div className="flex gap-2">
              {type === ROBOT_TYPE_SUBSCRIBE && record.isSubscribed ? (
                <>
                  <Button
                    type="link"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTableUsingSetting(record)
                    }}
                  >
                    使用设置
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTableCancelSubscribe(record)
                    }}
                  >
                    取消订阅
                  </Button>
                </>
              ) : (
                <Button
                  type="link"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTableSetting(record)
                  }}
                >
                  设置
                </Button>
              )}
            </div>
          )
        }
      }
    }
  ]

  // 渲染卡片视图
  const renderCardView = (data, type) => (
    <Row gutter={16}>
      {data.map((item) => {
        if (type === ROBOT_TYPE_MINE) {
          return <RobotItem robot={item} key={item.botNo} botNo={botNo} type={type} />
        } else if (type === ROBOT_TYPE_SUBSCRIBE && !item.isPublic) {
          return <RobotItem robot={item} key={item.botNo} botNo={botNo} type={type} />
        } else {
          // 公共应用
          return (
            <RobotItem
              robot={{
                ...item,
                name: item.appName || item.name,
                robotDesc: item.appDesc || item.robotDesc,
                bizNo: item.appNo || item.bizNo,
                iconUrl: item.icon?.iconURL || item.iconUrl
              }}
              key={item.appNo || item.botNo}
              botNo={botNo}
              isPublic={true}
              type={type}
            />
          )
        }
      })}
    </Row>
  )

  // 渲染列表视图
  const renderListView = (data, type) => {
    const processedData = data.map((item, index) => ({
      ...item,
      key: item.botNo || item.appNo || index,
      name: item.appName || item.name,
      robotDesc: item.appDesc || item.robotDesc,
      bizNo: item.appNo || item.bizNo,
      iconUrl: item.icon?.iconURL || item.iconUrl,
      isPublic: type === "public"
    }))

    return (
      <Table
        columns={getTableColumns(type)}
        dataSource={processedData}
        pagination={false}
        size="middle"
        onRow={(record) => ({
          onClick: () => {
            if (!record.isPublic) {
              postMessageForLX({
                type: MessageType.TO_APP_ROBOT_DETAIL_PAGE,
                payload: {
                  jumpUrl: record.jumpUrl,
                  workbenchNo: record.resourceCode
                }
              })
            }
          },
          style: { cursor: record.isPublic ? "default" : "pointer" }
        })}
      />
    )
  }

  return (
    <div className="admin-container skill-list-wrapper-old">
      <div className="admin-header" style={{ display: "block" }}>
        <div className="flex items-center justify-between w-full pb-4">
          <h2 className="flex items-center">AI Lab 管理</h2>
          <div className="flex items-center gap-2">
            <Button
              type={viewMode === "card" ? "primary" : "default"}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode("card")}
            >
              卡片视图
            </Button>
            <Button
              type={viewMode === "list" ? "primary" : "default"}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode("list")}
            >
              列表视图
            </Button>
          </div>
        </div>
        <Input
          onChange={(e) => debounceSetSearch(e.target.value)}
          placeholder="搜索应用名称/描述"
          style={{ width: "400px" }}
        />
      </div>
      <div className="admin-content skill-list-wrapper">
        <Divider style={dividerStyle}>我的应用</Divider>
        {viewMode === "card"
          ? renderCardView(robotList, ROBOT_TYPE_MINE)
          : renderListView(robotList, ROBOT_TYPE_MINE)}

        <Divider style={dividerStyle}>公共应用</Divider>
        {viewMode === "card"
          ? renderCardView(applicationData?.data || [], "public")
          : renderListView(applicationData?.data || [], "public")}

        <Divider style={dividerStyle}>订阅应用</Divider>
        {viewMode === "card"
          ? renderCardView(subscribeRobotList, ROBOT_TYPE_SUBSCRIBE)
          : renderListView(subscribeRobotList, ROBOT_TYPE_SUBSCRIBE)}
      </div>
    </div>
  )
}

const RobotItem = ({ robot, type = "", isPublic, botNo }) => {
  const {
    bizNo,
    iconUrl,
    name,
    robotDesc: desc,
    status,
    showInChatWnd,
    belongToBotName,
    statusDisplayName,
    subscribeCount,
    isSubscribed = true,
    jumpUrl,
    resourceCode,
    websiteUrl,
    deploymentUrl,
    bizType = "ROBOT"
  } = robot
  const robotNo = robot.robotNo || bizNo

  const [switchChecked, setSwitchChecked] = useState(status === "1")
  const [currentRobot, setCurrentRobot] = useState({})
  const [cardModalVisible, setCardModalVisible] = useState(false)
  const [usingSettingVisible, setUsingSettingVisible] = useState(false)

  const { mutate: updateRobotStatus } = useUpdateRobotStatus()
  const { mutate: updateRobotUsingSetting } = useUpdateRobotUsingSetting()
  const queryClient = useQueryClient()

  const { color, hover, border } = getThemeConfig(marketCode.ROBOT)
  const themConfig = {
    colorPrimary: color,
    defaultBorderColor: color,
    defaultColor: color,
    colorPrimaryHover: hover,
    colorPrimaryActive: hover
  }
  const theme = {
    components: {
      Switch: themConfig,
      Button: themConfig,
      Radio: themConfig
    }
  }

  const refreshAPPRobotList = () => {
    postMessageForLX({
      type: MessageType.REFRESH_APP_ROBOT_LIST
    })
  }

  const handleSwitchChange = (checked, robot, e) => {
    e.stopPropagation()
    const newStatus = checked ? "1" : "0"
    const confirmContent =
      newStatus === "1"
        ? "启用后，将在应用端展示该应用，是否确认？"
        : "停用后，应用端将不再展示该应用，是否确认？"

    Modal.confirm({
      title: "提示",
      content: confirmContent,
      onOk: () => {
        updateRobotStatus(
          {
            botNo,
            robotNo: robot.robotNo,
            status: newStatus
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success(e.message)
                setSwitchChecked(checked)
                refreshAPPRobotList()
                queryClient.invalidateQueries([QUERY_KEYS.ROBOT_LIST])
              } else {
                message.error(e.message)
              }
            }
          }
        )
      },
      onCancel: () => {
        // 如果用户点击取消，不做任何操作
      }
    })
  }

  const handleUsingSetting = (e, robot) => {
    cancelBubble(e)
    setCurrentRobot(robot)
    setUsingSettingVisible(true)
  }

  const handleSetCurrentRobot = (e, robot) => {
    cancelBubble(e)
    setCurrentRobot(robot)
    setCardModalVisible(true)
  }

  const onUsingSettingFinish = ({ showInChatWnd }) => {
    updateRobotUsingSetting(
      {
        botNo,
        robotNo,
        status: showInChatWnd
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success("更新成功")
            setUsingSettingVisible(false)
            querySubscribedRobots()
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const querySubscribedRobots = () => {
    queryClient.invalidateQueries([QUERY_KEYS.ROBOT_LIST])
    queryClient.invalidateQueries([QUERY_KEYS.SUBSCRIBE_SKILL_LIST_BY_PAGE])
    refreshAPPRobotList()
  }

  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(querySubscribedRobots)
  const onCancelSubscribe = async (e) => {
    cancelBubble(e)
    return mutateCancelSubscribe({
      botNo,
      bizType: "ROBOT",
      bizNo: robotNo
    })
  }

  const handleCardClick = () => {
    !isPublic &&
      postMessageForLX({
        type: MessageType.TO_APP_ROBOT_DETAIL_PAGE,
        payload: {
          jumpUrl,
          workbenchNo: resourceCode
        }
      })
  }
  const linkButtonStyle = { color }
  const deactivate = (status === 1 || status === 0) && !switchChecked
  const using = status === true || status === "1" || status === 1
  const icon = iconUrl || (isPublic && aiLabIconUrl)
  return (
    <Col md={12} lg={8} xl={6} key={name}>
      <ConfigProvider theme={theme}>
        <div
          className={`card-item card-item-${bizType} ${!isPublic && "cursor-pointer"}`}
          style={{ marginBottom: "20px", ...(isPublic ? { height: "175px" } : {}) }}
          onClick={handleCardClick}
        >
          <div className="flex justify-between items-start w-[100%]">
            <div className="flex-1 overflow-hidden">
              <div className="title-wrapper">
                <div
                  className={`card-icon mr-[12px] flex items-center justify-center w-[48px] h-[48px] rounded-[8px] overflow-hidden`}
                >
                  <img
                    style={
                      icon?.includes("/agentAvater") && !iconUrl?.includes("/agentAvater-new")
                        ? { width: "30px" }
                        : {}
                    }
                    src={
                      isPublic
                        ? icon
                        : ["AGENT"].includes(bizType) && icon
                          ? icon.includes("/agentAvater") && !icon.includes("/agentAvater-new")
                            ? agentAvaterOLdImg
                            : icon
                          : SKILLICONTYPE[bizType] || SKILLICONTYPE["SKILL"]
                    }
                    className="text-base-img"
                  />
                </div>
                <div className="flex flex-1 flex-col items-start overflow-hidden">
                  <Tooltip title={name}>
                    <span className="text-base">{name ?? "暂无"}</span>
                  </Tooltip>
                  <CopyToClipboard text={bizNo} onCopy={() => message.success("复制成功")}>
                    <Tooltip title="点击复制编号">
                      <span
                        className="text-[#626263] cursor-pointer leading-[18px] text-[12px] mt-[8px]"
                        onClick={(e) => cancelBubble(e)}
                      >
                        {bizNo}
                      </span>
                    </Tooltip>
                  </CopyToClipboard>
                </div>
              </div>
              {!isPublic && (
                <div className="skill-item-text">
                  <div className="time-tag">
                    <span className="title">来源</span>
                    <span className="time">{belongToBotName}</span>
                  </div>
                  {subscribeCount > 0 && (
                    <div className="time-tag">
                      <span className="title">订阅量</span>
                      <span className="time">{subscribeCount}</span>
                    </div>
                  )}
                </div>
              )}
              <Tooltip title={desc}>
                <div className="desc">{desc || "这个人很懒，暂未填写描述～"}</div>
              </Tooltip>
            </div>
            <div>
              {type === ROBOT_TYPE_SUBSCRIBE ? (
                // 兼容订阅工作流的显示
                <span className={`subscribe-status ${using && "using"}`}>
                  {using ? "启用中" : "已停用"}
                </span>
              ) : type === ROBOT_TYPE_MINE ? (
                <Switch
                  checked={switchChecked}
                  onChange={(checked, e) => handleSwitchChange(checked, robot, e)}
                  defaultChecked={false}
                />
              ) : (
                <span
                  className={`status ${status === "2" ? "debug" : status === "0" ? "not" : undefined}`}
                >
                  {statusDisplayName}
                </span>
              )}
            </div>
          </div>
          <div
            className="remove-btn"
            style={
              isPublic && ((websiteUrl && !deploymentUrl) || (!websiteUrl && deploymentUrl))
                ? { justifyContent: "center" }
                : {}
            }
          >
            {isPublic ? (
              <>
                {!!websiteUrl && (
                  <Button
                    type="link"
                    className="p-0"
                    onClick={(e) => {
                      cancelBubble(e)
                      window.open(websiteUrl, "_blank")
                    }}
                  >
                    <LinkOutlined className="align-middle" />
                    官网
                  </Button>
                )}
                {!!deploymentUrl && (
                  <Button
                    type="link"
                    className="p-0"
                    onClick={(e) => {
                      cancelBubble(e)
                      window.open(deploymentUrl, "_blank")
                    }}
                  >
                    <LinkOutlined className="align-middle" />
                    使用
                  </Button>
                )}
              </>
            ) : (
              <>
                {type === ROBOT_TYPE_SUBSCRIBE && isSubscribed ? (
                  // 订阅工作流
                  <>
                    <Button
                      type="link"
                      className="p-0"
                      // style={linkButtonStyle}
                      onClick={(e) => handleUsingSetting(e, robot)}
                    >
                      <i className="iconfont icon-shezhi align-middle -mt-[1px] mr-[3px]"></i>
                      使用设置
                    </Button>
                    <Popconfirm
                      title=""
                      description="【取消订阅】后，将无法调用对应应用"
                      onConfirm={(e) => onCancelSubscribe(e)}
                      onPopupClick={(e) => cancelBubble(e)}
                    >
                      <Button type="link" className="p-0" onClick={(e) => cancelBubble(e)}>
                        <i className="iconfont icon-dingyue align-middle -mt-[1px] mr-[3px] text-[#F6B51E]"></i>
                        取消订阅
                      </Button>
                    </Popconfirm>
                  </>
                ) : (
                  <div className="text-center w-100">
                    <Button
                      type="link"
                      className="p-0"
                      onClick={(e) => handleSetCurrentRobot(e, robot)}
                    >
                      <i className="iconfont icon-shezhi align-middle -mt-[1px] mr-[3px]"></i>
                      设置
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <CardSettingModal
          onSuccess={() => {}}
          visible={cardModalVisible}
          key={currentRobot?.robotNo}
          robotNo={currentRobot?.robotNo}
          botNo={currentRobot?.botNo}
          initialValues={{
            ...currentRobot
          }}
          onClose={() => {
            setCardModalVisible(false)
          }}
        />
        <UsingSetting
          visible={usingSettingVisible}
          onClose={() => setUsingSettingVisible(false)}
          initialValues={{ showInChatWnd }}
          onFinish={onUsingSettingFinish}
        />
      </ConfigProvider>
    </Col>
  )
}

export default Robots
