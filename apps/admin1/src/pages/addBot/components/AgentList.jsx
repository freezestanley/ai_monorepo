import { useState, useCallback } from "react"
import {
  Modal,
  Card,
  Button,
  Switch,
  Typography,
  Row,
  Col,
  message,
  Spin,
  Space,
  Input,
  Empty
} from "antd"
import { PlusOutlined } from "@ant-design/icons"
const { Text } = Typography
import "./SkillList.scss"
import Tooltip from "antd/lib/tooltip"
import { useNavigate } from "react-router-dom"
import { useDeleteAgent, useFetchAgentListByPage, useUpdateAgent } from "@/api/agent"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import DeleteModal from "@/components/DeleteModal/DeleteModal"
import { cancelBubble } from "@/utils"
import Iconfont from "@/components/Icon"
import { debounce } from "lodash"
import AgentModal from "@/components/AgentModal"

// Mock 数据
const AgentList = ({ currentBotNo, iframeStyle = false }) => {
  const [currentItem, setCurrentItem] = useState({ agentName: "", agentNo: "" })
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [agentModalVisible, setAgentModalVisible] = useState(false)
  const [currentAgent, setCurrentAgent] = useState({})
  const [filterValue, setFilterValue] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const onCompositionStart = useCallback(() => setIsComposing(true), [])
  const onCompositionEnd = useCallback(() => {
    setIsComposing(false)
  }, [])

  const { mutate: delAgent } = useDeleteAgent()

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate: updateAgent } = useUpdateAgent()

  const { data: agentList = [], isLoading } = useFetchAgentListByPage({
    botNo: currentBotNo,
    pageSize: 100,
    pageNum: 1
  })

  const handleEditAgent = (agent) => {
    console.log(agent)
    navigate(
      `/agent/workbench?agentNo=${agent.agentNo}&agentName=${agent.agentName}&botNo=${currentBotNo}&isIframe=${iframeStyle}`
    )
  }

  const handleSetCurrentAgent = (e, agent) => {
    cancelBubble(e)
    setCurrentAgent(agent)
    setAgentModalVisible(true)
  }

  const handleDelete = (e, record) => {
    cancelBubble(e)
    setCurrentItem(record)
    setOpenDeleteModal(true)
  }
  const confirmCallback = useCallback(async () => {
    try {
      await delAgent({ agentNo: currentItem.agentNo, botNo: currentBotNo })
    } catch (error) {
      console.log(":===>>>  error:", error)
    }
  }, [currentItem])

  const AgentItem = ({ agent, index, key }) => {
    const [switchChecked, setSwitchChecked] = useState(agent.status === 1)
    const handleSwitchChange = (checked, agent, e) => {
      e.stopPropagation()
      const newStatus = checked ? 1 : 0
      const confirmContent =
        newStatus === 1
          ? "启用后，将在应用端展示该Agent，是否确认？"
          : "停用后，应用端将不再展示该Agent，是否确认？"

      Modal.confirm({
        title: "提示",
        content: confirmContent,
        onOk: () => {
          updateAgent(
            {
              botNo: currentBotNo,
              agentNo: agent.agentNo,
              status: newStatus
            },
            {
              onSuccess: (e) => {
                if (e.success) {
                  message.success(e.message)
                  setSwitchChecked(checked)
                  queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST_BY_PAGE])
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

    const deactivate = (agent.status === 1 || agent.status === 0) && !switchChecked

    return (
      <Col md={12} lg={8} xl={6} key={agent.agentNo}>
        <Card
          className={`card-item cursor-pointer ${deactivate && "deactivate"}`}
          style={{ marginBottom: "20px" }}
          onClick={() => handleEditAgent(agent)}
        >
          <div className="flex justify-between items-start mb-2" style={{ height: 33 }}>
            <div style={{ maxWidth: "84%" }}>
              <div className="title mr-2 skill-item-text">
                <Tooltip title={agent.agentName}>
                  <Text className="text-base">{agent.agentName}</Text>
                </Tooltip>
              </div>
              <Tooltip title={agent.description}>
                <Text className="desc">{agent.description}</Text>
              </Tooltip>
            </div>
            <Iconfont type="icon-biaodanjineng-1" className="skill-large-icon" />
          </div>
          <div className="mb-4 flex justify-between items-center absolute bottom-0 w-full">
            {agent.status === 1 || agent.status === 0 ? (
              <Switch
                checked={switchChecked}
                onChange={(checked, e) => handleSwitchChange(checked, agent, e)}
                defaultChecked={agent.status === 1}
              />
            ) : (
              <span
                className={`status ${
                  agent.status === 2 ? "debug" : agent.status === 0 ? "not" : undefined
                }`}
              >
                {agent.statusDisplayName}
              </span>
            )}

            <div className="remove-btn">
              <Button type="link" className="p-0" onClick={(e) => handleSetCurrentAgent(e, agent)}>
                设置
              </Button>
              <Button type="link" onClick={(e) => handleDelete(e, agent)}>
                删除
              </Button>
            </div>
          </div>
        </Card>
      </Col>
    )
  }

  const AgentSection = ({ title, agents }) => {
    if (agents.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
    const agentsList = agents.filter((agent) => {
      if (
        !isComposing &&
        !agent.agentName?.includes(filterValue) &&
        !agent.description?.includes(filterValue)
      )
        return false
      return true
    })

    return (
      <>
        <div className="tooltip-bar mt-8"></div>
        <Row gutter={[16, 16]} wrap={true}>
          {agentsList.map((agent, index) => {
            return <AgentItem agent={agent} index={index} key={agent.agentNo} />
          })}
          {agentsList.length === 0 && filterValue && `未搜索到匹配关键词 ${filterValue} 的Agent`}
        </Row>
      </>
    )
  }

  const onSearchChange = (e) => {
    const value = e.target.value?.trim()
    debounce((value) => {
      setFilterValue(value)
    }, 500)(value)
  }

  return (
    <div className="skill-list-wrapper-v2">
      <div className={`skill-list-wrapper ${iframeStyle && "iframeStyle"}`}>
        <Row className="header" style={{ marginBottom: 0 }} justify="space-between">
          <h1 className="font-bold text-lg">{iframeStyle && "Agents"}</h1>
        </Row>
        <Row className="mt-5 header" justify="space-between">
          <Col>
            <Input
              size="large"
              style={{ width: 400 }}
              placeholder="搜索Agent"
              className="search-input"
              onChange={onSearchChange}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
            />
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setAgentModalVisible(true)
                  setCurrentAgent({})
                }}
              >
                新增Agent
              </Button>
            </Space>
          </Col>
        </Row>

        <Spin spinning={isLoading} wrapperClassName="content">
          <AgentSection agents={agentList} />
        </Spin>
        <DeleteModal
          title="删除Agent可能导致应用端无法使用,是否确定删除"
          desc={
            <p>
              请输入Agent名称
              <b style={{ color: "red" }}>{currentItem.agentName} </b>以确认
            </p>
          }
          placeholder="请输入Agent名称"
          confirmText={currentItem.agentName}
          openDeleteModal={openDeleteModal}
          setOpenDeleteModal={setOpenDeleteModal}
          confirmCallback={confirmCallback}
        />

        <AgentModal
          onSuccess={() => {
            queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST_BY_PAGE])
          }}
          visible={agentModalVisible}
          agentNo={currentAgent?.agentNo}
          key={currentAgent?.agentNo}
          currentBotNo={currentBotNo}
          initialValues={{
            ...currentAgent,
            agentName: currentAgent?.agentName,
            description: currentAgent?.description,
            type: currentAgent?.type
          }}
          onClose={() => {
            setAgentModalVisible(false)
          }}
        />
      </div>
    </div>
  )
}

export default AgentList
