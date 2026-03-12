import { useState, useMemo, useEffect } from "react"
import { Drawer, Steps } from "antd"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import RenderSetStep from "./RenderSetStep"
import RenderImportTestSet from "./RenderImportTestSet"
import {
  useFetchTestSetSchema,
  useFetchSkillVersionList,
  useFetchAgentSkillVersionList
} from "@/api/batchTest"
import RenderViewResults from "./RenderViewResults"

const { Step } = Steps

const BatchTestDrawer = ({
  visible,
  onClose,
  currentStep,
  setCurrentStep,
  currentId,
  setCurrentId
}) => {
  const location = useLocation()
  const { search } = location
  const { type, botNo, skillNo, agentNo, versionNo, studioenv, view, disableChooseVersion } =
    queryString.parse(search)

  const [currentVersion, setCurrentVersion] = useState(null)
  const [formData, setFormData] = useState(null)
  const [attributeName, setAttributeName] = useState([])

  const { data: outputData } = useFetchTestSetSchema(
    {
      botNo,
      skillNo,
      skillVersionNo: currentVersion
    },
    {
      enabled: !!(skillNo && type === "skill")
    }
  )

  const { data: skillVersionList } = useFetchSkillVersionList(
    {
      botNo,
      skillNo
    },
    {
      enabled: !!(skillNo && type === "skill")
    }
  )

  const { data: agentVersionList } = useFetchAgentSkillVersionList(
    {
      botNo,
      agentNo
    },
    {
      enabled: !!(agentNo && type === "agent")
    }
  )

  const versionList = useMemo(() => {
    if (type === "skill") {
      return skillVersionList
    }
    return agentVersionList
  }, [type, skillVersionList, agentVersionList])

  useEffect(() => {
    if (!visible) {
      setCurrentStep(0)
      setCurrentId(null)
      setCurrentVersion(null)
      setFormData(null)
      setAttributeName([])
    }
  }, [visible])

  return (
    <Drawer
      title="批量测试"
      width={"80%"}
      open={visible}
      onClose={onClose}
      classNames={{
        body: "!p-0"
      }}
    >
      <div className="flex h-full overflow-hidden">
        <Steps
          size="small"
          direction="vertical"
          current={currentStep}
          className="w-72"
          style={{
            padding: 24,
            height: 400,
            minWidth: 180
          }}
        >
          <Step title="设置" />
          <Step title="开始导入" />
          <Step title="查看结果" />
        </Steps>
        {visible && (
          <div
            className="flex-grow overflow-y-auto"
            style={{
              borderLeft: "1px solid #CECECE",
              flex: 1
            }}
          >
            {currentStep === 0 && (
              <RenderSetStep
                type={type}
                botNo={botNo}
                skillNo={skillNo}
                agentNo={agentNo}
                outputData={outputData}
                currentVersion={currentVersion}
                versionList={versionList}
                setCurrentVersion={setCurrentVersion}
                versionNo={versionNo}
                onBack={onClose}
                formData={formData}
                setFormData={setFormData}
                setAttributeName={setAttributeName}
                setCurrentStep={setCurrentStep}
                disableChooseVersion={disableChooseVersion === "true"}
              />
            )}
            {currentStep === 1 && (
              <RenderImportTestSet
                type={type}
                botNo={botNo}
                skillNo={skillNo}
                agentNo={agentNo}
                studioenv={studioenv}
                outputData={outputData}
                attributeName={attributeName}
                currentVersion={currentVersion}
                setCurrentId={setCurrentId}
                formData={formData}
                setCurrentStep={setCurrentStep}
              />
            )}
            {currentStep === 2 && (
              <RenderViewResults
                type={type}
                botNo={botNo}
                skillNo={skillNo}
                agentNo={agentNo}
                versionList={versionList}
                currentId={currentId}
                setCurrentId={setCurrentId}
                isView={view === "true"}
              />
            )}
          </div>
        )}
      </div>
    </Drawer>
  )
}

export default BatchTestDrawer
