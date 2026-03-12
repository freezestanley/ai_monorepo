import React, { useState, useCallback } from "react"
import { Drawer, Button, message } from "antd"
import VoiceCanvasModeTabs from "./VoiceCanvasModeTabs"

const PropertyConfigDrawer = ({
  visible,
  onClose,
  botNo,
  voiceTaskId,
  agentDetail,
  reSaveFaq,
  voiceCanvasModeRef,
  disabled
}) => {
  const [saving, setSaving] = useState(false)
  const [localKnowledgeBases, setLocalKnowledgeBases] = useState([])

  // 处理知识库数据更新，但不立即调用父组件回调
  const handleKnowledgeBasesUpdate = useCallback((knowledgeBases) => {
    setLocalKnowledgeBases(knowledgeBases)
  }, [])

  // 处理保存
  const handleSave = async () => {
    if (!voiceCanvasModeRef?.current) {
      message.error("组件未准备就绪，请稍后重试")
      return
    }

    try {
      setSaving(true)
      await voiceCanvasModeRef.current.saveVoiceSettings()

      // 保存成功后，才调用父组件的回调函数
      if (reSaveFaq) {
        reSaveFaq(localKnowledgeBases)
      }

      message.success("保存成功")
    } catch (error) {
      console.error("保存失败:", error)
      message.error(error?.message || "保存失败，请检查必填字段后重试")
    } finally {
      setSaving(false)
    }
  }

  // 自定义标题，包含保存按钮
  const customTitle = (
    <div className="flex items-center justify-between w-full pr-2">
      <span>属性配置</span>
      <Button type="primary" loading={saving} disabled={disabled} onClick={handleSave}>
        保存配置
      </Button>
    </div>
  )

  return (
    <Drawer
      title={customTitle}
      placement="left"
      onClose={onClose}
      open={visible}
      width={700}
      destroyOnClose={true}
      rootClassName="property-confi-drawer"
      mask={false}
      push={{ distance: 0 }}
      headerStyle={{
        borderBottom: "1px solid #E4E7EC",
        padding: "10px"
      }}
      bodyStyle={{
        padding: "10px",
        height: "calc(100% - 55px)",
        overflowX: "hidden"
      }}
    >
      <div className="h-full">
        <VoiceCanvasModeTabs
          ref={voiceCanvasModeRef}
          botNo={botNo}
          voiceTaskId={voiceTaskId}
          agentDetail={agentDetail}
          reSaveFaq={handleKnowledgeBasesUpdate}
          disabled={disabled}
        />
      </div>
    </Drawer>
  )
}

export default PropertyConfigDrawer
