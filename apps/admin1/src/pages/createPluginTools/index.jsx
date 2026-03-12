import { Button, Card, Form, Tooltip, message } from "antd"
import CreateToolSteps from "./components/CreateToolSteps"
import { LeftOutlined } from "@ant-design/icons"
import BasicInfo from "./components/BasicInfo"
import InputParams from "./components/InputParams"
import OutputParams from "./components/OutputParams"
import ValidateAndDebug from "./components/ValidateAndDebug"
import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import FooterHandle from "./components/FooterHandle"
import "./index.scss"
import { useFetchToolInfo, useFetchPluginInfo } from "@/api/pluginTool"
import { getRandomString } from "@/utils"
import { fetchMcpToolList } from "@/api/pluginTool/api"

function CreatePluginTools() {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, step, pluginNo, toolNo, type = "NORMAL", mcpToolNo, isView } = queryParams
  const [current, setCurrent] = useState(1)
  const currentIndex = current - 1
  const isViewPage = isView === "true"

  const outputParamsRef = useRef(null)
  const inputParamsRef = useRef(null)

  const { data: pluginToolInfo = {} } = useFetchToolInfo({
    botNo,
    pluginNo,
    toolNo
  })

  const { data: pluginInfo = {} } = useFetchPluginInfo({
    botNo,
    pluginNo
  })

  const [basicInfoForm] = Form.useForm()
  const [inputParamsForm] = Form.useForm()
  const [outputParamsForm] = Form.useForm()
  const [debugForm] = Form.useForm()
  const form = [basicInfoForm, inputParamsForm, outputParamsForm, debugForm]

  const [loading, setLoading] = useState(false)

  const isMcpTool = type === "MCP"

  useEffect(() => {
    basicInfoForm.setFieldsValue(pluginToolInfo)
    return () => {
      basicInfoForm.resetFields()
    }
  }, [pluginToolInfo, basicInfoForm])

  const dataSourceAfterFormat =
    pluginToolInfo?.outputVariables?.map((item) => {
      return { ...item, rowId: getRandomString() }
    }) || []

  const inputVariablesAfterFormat = useMemo(() => {
    return (
      pluginToolInfo?.inputVariables?.map((item) => {
        return { ...item, rowId: getRandomString() }
      }) || []
    )
  }, [pluginToolInfo?.inputVariables])

  useEffect(() => {
    if (step) {
      setCurrent(Number(step))
    }
  }, [step])

  useEffect(() => {
    if (isMcpTool && mcpToolNo && !toolNo) {
      // 尝试从sessionStorage中获取MCP工具数据
      try {
        const storageKey = `mcp_tool_${mcpToolNo}`
        const storedToolData = sessionStorage.getItem(storageKey)

        if (storedToolData) {
          console.log("从sessionStorage获取MCP工具数据", storageKey)
          const mcpTool = JSON.parse(storedToolData)

          if (mcpTool) {
            console.log("使用缓存的MCP工具数据:", mcpTool)
            basicInfoForm.setFieldsValue({
              toolName: mcpTool.toolName,
              toolDesc: mcpTool.toolDesc,
              type: "MCP"
            })
            return
          }
        }
      } catch (err) {
        console.error("读取缓存MCP工具数据失败", err)
      }

      // 如果没有缓存数据，则从API获取
      console.log("准备加载MCP工具数据", { pluginNo, mcpToolNo })
      setLoading(true)

      // 确保只有在MCP类型时才请求接口
      fetchMcpToolList({ pluginNo })
        .then((res) => {
          console.log("获取MCP工具列表结果:", res)
          if (res.success) {
            // 尝试从返回数据中查找匹配的工具
            let targetTool = null

            // 处理不同的数据结构
            if (Array.isArray(res.data)) {
              // 数组结构
              targetTool = res.data.find((tool) => tool.toolNo === mcpToolNo)
            } else if (res.data && Array.isArray(res.data.data)) {
              // 嵌套对象结构
              targetTool = res.data.data.find((tool) => tool.toolNo === mcpToolNo)
            }

            console.log("找到的目标工具:", targetTool)

            if (targetTool) {
              // 填充表单数据
              const formData = {
                toolName: targetTool.toolName,
                toolDesc: targetTool.toolDesc,
                type: "MCP"
              }

              console.log("设置表单数据:", formData)

              // 保存到sessionStorage
              try {
                sessionStorage.setItem(`mcp_tool_${mcpToolNo}`, JSON.stringify(targetTool))
              } catch (err) {
                console.error("保存MCP工具数据到sessionStorage失败", err)
              }

              // 设置表单数据
              basicInfoForm.setFieldsValue(formData)
            } else {
              console.warn("未找到匹配的MCP工具")
              message.warning("未找到对应的MCP工具信息")
            }
          } else {
            console.error("获取MCP工具列表失败", res)
            message.error("获取MCP工具列表失败")
          }
        })
        .catch((err) => {
          console.error("获取MCP工具列表出错", err)
          message.error("获取MCP工具信息出错")
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isMcpTool, mcpToolNo, pluginNo, toolNo, basicInfoForm])

  const onBackClick = () => {
    window.history.back()
  }

  return (
    <div>
      <Card
        bordered={false}
        style={{
          boxShadow: "none"
        }}
        title={
          <div>
            <Tooltip title="返回列表">
              <Button type="link" onClick={onBackClick}>
                <LeftOutlined />
              </Button>
            </Tooltip>
            <span>{isViewPage ? "查看工具" : "创建工具"}</span>
          </div>
        }
      >
        <div className="mt-8">
          <CreateToolSteps current={currentIndex} />
        </div>
        <div className="mt-16">
          {currentIndex === 0 && (
            <BasicInfo form={basicInfoForm} pluginInfo={pluginInfo} disabled={isViewPage} />
          )}
          {currentIndex === 1 && (
            <InputParams
              form={inputParamsForm}
              ref={inputParamsRef}
              formData={pluginToolInfo.inputVariables}
              toolType={type}
              disabled={isViewPage}
            />
          )}
          {currentIndex === 2 && (
            <OutputParams
              form={outputParamsForm}
              ref={outputParamsRef}
              outputVariables={dataSourceAfterFormat}
              toolType={type}
              disabled={isViewPage}
            />
          )}
          {currentIndex === 3 && (
            <ValidateAndDebug
              form={debugForm}
              inputVariables={inputVariablesAfterFormat}
              pluginNo={pluginNo}
              toolNo={toolNo}
              debugStatus={pluginToolInfo.debugStatus}
            />
          )}
        </div>
        <div className="text-right mr-4">
          <FooterHandle
            current={currentIndex}
            total={4}
            form={form[currentIndex]}
            setCurrent={setCurrent}
            queryParams={queryParams}
            navigate={navigate}
            pluginNo={pluginNo}
            botNo={botNo}
            toolNo={toolNo}
            location={location}
            outputParamsRef={outputParamsRef}
            inputParamsRef={inputParamsRef}
            isViewPage={isViewPage}
          />
        </div>
      </Card>
    </div>
  )
}

export default CreatePluginTools
