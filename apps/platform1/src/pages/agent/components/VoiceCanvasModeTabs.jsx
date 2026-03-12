import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react"
import { Tabs, Form, message } from "antd"
import VoiceTemplateForm from "@/pages/voice/components/VoiceTemplateForm"
import { useCreateOrUpdateVoiceAgent } from "@/api/voiceAgent"
import { getVoiceAgentDetails } from "@/api/voiceAgent/api"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import moment from "moment"

// 导入各个 tab 组件
import SkillSettingsTab from "./VoiceCanvasModeTabs/SkillSettingsTab"
import KnowledgeBaseTab from "./VoiceCanvasModeTabs/KnowledgeBaseTab"
import VoiceSettingsTab from "./VoiceCanvasModeTabs/VoiceSettingsTab"
import ChannelConfigTab from "./VoiceCanvasModeTabs/ChannelConfigTab"
import PropertyConfigTab from "./VoiceCanvasModeTabs/PropertyConfigTab"
import GeneralSettingsTab from "./VoiceCanvasModeTabs/GeneralSettingsTab"
import DataFlywheelTab from "./VoiceCanvasModeTabs/DataFlywheelTab"

// 导入样式
import "./VoiceCanvasModeTabs/index.scss"

const VoiceCanvasModeTabs = forwardRef(
  ({ botNo, voiceTaskId, agentDetail, reSaveFaq, disabled }, ref) => {
    const [form] = Form.useForm()
    const location = useLocation()
    const navigate = useNavigate()

    // 语音配置相关状态
    const [taskId, setTaskId] = useState(null)
    const [voiceDetail, setVoiceDetail] = useState(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [hasFormChanged, setHasFormChanged] = useState(false)
    const [saveTimeout, setSaveTimeout] = useState(null)

    // Tab 相关状态
    const [activeTab, setActiveTab] = useState("skills")
    const [tabErrors, setTabErrors] = useState({})

    // 获取URL参数
    const searchParams = queryString.parse(location.search) || {}
    const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
    const currentBotNo = botNo || searchParams.botNo || hashParams.botNo || "20250416001"

    // API函数
    const createOrUpdateVoiceAgent = useCreateOrUpdateVoiceAgent()

    // 计算是否为编辑状态（如果已有 voiceDetail 数据，说明是编辑状态）
    const isEditing = voiceDetail?.flywheelInfo?.status == 1

    // console.log("changedValues =>>>>", agentDetail)

    // 获取语音详情
    const fetchVoiceDetail = async () => {
      if (!agentDetail?.agentNo) return

      setLoading(true)
      try {
        const res = await getVoiceAgentDetails({
          agentNo: agentDetail.agentNo,
          botNo: currentBotNo
        })

        if (res && res.status === 200 && res.data) {
          setVoiceDetail(res.data)
          setTaskId(res.data.taskId)

          // 设置表单初始值
          const formData = {
            taskName: res.data.taskName,
            timbreCode: res.data.timbreCode,
            speed: res.data.speed,
            volume: res.data.volume,
            audioFormat: res.data.audioFormat,
            sampleRate: res.data.sampleRate,
            taskProcessRateFlag:
              res.data.taskProcessRateFlag === "1" || res.data.taskProcessRateFlag === true,
            reflectErrOverNum: res.data.reflectErrOverNum,
            redisExpireTime: res.data.redisExpireTime || 86400,
            variableConfigs: res.data.variableConfigs || [],
            ccConfigs: res.data.ccConfigs || [],
            skillNos: res.data.skillNos || [],
            // 添加缺失的工作流字段
            reflectAigcEventSkillNo: res.data.reflectAigcEventSkillNo,
            reflectAigcSkillNo: res.data.reflectAigcSkillNo,
            numberWebCall: res.data.numberWebCall,
            intentTagCallSkillNo: res.data.intentTagCallSkillNo,
            outTemplateId: res.data.outTemplateId,
            outTemplateName: res.data.outTemplateName,
            webCallPlatform: res.data.webCallPlatform,
            bizTypes: res.data.bizTypes,
            // 添加其他可能的字段
            robotStrategy: res.data.robotStrategy,
            crossCallScriptTag:
              !res.data.crossCallScriptTag ||
              res.data.crossCallScriptTag === "false" ||
              res.data.crossCallScriptTag === "0"
                ? "0"
                : "1",
            taskProcessRateSleepTime: res.data.taskProcessRateSleepTime,
            // 数据飞轮字段（使用 flywheelInfo 包裹，兼容旧字段）
            flywheelInfo: {
              status:
                res.data?.flywheelInfo?.status !== undefined
                  ? Number(res.data.flywheelInfo.status)
                  : res.data?.status !== undefined
                    ? Number(res.data.status)
                    : 2,
              flywheelTaskName:
                res.data?.flywheelInfo?.flywheelTaskName || res.data?.flywheelTaskName,
              businessBackground:
                res.data?.flywheelInfo?.businessBackground || res.data?.businessBackground
            }
          }

          // 处理时间字段，确保转换为moment对象
          if (res.data.allowCallTimeStart) {
            formData.allowCallTimeStart = moment(res.data.allowCallTimeStart, "HH:mm")
          }
          if (res.data.allowCallTimeEnd) {
            formData.allowCallTimeEnd = moment(res.data.allowCallTimeEnd, "HH:mm")
          }

          // 处理 ccConfigs 字段，确保是数组
          if (res.data.ccConfigs && typeof res.data.ccConfigs === "string") {
            try {
              formData.ccConfigs = JSON.parse(res.data.ccConfigs)
            } catch (e) {
              console.warn("VoiceCanvasModeTabs: ccConfigs 解析失败", e)
              formData.ccConfigs = []
            }
          }

          // 处理布尔值字段
          if (res.data.crossCallScriptTag !== undefined) {
            formData.crossCallScriptTag =
              !res.data.crossCallScriptTag ||
              res.data.crossCallScriptTag === "false" ||
              res.data.crossCallScriptTag === "0"
                ? "0"
                : "1"
          }

          form.setFieldsValue(formData)

          // 验证表单数据是否正确设置
          setTimeout(() => {
            const currentFormValues = form.getFieldsValue()
            console.log("VoiceCanvasModeTabs: 当前表单值", currentFormValues)
          }, 100)

          // 重置表单变化状态，避免初始化时触发保存
          setHasFormChanged(false)
        }
      } catch (error) {
        console.error("获取语音详情失败:", error)
        message.error("获取语音详情失败")
      } finally {
        setLoading(false)
      }
    }

    // 初始化获取语音详情
    useEffect(() => {
      fetchVoiceDetail()
    }, [agentDetail?.agentNo, currentBotNo])

    // 表单验证并跳转到对应 tab
    const validateAndSwitchTab = async () => {
      try {
        await form.validateFields()
        setTabErrors({})
        return true
      } catch (error) {
        if (error.errorFields && error.errorFields.length > 0) {
          const newTabErrors = {}
          let firstErrorTab = null

          // 根据字段名映射到对应的 tab
          const fieldToTabMap = {
            // 工作流设置
            reflectAigcSkillNo: "skills",
            reflectErrOverNum: "skills",
            reflectAigcEventSkillNo: "skills",
            intentTagCallSkillNo: "skills",

            // 知识库 - 暂无必填字段

            // 声音设置
            timbreCode: "voice",
            audioFormat: "voice",
            sampleRate: "voice",
            speed: "voice",
            volume: "voice",

            // 呼叫路线配置
            ccConfigs: "channel",

            // 名单属性 - 暂无必填字段

            // 高级设置
            taskName: "general",
            redisExpireTime: "general",
            robotStrategy: "general",
            taskProcessRateSleepTime: "general",

            // 数据飞轮
            flywheelInfo: "flywheel"
          }

          error.errorFields.forEach((field) => {
            const fieldName = Array.isArray(field.name) ? field.name[0] : field.name
            const tabKey = fieldToTabMap[fieldName]

            if (tabKey) {
              if (!newTabErrors[tabKey]) {
                newTabErrors[tabKey] = []
              }
              newTabErrors[tabKey].push({
                field: fieldName,
                errors: field.errors
              })

              if (!firstErrorTab) {
                firstErrorTab = tabKey
              }
            }
          })

          setTabErrors(newTabErrors)

          // 跳转到第一个有错误的 tab
          if (firstErrorTab) {
            setActiveTab(firstErrorTab)
            // message.error("请完善必填信息")
          }

          return false
        }
        return false
      }
    }

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        // 获取当前表单数据
        getFormData: () => {
          return form.getFieldsValue()
        },
        // 保存语音设置
        saveVoiceSettings: async () => {
          if (!taskId) {
            throw new Error("缺少taskId，无法保存")
          }

          if (!agentDetail?.agentNo) {
            throw new Error("缺少agentNo，无法保存")
          }

          // 先进行表单验证
          const isValid = await validateAndSwitchTab()
          if (!isValid) {
            throw new Error("表单验证失败，请检查！")
          }

          try {
            const formValues = form.getFieldsValue()

            // 构建保存参数
            const params = {
              taskId: taskId,
              botNo: currentBotNo,
              agentNo: agentDetail?.agentNo,
              ...formValues,
              // 处理时间格式
              allowCallTimeStart:
                formValues.allowCallTimeStart?.format?.("HH:mm") || formValues.allowCallTimeStart,
              allowCallTimeEnd:
                formValues.allowCallTimeEnd?.format?.("HH:mm") || formValues.allowCallTimeEnd,
              // 确保必要的字段
              taskProcessRateFlag: formValues.taskProcessRateFlag ? "1" : "0"
            }

            const res = await createOrUpdateVoiceAgent(params)

            if (res.status === 200) {
              console.log("语音画布设置保存成功")
              // 重新获取最新数据
              fetchVoiceDetail()
              setHasFormChanged(false)
              return res
            } else {
              message.error(res.message || "语音画布设置保存失败")
              throw new Error(res.message || "语音画布设置保存失败")
            }
          } catch (error) {
            console.error("语音画布设置保存失败:", error)
            throw error
          }
        }
      }),
      [
        taskId,
        agentDetail?.agentNo,
        currentBotNo,
        form,
        createOrUpdateVoiceAgent,
        fetchVoiceDetail,
        validateAndSwitchTab
      ]
    )

    // 表单值变化处理
    const handleFormChange = (changedValues, allValues) => {
      // console.log("表单值变化:", changedValues, allValues)
      setHasFormChanged(true)

      // 清除相关 tab 的错误状态
      if (changedValues) {
        const fieldToTabMap = {
          reflectAigcSkillNo: "skills",
          reflectErrOverNum: "skills",
          reflectAigcEventSkillNo: "skills",
          intentTagCallSkillNo: "skills",
          timbreCode: "voice",
          audioFormat: "voice",
          sampleRate: "voice",
          speed: "voice",
          volume: "voice",
          ccConfigs: "channel",
          taskName: "general",
          redisExpireTime: "general",
          robotStrategy: "general",
          taskProcessRateSleepTime: "general",
          flywheelInfo: "flywheel"
        }

        const newTabErrors = { ...tabErrors }
        let hasChanges = false

        Object.keys(changedValues).forEach((fieldName) => {
          const tabKey = fieldToTabMap[fieldName]
          if (tabKey && newTabErrors[tabKey]) {
            delete newTabErrors[tabKey]
            hasChanges = true
          }
        })

        if (hasChanges) {
          setTabErrors(newTabErrors)
        }
      }
    }

    // Tab 配置 - 添加 forceRender 属性确保所有 Tab 内容都被预渲染
    const tabItems = [
      {
        key: "skills",
        label: (
          <span className={tabErrors.skills ? "text-red-500" : ""}>
            工作流设置
            {tabErrors.skills && <span className="ml-1 text-red-500">●</span>}
          </span>
        ),
        children: (
          <SkillSettingsTab
            form={form}
            disabled={disabled}
            botNo={currentBotNo}
            agentDetail={agentDetail}
            onFormChange={handleFormChange}
            loading={loading}
          />
        ),
        forceRender: true
      },
      {
        key: "knowledge",
        label: (
          <span className={tabErrors.knowledge ? "text-red-500" : ""}>
            知识库
            {tabErrors.knowledge && <span className="ml-1 text-red-500">●</span>}
          </span>
        ),
        children: (
          <KnowledgeBaseTab
            form={form}
            botNo={currentBotNo}
            voiceTaskId={voiceTaskId}
            agentDetail={agentDetail}
            onFormChange={handleFormChange}
            onChangeFaqHandle={reSaveFaq}
            loading={loading}
            disabled={disabled}
          />
        ),
        forceRender: true
      },
      {
        key: "voice",
        label: (
          <span className={tabErrors.voice ? "text-red-500" : ""}>
            声音设置
            {tabErrors.voice && <span className="ml-1 text-red-500">●</span>}
          </span>
        ),
        children: (
          <VoiceSettingsTab
            form={form}
            botNo={currentBotNo}
            agentDetail={agentDetail}
            onFormChange={handleFormChange}
            loading={loading}
          />
        ),
        forceRender: true
      },
      {
        key: "channel",
        label: (
          <span className={tabErrors.channel ? "text-red-500" : ""}>
            呼叫路线配置
            {tabErrors.channel && <span className="ml-1 text-red-500">●</span>}
          </span>
        ),
        children: (
          <ChannelConfigTab
            form={form}
            botNo={currentBotNo}
            agentDetail={agentDetail}
            onFormChange={handleFormChange}
            loading={loading}
          />
        ),
        forceRender: true
      },
      {
        key: "property",
        label: (
          <span className={tabErrors.property ? "text-red-500" : ""}>
            名单属性
            {tabErrors.property && <span className="ml-1 text-red-500">●</span>}
          </span>
        ),
        children: (
          <PropertyConfigTab
            form={form}
            botNo={currentBotNo}
            agentDetail={agentDetail}
            onFormChange={handleFormChange}
            loading={loading}
          />
        ),
        forceRender: true
      },
      {
        key: "general",
        label: (
          <span className={tabErrors.general ? "text-red-500" : ""}>
            高级设置
            {tabErrors.general && <span className="ml-1 text-red-500">●</span>}
          </span>
        ),
        children: (
          <GeneralSettingsTab
            form={form}
            botNo={currentBotNo}
            voiceTaskId={voiceTaskId}
            agentDetail={agentDetail}
            onFormChange={handleFormChange}
            loading={loading}
            showTaskName={true}
            hideFlowType={true}
          />
        ),
        forceRender: true
      },
      {
        key: "flywheel",
        label: (
          <span className={tabErrors.flywheel ? "text-red-500" : ""}>
            数据飞轮
            {tabErrors.flywheel && <span className="ml-1 text-red-500">●</span>}
          </span>
        ),
        children: (
          <DataFlywheelTab
            form={form}
            disabled={disabled}
            isEditing={isEditing}
            onFormChange={handleFormChange}
            loading={loading}
            botNo={currentBotNo}
            taskId={taskId}
          />
        ),
        forceRender: true
      }
    ]

    return (
      <div className="w-full h-full p-2 pr-0">
        <Form
          form={form}
          disabled={disabled}
          layout="vertical"
          initialValues={{
            taskProcessRateFlag: false,
            audioFormat: "wav",
            sampleRate: 8000,
            speed: 1.05,
            volume: 50,
            reflectErrOverNum: 2,
            redisExpireTime: 86400,
            variableConfigs: [],
            flowType: 1,
            robotStrategy: "merge",
            crossCallScriptTag: "0",
            flywheelInfo: {
              status: 2
            }
          }}
          onValuesChange={handleFormChange}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="voice-canvas-tabs"
            size="small"
          />
        </Form>
      </div>
    )
  }
)

VoiceCanvasModeTabs.displayName = "VoiceCanvasModeTabs"

export default VoiceCanvasModeTabs
