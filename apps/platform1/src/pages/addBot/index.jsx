import { useEffect, useState } from "react"
import { Form, Modal, Tabs, Card, Button, Tooltip } from "antd"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import PersonalInfo from "@/pages/addBot/components/PersonalInfo"
// @ts-ignore
import "./index.scss"
import useBotForm from "./hooks/useBotForm"
import KnowledgeBase from "./components/ImageTextKnowledge"
import { TABS } from "@/constants"
import Skill from "./components/SkillList"
import { usePreviousLocation } from "@/router/PreviousLocationProvider"
import QuillEditor from "@/components/QuillEditor"
import { ExclamationCircleFilled, LeftOutlined } from "@ant-design/icons"
import { RESOURCE_CODE } from "@/constants/resourceCode"
import { useAuthResources } from "@/store"
import queryString from "query-string"
import KnowledgeBaseWrapper from "./components/KnowledgeBaseWrapper"
import { useFetchBotInfo } from "@/api/bot"
import AgentList from "./components/AgentList"

const { TabPane } = Tabs
const agentEnable = false

const AddBot = () => {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState(TABS.PERSONAL_INFO) // 新增状态，用于控制当前的活动Tab
  // 控制知识库的tab的显示与隐藏
  const [knowledgeBaseVisible, setKnowledgeBaseVisible] = useState(false)
  // 当前基本信息选中的知识库
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(null)
  // 当前选中的空间
  const [selectedSpace, setSelectedSpace] = useState(null)
  // 是否展示Skill
  const [currentBotNo, setCurrentBotNo] = useState(false)

  const [isModalVisible, setIsModalVisible] = useState(false)
  const navigate = useNavigate()
  const { prevLocation } = usePreviousLocation()
  const { isModified, setIsModified, selectedAvatar, handleAvatarSelect } = useBotForm({
    form
  })

  const { botNo } = useParams()
  const { data: botDetails = {}, isLoading: isLoadingBotDetails, refetch } = useFetchBotInfo(botNo)

  const resourceCodeList = useAuthResources((state) => state.resourceCodeList)
  const location = useLocation()
  const { search } = location
  const { active } = queryString.parse(search)

  const onCancel = () => {
    if (isModified) {
      Modal.confirm({
        title: "请确认您的修改是否已经保存",
        icon: <ExclamationCircleFilled />,
        content: "点击【确认】则返回空间列表页，点击【取消】则取消返回",
        onOk() {
          navigate("/admin/addBotList")
        },
        onCancel() {},
        afterClose: () => setIsModalVisible(false) // 当 Modal 关闭时，更新状态
      })
    } else {
      navigate("/admin/addBotList")
    }
  }

  useEffect(() => {
    if (prevLocation === "/editSkill" || prevLocation === "/botConstants") {
      setActiveTab(TABS.SKILL)
    }
    if (prevLocation === "/viewStructureKnowledgeDetail") {
      setActiveTab(TABS.KNOWLEDGE_BASE)
    }
    if (prevLocation === "/shouldBackToAgent") {
      setActiveTab(TABS.AGENT)
    }
  }, [prevLocation])

  useEffect(() => {
    if (active) {
      setActiveTab(active)
    }
  }, [active])

  useEffect(() => {
    if (botDetails) {
      const { knowledgeBaseNo, botNo } = botDetails
      setCurrentBotNo(botNo)
      if (knowledgeBaseNo) {
        setKnowledgeBaseVisible(true)
        setSelectedKnowledgeBase(knowledgeBaseNo)
      } else {
        setKnowledgeBaseVisible(false)
        setSelectedKnowledgeBase("")
      }
    }
  }, [botDetails])

  const switchTab = (key) => {
    // 清除右键弹窗
    const menu = document.getElementById("context-menu")
    if (menu) {
      document.body.removeChild(menu)
    }
    console.log(activeTab, key, isModified)
    if (key === TABS.PERSONAL_INFO && isModified) {
      // 只在从 "基本信息" 切换到 "知识库" 时进行检查
      // 如果表单被修改过，则提示用户
      Modal.confirm({
        title: "提示",
        content: "表单已被修改，你是否要保存修改?",
        onOk() {
          // 用户点击确定，调用 form 的 submit 方法，并切换到目标Tab
          form.submit()
          setActiveTab(key)
        },
        onCancel() {
          // 用户点击取消，保持当前Tab不变
          setActiveTab(activeTab)
        }
      })
    } else {
      // 如果表单没有被修改，或者不是从 "基本信息" 切换到 "知识库"，直接切换
      setActiveTab(key)
    }
  }

  return (
    <div className="addBot-wrapper h-full">
      <Card
        bordered={false}
        style={{
          boxShadow: "none"
        }}
        headStyle={{ paddingLeft: 0 }}
        bodyStyle={{ paddingLeft: 0 }}
        title={
          <div>
            <Tooltip title="返回列表">
              <Button type="link" onClick={onCancel}>
                <LeftOutlined />
              </Button>
            </Tooltip>
            {botDetails?.botName ? (
              <span>{`空间名称：【${botDetails?.botName}】`}</span>
            ) : (
              <span>新建空间</span>
            )}
          </div>
        }
      >
        <Tabs
          className="addbot-tabs"
          defaultActiveKey={TABS.PERSONAL_INFO}
          activeKey={activeTab}
          onTabClick={switchTab}
        >
          {resourceCodeList.includes(RESOURCE_CODE.BTN_BOT_BASE_EDIT) && (
            <TabPane tab="基本信息" key={TABS.PERSONAL_INFO} className="personal-info-wrapper">
              <PersonalInfo
                isLoadingBotDetails={isLoadingBotDetails}
                botDetails={botDetails}
                refetchBotDetails={refetch}
                setIsModalVisible={setIsModalVisible}
                setCurrentBotNo={setCurrentBotNo}
                setSelectedKnowledgeBase={setSelectedKnowledgeBase}
                setSelectedSpace={setSelectedSpace}
                setKnowledgeBaseVisible={setKnowledgeBaseVisible}
                setIsModified={setIsModified}
                form={form}
                handleAvatarSelect={handleAvatarSelect}
                selectedAvatar={selectedAvatar}
                onCancel={onCancel}
              />
            </TabPane>
          )}
          {/* {resourceCodeList.includes(RESOURCE_CODE.BTN_SKILL_EDIT) && currentBotNo && (
            <>
              <TabPane tab="工作流" key={TABS.SKILL}>
                <Skill currentBotNo={currentBotNo} />
              </TabPane>
              {agentEnable && (
                <TabPane tab="Agent" key={TABS.AGENT}>
                  <AgentList currentBotNo={currentBotNo} />
                </TabPane>
              )}
            </>
          )}

          {resourceCodeList.includes(RESOURCE_CODE.BTN_KNOW_EDIT) && knowledgeBaseVisible && (
            <TabPane tab="知识库" key={TABS.KNOWLEDGE_BASE}>
              <KnowledgeBaseWrapper selectedKnowledgeBase={selectedKnowledgeBase} />
            </TabPane>
          )} */}
        </Tabs>
      </Card>
    </div>
  )
}

export default AddBot
