import { useEffect, useRef } from "react"
import Header from "./Header"
import MainArea from "./MainArea"
import { useFetchAgentVersion, useReleaseAgent, useSaveAgentVersion } from "@/api/agent"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { Form, message } from "antd"
import useSaveShortcut from "./hooks/useSaveShortcut"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { formatCatalogNos } from "@/utils"

function AgentWorkbench() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, iframeStyle, agentNo, agentName } = queryParams
  const [form] = Form.useForm()
  const agentRef = useRef({})
  const { mutate: releaseAgent } = useReleaseAgent()
  const { mutate: saveAgentVersion, isLoading: isSaveAgentVersionLoading } = useSaveAgentVersion()
  const { data: agentData, refetch } = useFetchAgentVersion({ agentNo })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (agentData) {
      const { commands, ...rest } = agentData
      form.setFieldsValue({
        ...rest,
        agentName
      })
    } else {
      form.setFieldsValue({
        agentName,
        commands: []
      })
    }
  }, [agentData, agentName])

  const onSave = async ({ isSilent = false } = {}) => {
    form.validateFields().then(async (values) => {
      console.log("values:", values)
      const relatedKnowledgeCatalogs = formatCatalogNos(
        values.relatedKnowledge?.relatedKnowledgeCatalogs || []
      )
      const { commands, ...rest } = values
      const submitData = {
        ...rest,
        commands: commands.map((item) => {
          return {
            ...item,
            params: item.params?.[0] || [],
            response: item.response?.[0] || []
          }
        })
      }
      if (agentData.versionNo) {
        submitData.versionNo = agentData.versionNo
      }
      try {
        saveAgentVersion(
          {
            ...submitData,
            relatedKnowledge: {
              ...(values.relatedKnowledge || {}),
              relatedKnowledgeCatalogs
            },
            agentNo
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                if (!isSilent) {
                  queryClient.invalidateQueries([QUERY_KEYS.LATEST_AGENT_DEFINITION])
                  message.success("保存成功！")
                }
              } else {
                message.error(e.message)
              }
            }
          }
        )
      } catch (e) {
        console.log(e)
      }
    })
  }
  useSaveShortcut(onSave, isSaveAgentVersionLoading)

  return (
    <div className="h-screen w-screen flex flex-col">
      <Header
        botNo={botNo}
        agentNo={agentNo}
        agentName={agentName}
        agentData={agentData}
        releaseAgent={releaseAgent}
        onSave={onSave}
      />
      <MainArea ref={agentRef} form={form} agentData={agentData} botNo={botNo} onSave={onSave} />
    </div>
  )
}

export default AgentWorkbench
