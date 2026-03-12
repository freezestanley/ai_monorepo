import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Table, Button, Form, message } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import VoiceTemplateForm from "@/pages/voice/components/VoiceTemplateForm"
import { useCreateOrUpdateVoiceAgent } from "@/api/voiceAgent"
import { getVoiceAgentDetails } from "@/api/voiceAgent/api"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import moment from "moment"

const VoiceCanvasMode = forwardRef(({ botNo, agentDetail, reSaveFaq, isOnlyRead }, ref) => {
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

  // 获取URL参数
  const searchParams = queryString.parse(location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const currentBotNo = botNo || searchParams.botNo || hashParams.botNo || "20250416001"

  // API函数
  const createOrUpdateVoiceAgent = useCreateOrUpdateVoiceAgent()

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
          redisExpireTime: res.data.redisExpireTime,
          variableConfigs: res.data.variableConfigs || [],
          ccConfigs: res.data.ccConfigs || [], // 添加通道设置回显
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
          taskProcessRateSleepTime: res.data.taskProcessRateSleepTime
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
            console.warn("VoiceCanvasMode: ccConfigs 解析失败", e)
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
          console.log("VoiceCanvasMode: 当前表单值", currentFormValues)
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

        try {
          await form.validateFields()
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
          // 如果是表单验证错误，提供更友好的错误信息
          if (error.errorFields && error.errorFields.length > 0) {
            const errorMessages = error.errorFields
              .map((field) => {
                const fieldName = field.name.join(".")
                const errorMsg = field.errors.join(", ")
                return `${fieldName}: ${errorMsg}`
              })
              .join("; ")
            throw new Error(`语音画布设置表单验证失败：${errorMessages}`)
          }
          console.error("语音画布设置保存失败:", error)
          throw error
        }
      }
    }),
    [taskId, agentDetail?.agentNo, currentBotNo, form, createOrUpdateVoiceAgent, fetchVoiceDetail]
  )

  // 根据 voiceDetail 动态生成画布数据
  const canvasData = voiceDetail?.flowInfo
    ? [
        {
          key: "1",
          updateTime: voiceDetail.flowInfo.dataTime || "--",
          nodeCount: voiceDetail.flowInfo.count || 0,
          operation: voiceDetail.flowInfo.count === 0 ? "编辑" : "查看"
        }
      ]
    : []

  // 根据 voiceDetail 动态生成话术语音数据
  const voiceScriptData = voiceDetail?.scriptInfo
    ? [
        {
          key: "1",
          updateTime: voiceDetail.scriptInfo.dataTime || "--",
          nodeCount: voiceDetail.scriptInfo.count || 0,
          operation: voiceDetail.scriptInfo.count === 0 ? "编辑" : "查看"
        }
      ]
    : []

  // 画布表格列配置
  const canvasColumns = [
    {
      title: "更新时间",
      dataIndex: "updateTime",
      key: "updateTime"
    },
    {
      title: "节点数量",
      dataIndex: "nodeCount",
      key: "nodeCount"
    },
    {
      title: "操作",
      dataIndex: "operation",
      width: 100,
      key: "operation",
      render: (text, record) => (
        <Button type="link" size="small" onClick={handleCanvasNavigation}>
          {text}
        </Button>
      )
    }
  ]

  // 话术语音表格列配置
  const voiceScriptColumns = [
    {
      title: "更新时间",
      dataIndex: "updateTime",
      key: "updateTime"
    },
    {
      title: "话术数量",
      dataIndex: "nodeCount",
      key: "nodeCount"
    },
    {
      title: "操作",
      dataIndex: "operation",
      key: "operation",
      width: 100,
      render: (text, record) => (
        <Button type="link" size="small" onClick={handleScriptNavigation}>
          {text}
        </Button>
      )
    }
  ]

  // 表单值变化处理
  const handleFormChange = (changedValues, allValues) => {
    // console.log("表单值变化:", changedValues, allValues)
    setHasFormChanged(true)
  }

  // 鼠标离开时自动保存（带防抖）
  const handleMouseLeave = () => {
    // TODO 取消自动保存

    return false
    // if (hasFormChanged && taskId && agentDetail?.agentNo && !saving) {
    //   // 清除之前的定时器
    //   if (saveTimeout) {
    //     clearTimeout(saveTimeout)
    //   }

    //   // 设置新的定时器，延迟500ms执行保存
    //   const timeout = setTimeout(async () => {
    //     console.log("检测到表单变化，自动保存...")
    //     await handleSave()
    //     setHasFormChanged(false)
    //   }, 500)

    //   setSaveTimeout(timeout)
    // }
  }

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout])

  // 处理画布跳转
  const handleCanvasNavigation = () => {
    if (voiceDetail && taskId) {
      // 获取 flowType，如果没有则默认为 1
      const flowType = voiceDetail.flowType || 1
      const taskName = voiceDetail.taskName || ""
      const status = voiceDetail.status || 2

      navigate(
        `/voice/canvas?id=${taskId}&botNo=${currentBotNo}&taskName=${encodeURIComponent(taskName)}&status=${status}&flowType=${flowType}&agentNo=${agentDetail?.agentNo}`
      )
    } else {
      message.error("缺少必要参数，无法跳转")
    }
  }

  // 处理话术跳转
  const handleScriptNavigation = () => {
    if (taskId) {
      navigate(`/voice/scriptManage?id=${taskId}&botNo=${currentBotNo}`)
    } else {
      message.error("缺少必要参数，无法跳转")
    }
  }

  // 保存语音配置
  const handleSave = async () => {
    if (!taskId) {
      message.error("缺少taskId，无法保存")
      return
    }

    if (!agentDetail?.agentNo) {
      message.error("缺少agentNo，无法保存")
      return
    }

    try {
      await form.validateFields()
      const formValues = form.getFieldsValue()

      setSaving(true)

      // 构建保存参数
      const params = {
        taskId: taskId,
        botNo: currentBotNo,
        agentNo: agentDetail?.agentNo, // 必需参数：agentNo
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
        // 静默保存，不显示成功消息
        console.log("自动保存成功")
        // 重新获取最新数据
        fetchVoiceDetail()
        setHasFormChanged(false)
      } else {
        message.error(res.message || "保存失败")
      }
    } catch (error) {
      if (error.errorFields) {
        // message.error("请完当前 Agent 设置信息")
      } else {
        console.error("保存失败:", error)
        message.error("保存失败，请重试")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full h-full p-3 pr-0" onMouseLeave={handleMouseLeave}>
      {/* 画布部分 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-[500] text-[#181B25]">画布</h3>
        </div>
        <Table
          columns={canvasColumns}
          dataSource={canvasData}
          pagination={false}
          size="small"
          className="mb-4"
        />
      </div>

      {/* 话术语音部分 */}
      {/* <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-[500] text-[#181B25]">话术语音</h3>
        </div>
        <Table
          columns={voiceScriptColumns}
          dataSource={voiceScriptData}
          pagination={false}
          size="small"
          className="mb-4"
        />
      </div> */}

      {/* 语音模板表单 */}
      <div className="w-full pb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-[500] text-[#181B25]">设置</h3>
        </div>
        <VoiceTemplateForm
          form={form}
          isOnlyRead={isOnlyRead}
          botNo={currentBotNo}
          showTaskName={true}
          onFormChange={handleFormChange}
          hideFlowType={true}
          loading={loading}
          agentDetail={agentDetail}
          onChangeFaqHandle={(knowledgeBasesVoice) => {
            console.log("dadasdasdas")
            reSaveFaq(knowledgeBasesVoice)
          }}
        />
      </div>
    </div>
  )
})

VoiceCanvasMode.displayName = "VoiceCanvasMode"

export default VoiceCanvasMode
