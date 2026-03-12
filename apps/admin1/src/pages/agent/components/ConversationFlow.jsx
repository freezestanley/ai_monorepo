import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Button,
  Typography,
  message,
  Input,
  Modal,
  Tabs,
  Checkbox,
  Avatar,
  Tooltip,
  Select,
  Spin,
  Card,
  Tag
} from "antd"
import { PlusOutlined, DeleteOutlined, CheckOutlined } from "@ant-design/icons"
import { useFetchSkillListByPage, useFetchSubscribeSkillListByPage } from "@/api/skill"
import { fetchSourceTag } from "@/api/sourceTag/api"
import { getVoiceAgentList, updateAgentMapping } from "@/api/voiceAgent/api"
import GlobalConstantTableModal from "./GlobalConstantTableModal"
import { fetchAgentConstantList } from "@/api/agent/api"
import { useNavigate } from "react-router-dom"
import SkillRelationDrawer from "./SkillRelationDrawer"
import { fetchAgentSkillRelationList } from "@/api/agent/api"
import copy from "copy-to-clipboard"

// @ts-ignore
import type1 from "../../../assets/img/type1.png"
// @ts-ignore
import type2 from "../../../assets/img/type2.png"
// @ts-ignore
import type3 from "../../../assets/img/type3.png"

// 工作流图标类型映射
const SKILLICONTYPE = {
  1: type3, // 快速问答
  2: type2, // 表单类型
  3: type1, // API类型
  4: type3 // 默认类型
}

const { Text } = Typography
const { TextArea } = Input

// 工具项组件
const ToolItem = ({
  item,
  idKey = "id",
  avatarBgColor = "#7F56D9",
  checked,
  onCheckChange,
  showCheckbox
}) => {
  // 获取类型：我的工作流使用type字段，已订阅使用skillType字段
  const skillTypeValue = item.type === "sub" ? item.skillType : Number(item.type)

  return (
    <div
      className={`flex items-center gap-[5px] bg-[#F9FAFB] rounded-[8px] p-[12px] w-full ${onCheckChange ? "cursor-pointer" : ""}`}
      onClick={() => {
        if (onCheckChange) {
          onCheckChange(!checked, item[idKey])
        }
      }}
    >
      {showCheckbox && (
        <div className="flex-shrink-0 w-[16px] h-[16px] flex items-center justify-center">
          {checked ? (
            <div className="w-[16px] h-[16px] flex items-center justify-center bg-[#7f56d9] rounded-[4px]">
              <CheckOutlined className="text-white" />
            </div>
          ) : (
            <div className="w-[16px] h-[16px] flex items-center justify-center border border-gray-400 rounded-[4px]">
              {/* <CheckOutlined className="text-white opacity-60" /> */}
            </div>
          )}
        </div>
      )}
      {/* 兼容原有单选模式 */}
      {!showCheckbox && onCheckChange && checked && (
        <div className="flex-shrink-0 w-[16px]">
          <div className="w-[16px] h-[16px] flex items-center justify-center bg-green-500 rounded-[4px]">
            <CheckOutlined className="text-white" />
          </div>
        </div>
      )}
      <Avatar
        src={
          SKILLICONTYPE[item.type === "sub" ? item.skillType : Number(item.type)] ||
          SKILLICONTYPE[4]
        }
        shape="square"
        size={40}
        className="flex-shrink-0"
        style={{ padding: "5px" }}
      >
        {item.name?.slice(0, 1)}
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-[6px]">
          {item.type === "sub" && (
            <span className="text-[10px] inline-block text-[#f66a3f] bg-[#FFF4ED] rounded-[4px]">
              订阅
            </span>
          )}
          <Tooltip title={item.name}>
            <div className="text-[14px] text-[#181B25] font-[500] truncate w-[300px]">
              {item.name}
            </div>
          </Tooltip>
        </div>
        <Tooltip title={item.description}>
          <div className="text-[12px] text-[#475467] truncate w-[180px]">{item.description}</div>
        </Tooltip>
      </div>
    </div>
  )
}

/**
 * ConversationFlow component for managing a single conversation flow in workflow mode
 *
 * @param {Object} props - Component props
 * @param {Function} props.onAddFlow - Callback when flow content is added/updated
 * @param {String} props.flowContent - Current flow content
 * @param {String} props.botNo - Bot number for API calls
 * @returns {JSX.Element} - Rendered component
 */
const ConversationFlow = ({
  onAddFlow,
  initSelectedSkill,
  flowContent = "",
  botNo,
  agentDetail,
  agentMode,
  originalAgentNo,
  isOnlyRead,
  studioenv,
  isNeedExecuteDefaultAgent
}) => {
  const navigate = useNavigate()
  const [isSkillModalVisible, setIsSkillModalVisible] = useState(false)
  const [isVoiceTemplateModalVisible, setIsVoiceTemplateModalVisible] = useState(false)
  const [voiceTemplates, setVoiceTemplates] = useState([])
  const [voiceTemplateLoading, setVoiceTemplateLoading] = useState(false)
  const [voiceTemplateSearchKey, setVoiceTemplateSearchKey] = useState("")
  const [isVoiceTemplateComposing, setIsVoiceTemplateComposing] = useState(false)
  const [selectedVoiceTemplate, setSelectedVoiceTemplate] = useState(null)

  // 1. 新增 selectedSkills 状态，兼容原有 selectedSkill
  const [selectedSkills, setSelectedSkills] = useState([])
  const [selectedSkill, setSelectedSkill] = useState(null) // 仅语音/其它模式用
  const [skillTabValue, setSkillTabValue] = useState("1")
  const [skillSearchKey, setSkillSearchKey] = useState("")
  const [isSkillComposing, setIsSkillComposing] = useState(false)
  const [skillFilterValue, setSkillFilterValue] = useState("全部")
  const [skillGroupList, setSkillGroupList] = useState([])

  // 新增临时多选状态 tempSelectedSkills
  const [tempSelectedSkills, setTempSelectedSkills] = useState([])

  // 用于跟踪语音模板是否已经初始化过，避免用户重新选择后被覆盖
  const hasVoiceTemplateInitialized = useRef(false)

  // 全局常量弹窗相关状态
  const [constantModalOpen, setConstantModalOpen] = useState(false)
  const [constantTableLoading, setConstantTableLoading] = useState(false)
  const [constantTableData, setConstantTableData] = useState([])
  const [constantTablePageNum, setConstantTablePageNum] = useState(1)
  const [constantTablePageSize, setConstantTablePageSize] = useState(10)
  const [constantTableTotal, setConstantTableTotal] = useState(0)
  const [constantTableQuery, setConstantTableQuery] = useState("")

  // 工作流关系抽屉相关状态
  const [skillRelationDrawerOpen, setSkillRelationDrawerOpen] = useState(false)
  const [skillRelationList, setSkillRelationList] = useState([])
  const [skillRelationLoading, setSkillRelationLoading] = useState(false)

  // API hooks for skills
  const {
    data: skillData = {},
    isLoading: skillsLoading,
    refetch: fetchSkills
  } = useFetchSkillListByPage({
    disabledInit: true,
    botNo,
    agentNo: agentDetail?.agentNo,
    pageSize: 500,
    pageNum: 1,
    orderField: "gmt_modified",
    asc: false,
    manual: true
  })

  const {
    data: subscribedSkillData = {},
    isLoading: subscribedSkillLoading,
    refetch: fetchSubSkills
  } = useFetchSubscribeSkillListByPage({
    disabledInit: true,
    botNo,
    bizType: "SKILL",
    pageSize: 100,
    pageNum: 1,
    manual: true,
    agentNo: agentDetail?.agentNo
  })

  const availableSkills = useMemo(
    () => ({
      selfSkills:
        skillData.skillList ||
        [].map((item) => ({
          ...item,
          category: item.type
        })),
      subscribedSkills: (subscribedSkillData.list || []).map((item) => ({
        ...item,
        skillName: item.name,
        skillNo: item.bizNo,
        type: "sub",
        category: item.skillType
      }))
    }),
    [skillData, JSON.stringify(subscribedSkillData || {})]
  )

  // 初始化时，如果有flowContent或agentDetail.workSkillNo，尝试从中提取工作流
  useEffect(() => {
    // 工作流多选
    if (agentMode == 1 && agentDetail?.workSkillNos && Array.isArray(agentDetail.workSkillNos)) {
      // 回显多选
      const skillNos = agentDetail.workSkillNos
      const allSkills = [
        ...(availableSkills.selfSkills || []),
        ...(availableSkills.subscribedSkills || [])
      ]
      const selected = allSkills.filter((s) => skillNos.includes(s.skillNo))
      setSelectedSkills(selected)
      initSelectedSkill && initSelectedSkill(selected)
      return
    }
    // 兼容原有单选逻辑
    if (flowContent || agentDetail?.workSkillNo) {
      const skillNo = agentDetail?.workSkillNo || flowContent
      if (agentMode == 2) return // 语音模式下不处理
      const selfSkill = availableSkills.selfSkills.find((skill) => skill.skillNo === skillNo)
      if (selfSkill) {
        setSelectedSkill({
          skillName: selfSkill.skillName,
          description: selfSkill.description,
          type: selfSkill.type || "normal",
          category: selfSkill.category,
          workSkillNo: selfSkill.skillNo,
          skillNo: selfSkill.skillNo,
          skillType: selfSkill.type,
          icon: selfSkill.icon
        })
        initSelectedSkill && initSelectedSkill(selfSkill)
      } else {
        const subSkill = availableSkills.subscribedSkills.find(
          (skill) => skill.bizNo === skillNo || skill.skillNo === skillNo
        )
        if (subSkill) {
          setSelectedSkill({
            skillName: subSkill.skillName,
            description: subSkill.description,
            type: "sub",
            category: subSkill.category,
            skillNo: subSkill.bizNo || subSkill.skillNo,
            skillType: subSkill.skillType,
            icon: subSkill.icon
          })
          initSelectedSkill && initSelectedSkill(subSkill)
        }
      }
    }
  }, [flowContent, agentDetail?.workSkillNo, agentDetail?.workSkillNos, availableSkills, agentMode])

  // 回显逻辑：监听 agentDetail.workSkillNos 变化，自动设置 selectedSkills
  useEffect(() => {
    if (agentMode == 1 && agentDetail?.workSkillNos && Array.isArray(agentDetail.workSkillNos)) {
      // 获取所有工作流列表
      const allSkills = [
        ...(availableSkills.selfSkills || []),
        ...(availableSkills.subscribedSkills || [])
      ]
      // 过滤出 workSkillNos 对应的工作流对象
      const selected = allSkills.filter((s) => agentDetail.workSkillNos.includes(s.skillNo))
      setSelectedSkills(selected)
      // 也同步 tempSelectedSkills，保证弹窗初始一致
      setTempSelectedSkills(selected)
      initSelectedSkill && initSelectedSkill(selected)
    }
  }, [agentDetail?.workSkillNos, availableSkills, agentMode])

  // 语音模板回显逻辑 - 当语音模板列表加载完成后匹配回显
  useEffect(() => {
    if (
      agentMode == 2 &&
      voiceTemplates.length > 0 &&
      agentDetail?.workSkillNo &&
      !hasVoiceTemplateInitialized.current
    ) {
      const matchedTemplate = voiceTemplates.find(
        (template) => template.taskId == agentDetail.workSkillNo
      )

      if (matchedTemplate) {
        setSelectedVoiceTemplate(matchedTemplate)

        // 将语音模板转换为兼容skill结构的对象
        const compatibleSkill = {
          skillName: matchedTemplate.taskName,
          description: "语音模板",
          type: "voice_template",
          workSkillNo: matchedTemplate.taskId,
          skillNo: matchedTemplate.taskId,
          taskId: matchedTemplate.taskId
        }

        setSelectedSkill(compatibleSkill)

        // 初始化选中工作流
        if (initSelectedSkill) {
          initSelectedSkill(compatibleSkill)
        }

        // 标记已经初始化过，防止后续覆盖用户选择
        hasVoiceTemplateInitialized.current = true
      }
    }
  }, [voiceTemplates, agentDetail?.workSkillNo, agentMode, initSelectedSkill])

  // 获取工作流分组列表
  const getSkillGroupList = async () => {
    try {
      const res = await fetchSourceTag({ botNo, tagType: "skillGroupTag" })

      setSkillGroupList(res.data?.length ? res.data : [])
    } catch (error) {
      console.error("获取工作流分组失败:", error)
    }
  }

  // 获取语音模板列表
  const fetchVoiceTemplates = async () => {
    if (!botNo) return

    setVoiceTemplateLoading(true)
    try {
      const response = await getVoiceAgentList({
        botNo,
        pageSize: 1000,
        pageNum: 1
      })

      // 判断接口返回成功
      if (response.status === 200 || response.status === "200" || response.success) {
        // 从接口返回的列表中过滤出状态为2的模板
        const list = response.data?.list || []
        const filteredTemplates = list.filter((template) => template.status === 2)
        setVoiceTemplates(filteredTemplates)
      } else {
        message.error(response.message || "获取语音模板失败")
      }
    } catch (error) {
      console.error("获取语音模板失败:", error)
      message.error("获取语音模板失败")
    } finally {
      setVoiceTemplateLoading(false)
    }
  }

  // 拉取全局常量数据
  const loadConstantTable = async (pageNum = 1, pageSize = 10, query = "") => {
    if (!botNo || !agentDetail?.agentNo) return
    setConstantTableLoading(true)
    try {
      const res = await fetchAgentConstantList({
        botNo,
        agentNo: agentDetail.agentNo,
        pageNum,
        pageSize,
        query
      })
      if (res) {
        setConstantTableData(res.data || [])
        setConstantTableTotal(res.totalCount || 0)
        setConstantTablePageNum(res.pageNum || 1)
        setConstantTablePageSize(res.pageSize || 10)
      } else {
        setConstantTableData([])
        setConstantTableTotal(0)
      }
    } catch (e) {
      setConstantTableData([])
      setConstantTableTotal(0)
    } finally {
      setConstantTableLoading(false)
    }
  }

  // 打开全局常量弹窗
  const handleOpenConstantModal = () => {
    setConstantModalOpen(true)
    setConstantTableQuery("")
    loadConstantTable(1, constantTablePageSize, "")
  }

  // 分页切换
  const handleConstantTablePageChange = (page, pageSize) => {
    loadConstantTable(page, pageSize, constantTableQuery)
  }

  // 搜索输入变化
  const handleConstantTableQueryChange = (val) => {
    setConstantTableQuery(val)
  }

  // 搜索事件
  const handleConstantTableSearch = (val) => {
    const searchVal = typeof val === "string" ? val : constantTableQuery
    loadConstantTable(1, constantTablePageSize, searchVal)
  }

  // 编辑全局常量按钮事件
  const handleEditConstant = () => {
    if (!botNo) return
    navigate(
      `/app/bot/constants?botNo=${botNo}&agentNo=${agentDetail?.agentNo}&isIframe=${true}&studioenv=${studioenv || ""}`
    )
    // if (agentDetail?.iframeStyle) {
    //   navigate(`/app/bot/constants?botNo=${botNo}&isIframe=${agentDetail.iframeStyle}`)
    // } else {
    //   navigate(`/botConstants?botNo=${botNo}&isIframe=${agentDetail.iframeStyle}`)
    // }
  }

  // 打开工作流关系抽屉
  const handleOpenSkillRelationDrawer = () => {
    if (!botNo || !agentDetail?.agentNo) return
    setSkillRelationDrawerOpen(true)
  }

  // 监听 skillRelationDrawerOpen，打开时自动请求数据并处理 loading
  useEffect(() => {
    if (skillRelationDrawerOpen && botNo && agentDetail?.agentNo) {
      setSkillRelationLoading(true)
      fetchAgentSkillRelationList({ botNo, agentNo: agentDetail.agentNo })
        .then((res) => {
          if (Array.isArray(res)) {
            setSkillRelationList(res)
          } else {
            setSkillRelationList([])
          }
        })
        .catch(() => {
          setSkillRelationList([])
        })
        .finally(() => {
          setSkillRelationLoading(false)
        })
    }
  }, [skillRelationDrawerOpen, botNo, agentDetail?.agentNo])

  // 修改这个useEffect，在组件挂载且botNo存在时根据模式加载不同数据
  useEffect(() => {
    if (botNo) {
      if (agentMode == 2) {
        fetchVoiceTemplates()
      } else {
        getSkillGroupList()
        fetchSkills()
        fetchSubSkills()
      }
    }
  }, [botNo, agentMode])

  // 保留原来的useEffect，打开弹窗时如果数据没加载则再次加载
  useEffect(() => {
    if (
      isSkillModalVisible &&
      botNo &&
      !availableSkills.selfSkills.length &&
      !availableSkills.subscribedSkills.length
    ) {
      getSkillGroupList()
      fetchSkills()
      fetchSubSkills()
    }
  }, [isSkillModalVisible, botNo])

  // 打开语音模板弹窗时，确保数据已加载
  useEffect(() => {
    if (isVoiceTemplateModalVisible && botNo && voiceTemplates.length === 0) {
      fetchVoiceTemplates()
    }
  }, [isVoiceTemplateModalVisible, botNo])

  useEffect(() => {
    if (skillData && skillData.skillList) {
      // console.log("Self skills data:", skillData.skillList)
    }
  }, [skillData])

  useEffect(() => {
    if (subscribedSkillData && subscribedSkillData.list) {
      // console.log("Subscribed skills data:", subscribedSkillData.list)
    }
  }, [subscribedSkillData])

  // 打开弹窗时初始化 tempSelectedSkills
  const handleAddFlow = () => {
    if (agentMode == 2) {
      setIsVoiceTemplateModalVisible(true)
    } else {
      setTempSelectedSkills(selectedSkills)
      setIsSkillModalVisible(true)
    }
  }

  // 处理语音模板选择
  const handleSelectVoiceTemplate = (template) => {
    setSelectedVoiceTemplate(template)
    setIsVoiceTemplateModalVisible(false)

    // 将语音模板转换为兼容skill结构的对象
    const compatibleSkill = {
      skillName: template.taskName,
      description: "语音模板",
      type: "voice_template",
      workSkillNo: template.taskId, // 使用taskId作为workSkillNo
      skillNo: template.taskId,
      taskId: template.taskId
    }

    setSelectedSkill(compatibleSkill)

    // 标记已经手动选择过，防止回显逻辑覆盖
    hasVoiceTemplateInitialized.current = true

    // 调用映射更新接口
    updateAgentMapping({
      botNo: botNo,
      agentNo: agentDetail?.agentNo,
      taskId: template.taskId
    })
      .then((response) => {
        if (response.status === 200 || response.status === "200") {
          message.success("语音模板映射更新成功")
        } else {
          message.error(response.message || "语音模板映射更新失败")
        }
      })
      .catch((error) => {
        console.error("更新语音模板映射失败:", error)
        message.error("语音模板映射更新失败")
      })

    // 通知父组件
    if (onAddFlow) {
      onAddFlow(compatibleSkill, template.taskId)
    }

    // 初始化选中工作流
    if (initSelectedSkill) {
      initSelectedSkill(compatibleSkill)
    }
  }

  // 多选处理函数（只操作 tempSelectedSkills）
  const handleSelectSkillMulti = (skill) => {
    let newSelected
    if (tempSelectedSkills.some((s) => s.skillNo === skill.skillNo)) {
      newSelected = tempSelectedSkills.filter((s) => s.skillNo !== skill.skillNo)
    } else {
      newSelected = [...tempSelectedSkills, skill]
    }
    setTempSelectedSkills(newSelected)
  }

  // 获取“我的工作流”Tab下可见工作流
  const getVisibleSelfSkills = () => {
    return availableSkills.selfSkills.filter(
      (skill) =>
        (skill.status === 1 || !skill.statusDisplayName?.includes("调试中")) &&
        (skillFilterValue === "全部" || (skill.groupTagName || "未分组") === skillFilterValue) &&
        !isSkillComposing &&
        (skill.skillName?.toLowerCase().includes(skillSearchKey.toLowerCase()) ||
          skill.description?.toLowerCase().includes(skillSearchKey.toLowerCase()))
    )
  }

  // 获取“已订阅”Tab下可见工作流
  const getVisibleSubscribedSkills = () => {
    return availableSkills.subscribedSkills.filter(
      (skill) =>
        skill.status === true &&
        !isSkillComposing &&
        (skill.skillName?.toLowerCase().includes(skillSearchKey.toLowerCase()) ||
          skill.description?.toLowerCase().includes(skillSearchKey.toLowerCase()))
    )
  }

  // 获取两个Tab下所有可见工作流合集
  const getAllVisibleSkills = () => {
    return [...getVisibleSelfSkills(), ...getVisibleSubscribedSkills()]
  }

  // 判断是否已全选（两个Tab下所有可见工作流都被选中）
  const allVisibleSkills = getAllVisibleSkills()
  const isAllSelected =
    allVisibleSkills.length > 0 &&
    allVisibleSkills.every((skill) => tempSelectedSkills.some((s) => s.skillNo === skill.skillNo))

  // 全选/取消全选处理
  const handleSelectAllSkills = () => {
    if (isAllSelected) {
      setTempSelectedSkills([])
    } else {
      // 合并当前已选和所有可见工作流，并用 skillNo 去重
      const merged = [...tempSelectedSkills, ...allVisibleSkills]
      const unique = []
      const seen = new Set()
      for (const skill of merged) {
        if (!seen.has(skill.skillNo)) {
          unique.push(skill)
          seen.add(skill.skillNo)
        }
      }
      setTempSelectedSkills(unique)
    }
  }
  const handleConfirmSkills = () => {
    setIsSkillModalVisible(false)
    setSelectedSkills(tempSelectedSkills)
    // 只传递 workSkillNos 数组
    if (onAddFlow) {
      onAddFlow(
        tempSelectedSkills,
        tempSelectedSkills.map((s) => s.skillNo)
      )
    }
    initSelectedSkill && initSelectedSkill(tempSelectedSkills)
  }
  const handleRemoveSkillMulti = (skillNo) => {
    const newSelected = selectedSkills.filter((s) => s.skillNo !== skillNo)
    setSelectedSkills(newSelected)
    onAddFlow &&
      onAddFlow(
        newSelected,
        newSelected.map((s) => s.skillNo)
      )
    initSelectedSkill && initSelectedSkill(newSelected)
  }

  // 过滤和分组我的工作流
  const filterAndGroupSelfSkills = () => {
    // 过滤掉调试中和已关闭的工作流
    const filteredSkills = availableSkills.selfSkills.filter(
      (skill) => skill.status === 1 //|| !skill.statusDisplayName?.includes("调试中")
    )

    // 按分组组织工作流
    const skillsOfGroup = filteredSkills.reduce((acc, skill) => {
      const groupName = skill.groupTagName || "未分组"
      if (!acc[groupName]) {
        acc[groupName] = []
      }
      acc[groupName].push(skill)
      return acc
    }, {})

    return skillsOfGroup
  }

  // 过滤订阅的工作流
  const filterSubscribedSkills = () => {
    return availableSkills.subscribedSkills.filter((skill) => skill.status === true)
  }

  return (
    <div className="bg-white rounded-[8px] h-full flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="text-center flex-1 flex flex-col items-center justify-center">
          {!isOnlyRead && (
            <div
              onClick={handleAddFlow}
              className="flex cursor-pointer items-center justify-center bg-[#F5F7FA] rounded-[8px] p-[20px] py-[30px] w-[100%]"
            >
              <Button type="link" icon={<PlusOutlined />} className="w-[200px] h-[40px]">
                {agentMode == 2 ? "点击添加语音模板" : "点击添加对话流工具"}
              </Button>
            </div>
          )}

          <div className="mt-[10px] w-[100%] text-[#667085] text-[12px] flex items-center justify-start">
            每个对话流会在对话框内入参&quot;USER_INPUT&quot;传入
          </div>

          {/* 多选已选工作流展示 */}
          {agentMode == 1 && selectedSkills.length > 0 && (
            <div className="mt-[20px] w-[100%]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] text-[#181B25] font-[600] text-left">已选择的工作流</h3>
                <div className="flex gap-2">
                  <Button type="default" onClick={handleOpenConstantModal}>
                    全局常量
                  </Button>
                  {originalAgentNo && (
                    <Button type="default" onClick={handleOpenSkillRelationDrawer}>
                      工作流关系
                    </Button>
                  )}
                </div>
              </div>
              <div className="w-full flex flex-col gap-[12px] overflow-y-auto overflow-x-hidden h-[60vh]">
                {selectedSkills.map((skill) => (
                  <div
                    key={skill.skillNo}
                    className="flex items-center gap-[8px] bg-[#F9FAFB] rounded-[8px] p-[8px]"
                  >
                    <Avatar
                      src={
                        SKILLICONTYPE[
                          skill.type === "sub"
                            ? skill.skillType
                            : Number(skill.skillType || skill.type) || 4
                        ]
                      }
                      shape="square"
                      size={32}
                      className="flex-shrink-0"
                      style={{ padding: "3px" }}
                    >
                      {skill.skillName?.slice(0, 1)}
                    </Avatar>
                    <Tooltip title={skill.skillName}>
                      <span className="text-[14px] text-[#181B25] font-[500] truncate w-[86%] text-left">
                        {skill.skillName}
                      </span>
                    </Tooltip>
                    <div className="w-[80px] flex justify-center items-center">
                      <Tooltip title={skill.skillNo}>
                        <Tag
                          className="cursor-pointer"
                          onClick={() => {
                            copy(skill.skillNo)
                            message.success("复制成功")
                          }}
                        >
                          ID
                        </Tag>
                      </Tooltip>

                      {!isOnlyRead && (
                        <Button
                          type="text"
                          icon={<i className="iconfont icon-shanchu1 text-[14px]"></i>}
                          onClick={() => handleRemoveSkillMulti(skill.skillNo)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* 其它模式单选展示 */}
          {agentMode != 1 && selectedSkill && (
            <div className="mt-[20px] w-[100%]">
              <h3 className="text-[15px] text-[#181B25] font-[600] text-left mb-2 ">
                {" "}
                {agentMode == 2 ? "已选择的语音模板" : "已选择的工作流"}
              </h3>
              <div className="flex items-center gap-[12px] bg-[#F9FAFB] rounded-[8px] p-[12px] w-full">
                <Avatar
                  src={
                    selectedSkill.type === "voice_template"
                      ? type1
                      : SKILLICONTYPE[
                          selectedSkill.type === "sub"
                            ? selectedSkill.skillType
                            : Number(selectedSkill.skillType || selectedSkill.type) || 4
                        ]
                  }
                  shape="square"
                  size={40}
                  className="flex-shrink-0"
                  style={{ padding: "5px" }}
                >
                  {selectedSkill.skillName?.slice(0, 1)}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-[6px]">
                    {selectedSkill.type === "sub" && (
                      <span className="text-[10px] w-[40px] inline-block text-[#f66a3f] bg-[#FFF4ED] rounded-[4px] px-1">
                        订阅
                      </span>
                    )}
                    {selectedSkill.type === "voice_template" && (
                      <span className="text-[10px] w-[40px] inline-block text-[#7F56D9] bg-[#F9F5FF] rounded-[4px] px-1">
                        语音
                      </span>
                    )}
                    <Tooltip title={selectedSkill.skillName}>
                      <div className="text-[14px] text-[#181B25] font-[500] truncate text-left w-[100%]">
                        {selectedSkill.skillName}
                      </div>
                    </Tooltip>
                    {!isOnlyRead && (
                      <Button
                        type="text"
                        icon={
                          <i className="iconfont icon-shanchu1 text-[14px] text-[#475467] font-[400] text-red-500"></i>
                        }
                        onClick={() => handleRemoveSkillMulti(selectedSkill.skillNo)}
                        className="ml-auto"
                      />
                    )}
                  </div>
                  <Tooltip title={selectedSkill.description}>
                    <div className="text-[12px] text-[#475467] truncate text-left w-[100%]">
                      {selectedSkill.description || "暂无描述"}
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 工作流选择弹窗 */}
      <Modal
        title="选择工作流"
        open={isSkillModalVisible}
        onCancel={() => setIsSkillModalVisible(false)}
        footer={
          agentMode == 1 ? (
            <>
              <Button type="default" onClick={handleSelectAllSkills}>
                {isAllSelected ? "取消全选" : "全选"}
              </Button>
              <Button type="primary" onClick={handleConfirmSkills}>
                确认
              </Button>
            </>
          ) : null
        }
        width={600}
      >
        <div className="w-full">
          <Tabs
            size="small"
            activeKey={skillTabValue}
            onChange={(key) => setSkillTabValue(key)}
            items={[
              {
                key: "1",
                label: "我的工作流",
                children: (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Select
                        value={skillFilterValue}
                        style={{ width: 120 }}
                        className="!-mt-[5px]"
                        onChange={(value) => setSkillFilterValue(value)}
                        options={[
                          { label: "全部", value: "全部" },
                          ...skillGroupList.map((group) => ({
                            label: group.tagDesc,
                            value: group.tagDesc
                          })),
                          { label: "未分组", value: "未分组" }
                        ]}
                      />
                      <Input
                        placeholder="搜索工作流"
                        value={skillSearchKey}
                        onChange={(e) => {
                          setSkillSearchKey(e.target.value)
                        }}
                        onCompositionStart={() => setIsSkillComposing(true)}
                        onCompositionEnd={() => setIsSkillComposing(false)}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[300px]">
                      {skillsLoading ? (
                        <div className="flex justify-center py-8">
                          <Spin title="加载中..." />
                        </div>
                      ) : Object.keys(filterAndGroupSelfSkills()).length > 0 ? (
                        Object.entries(filterAndGroupSelfSkills())
                          .filter(([groupName]) => {
                            if (skillFilterValue === "全部") return true
                            return groupName === skillFilterValue
                          })
                          .map(([groupName, skills]) => (
                            <div key={groupName} className="flex flex-col gap-2 pr-[10px]">
                              <div className="text-[12px] text-[#475467] mb-2">{groupName}</div>
                              {skills
                                .filter(
                                  (skill) =>
                                    !isSkillComposing &&
                                    (skill.skillName
                                      ?.toLowerCase()
                                      .includes(skillSearchKey.toLowerCase()) ||
                                      skill.description
                                        ?.toLowerCase()
                                        .includes(skillSearchKey.toLowerCase()))
                                )
                                .map((skill) => (
                                  <ToolItem
                                    key={skill.skillNo}
                                    item={{
                                      ...skill,
                                      name: skill.skillName,
                                      description: skill.description,
                                      type: skill.type || "normal"
                                    }}
                                    idKey="skillNo"
                                    checked={tempSelectedSkills.some(
                                      (s) => s.skillNo === skill.skillNo
                                    )}
                                    onCheckChange={() => handleSelectSkillMulti(skill)}
                                    showCheckbox={true}
                                  />
                                ))}
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">暂无工作流数据</div>
                      )}
                    </div>
                  </div>
                )
              },
              {
                key: "2",
                label: "已订阅",
                children: (
                  <div className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[300px]">
                    {subscribedSkillLoading ? (
                      <div className="flex justify-center py-8">
                        <Spin title="加载中..." />
                      </div>
                    ) : filterSubscribedSkills().length > 0 ? (
                      filterSubscribedSkills()
                        .filter(
                          (skill) =>
                            !isSkillComposing &&
                            (skill.skillName
                              ?.toLowerCase()
                              .includes(skillSearchKey.toLowerCase()) ||
                              skill.description
                                ?.toLowerCase()
                                .includes(skillSearchKey.toLowerCase()))
                        )
                        .map((skill) => (
                          <ToolItem
                            key={skill.skillNo}
                            item={{
                              ...skill,
                              name: skill.skillName,
                              description: skill.description,
                              type: "sub",
                              skillType: skill.skillType
                            }}
                            idKey="skillNo"
                            avatarBgColor="#f66a3f"
                            checked={tempSelectedSkills.some((s) => s.skillNo === skill.skillNo)}
                            onCheckChange={() => handleSelectSkillMulti(skill)}
                            showCheckbox={true}
                          />
                        ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">暂无订阅工作流</div>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      </Modal>

      {/* 语音模板选择弹窗 */}
      <Modal
        title="选择语音模板"
        open={isVoiceTemplateModalVisible}
        onCancel={() => setIsVoiceTemplateModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="w-full">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Input
                placeholder="搜索语音模板"
                value={voiceTemplateSearchKey}
                onChange={(e) => {
                  setVoiceTemplateSearchKey(e.target.value)
                }}
                onCompositionStart={() => setIsVoiceTemplateComposing(true)}
                onCompositionEnd={() => setIsVoiceTemplateComposing(false)}
                className="flex-1"
              />
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[300px]">
              {voiceTemplateLoading ? (
                <div className="flex justify-center py-8">
                  <Spin title="加载中..." />
                </div>
              ) : voiceTemplates.length > 0 ? (
                voiceTemplates
                  .filter(
                    (template) =>
                      !isVoiceTemplateComposing &&
                      template.taskName
                        ?.toLowerCase()
                        .includes(voiceTemplateSearchKey.toLowerCase())
                  )
                  .map((template) => (
                    <div
                      key={template.taskId}
                      className="flex items-center gap-[12px] bg-[#F9FAFB] rounded-[8px] p-[12px] w-full cursor-pointer hover:bg-[#F4F3FF]"
                      onClick={() => handleSelectVoiceTemplate(template)}
                    >
                      <Avatar
                        src={type1}
                        shape="square"
                        size={40}
                        className="flex-shrink-0"
                        style={{ padding: "5px" }}
                      >
                        {template.taskName?.slice(0, 1)}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-[6px]">
                          <span className="text-[10px] inline-block text-[#7F56D9] bg-[#F9F5FF] rounded-[4px] px-1">
                            语音
                          </span>
                          <Tooltip title={template.taskName}>
                            <div className="text-[14px] text-[#181B25] font-[500] truncate w-[180px]">
                              {template.taskName}
                            </div>
                          </Tooltip>
                          {selectedVoiceTemplate?.taskId == template.taskId && (
                            <div className="ml-auto w-[16px] h-[16px] flex items-center justify-center bg-green-500 rounded-[4px]">
                              <CheckOutlined className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-[12px] text-[#475467] truncate w-[180px]">
                          {template.creator ? `创建者: ${template.creator}` : "语音模板"}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">暂无语音模板数据</div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* 全局常量表格弹窗 */}
      <GlobalConstantTableModal
        open={constantModalOpen}
        onCancel={() => setConstantModalOpen(false)}
        loading={constantTableLoading}
        dataSource={constantTableData}
        pageNum={constantTablePageNum}
        pageSize={constantTablePageSize}
        total={constantTableTotal}
        onPageChange={handleConstantTablePageChange}
        query={constantTableQuery}
        onQueryChange={handleConstantTableQueryChange}
        onSearch={handleConstantTableSearch}
        onEditConstant={handleEditConstant}
      />

      {/* 工作流关系抽屉 */}
      <SkillRelationDrawer
        open={skillRelationDrawerOpen}
        onClose={() => setSkillRelationDrawerOpen(false)}
        skillList={skillRelationList}
        loading={skillRelationLoading}
        agentNo={agentDetail?.agentNo}
        currentBotNo={botNo}
        iframeStyle={agentDetail?.iframeStyle}
      />
    </div>
  )
}

export default ConversationFlow
