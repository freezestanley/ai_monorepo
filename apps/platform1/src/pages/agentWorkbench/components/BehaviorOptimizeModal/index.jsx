import "./index.scss"
import { useEffect, useState } from "react"
import { Button, Form, Input, Modal, message } from "antd"
import { RedoOutlined } from "@ant-design/icons"
import UseGenerateCode from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/hooks/useGenerateCode"
import agentPlaceholder from "../agentPlaceholder"

const BehaviorOptimizeModal = (props) => {
  const { visible, form, fieldProp, onClose, onSuccess } = props
  const [value, setValue] = useState("")

  const { codeContent, setCodeContent, startGenerateCode, loading, stopGenerate } =
    UseGenerateCode()

  const onGeneratePrompt = (value) => {
    if (loading) {
      stopGenerate()
      return
    }
    const params = {
      prompt: value
    }
    setCodeContent("")
    startGenerateCode(`/botWeb/common/optimize-agent-prompt`, params)
  }

  const handleOk = () => {
    onSuccess(value)
  }

  useEffect(() => {
    if (visible) {
      const initValue = form?.getFieldValue(fieldProp)
      // setValue(initValue)
      onGeneratePrompt(initValue)
    }
  }, [visible])

  useEffect(() => {
    setValue(codeContent)
  }, [codeContent])

  return (
    <Modal
      title="定义优化"
      width={600}
      open={visible}
      closeIcon={false}
      maskClosable={false}
      okText="使用"
      onOk={handleOk}
      onCancel={onClose}
    >
      <div className="behavior-optimize-wrap">
        <Button
          className="retry-btn"
          ghost
          type="primary"
          icon={<RedoOutlined />}
          loading={loading}
          onClick={() => onGeneratePrompt(value)}
        >
          重试
        </Button>
        <Input.TextArea
          className="text-area"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={agentPlaceholder}
          autoSize={{ minRows: 15, maxRows: 28 }}
        />
      </div>
    </Modal>
  )
}

export default BehaviorOptimizeModal
