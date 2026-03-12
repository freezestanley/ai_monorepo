import { useRef } from "react"
import { Button, Form, Spin } from "antd"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { CommonContent } from "../CommonContent"
import useSaveFlow from "../../hooks/useSaveFlow"
import { useSkillFlow } from "../../hooks/useSkillFlow"
import FormInput from "../../ToolbarWithDrawers/FormInput"
import ApiForm from "../../ToolbarWithDrawers/ApiForm"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
// import { useHandleSave } from "./useSave"

export default function StartNode({ appData, currentSkillInfo: currentSkill }) {
  const { skillFlowData, handleSave, isLoading } = useSkillFlow()
  const { save } = useSaveFlow(handleSave, skillFlowData, appData)
  const [isDisabled] = useFormDisabled()
  const formInputRef = useRef(null)
  const apiFormRef = useRef(null)

  const formInputGlobalData = {
    inputParams:
      skillFlowData?.formControlDefinitions?.length > 0
        ? skillFlowData?.formControlDefinitions?.map((item) => ({
            ...item,
            placeholderTip: !!item.placeholder,
            fieldTip: !!item.tip
          }))
        : [{}]
  }

  const onFinish = () => {
    formInputRef.current?.onFinish()
    apiFormRef.current?.onFinish()
  }

  useSaveShortcut(onFinish, isLoading)

  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)

  const renderContentByType = (type) => {
    console.log(type, "type")
    switch (type) {
      case "1":
        return (
          <>
            <div className="common-item-title">快速问答默认输入为:</div>
            <div className="common-item-value" style={{ marginTop: 8 }}>
              inputs_msg
            </div>
          </>
        )
      case "2":
        return (
          <Spin spinning={isLoading}>
            <FormInput
              ref={formInputRef}
              // @ts-ignore
              save={save}
              targetData={formInputGlobalData}
              onClose={() => {
                console.log("close")
              }}
            />
          </Spin>
        )
      case "3":
        return (
          <>
            <ApiForm
              ref={apiFormRef}
              disabled={isDisabled}
              save={save}
              targetData={formInputGlobalData}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="common-node-wrapper">
      <div className="base-node-comp">
        <CommonContent
          title={"输入"}
          isLoading={isLoading}
          showDebuggerButton={false}
          showHeaderLine={true}
          onFinish={onFinish}
        >
          {renderContentByType(currentSkill?.type)}
        </CommonContent>
      </div>
    </div>
  )
}
