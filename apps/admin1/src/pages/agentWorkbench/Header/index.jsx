import { ArrowLeftOutlined, ClearOutlined } from "@ant-design/icons"
import {
  Button,
  Tooltip,
  Dropdown,
  Upload,
  message,
  Drawer,
  Form,
  Modal,
  Input,
  Switch,
  Space
} from "antd"
import queryString from "query-string"
import { forwardRef, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import AgentHistoryVersion from "../components/AgentHistoryVersion"
import moment from "moment"
import AgentDebugComponent from "../components/AgentDebugComponent"
import "./index.scss"
import { getTokenAndServiceName } from "@/api/sso"
import { importAgentUrl } from "@/api/agent/api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { usePreviousLocation } from "@/router/PreviousLocationProvider"

function Header({ agentData = {}, botNo, agentNo, agentName, releaseAgent, onSave }) {
  const { versionNo } = agentData
  const token = getTokenAndServiceName().token + ""
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const debugRef = useRef(null)

  const [modal, contextHolder] = Modal.useModal()

  const { setPrevLocation } = usePreviousLocation()

  const [importLoading, setImportLoading] = useState(false)

  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false)
  const [debugDrawerVisible, setDebugDrawerVisible] = useState(false)

  const queryClient = useQueryClient()

  const onResetSession = () => {
    if (debugRef.current && debugRef.current.resetSession) {
      debugRef.current.resetSession()
    }
  }

  const handleBack = () => {
    const { botNo } = agentData
    const { isIframe } = queryParams
    setPrevLocation("/shouldBackToAgent")
    window.history.back()
    // if (isIframe === "true") {
    //   window.history.back()
    // } else {
    //   onSave().then(() => {
    //     navigate(`/addbot/${botNo}`)
    //   })
    // }
  }

  /**
   * 获取上传地址
   * @returns {string} UploadUrl
   */
  const getUploadUrl = () => {
    return importAgentUrl({
      agentNo: agentNo,
      versionNo: agentData?.versionNo || `${agentNo}${moment().format("YYYYMMDDHHmmss")}`
    })
  }

  /**
   * 处理导入文件后的改变
   * @param {*} info
   * @param {*} e
   */
  const handleUploadChange = (info, e) => {
    console.log(info, e)
    if (info.file.status === "uploading") {
      setImportLoading(true)
    }

    if (info.file.status === "done") {
      if (info.file.response.success) {
        setImportLoading(false)
        window.location.reload()
      } else {
        message.error(info.file.response.message)
        setImportLoading(false)
      }
    }
  }

  const onDebugAgent = () => {
    onSave({ isSilent: true })
    setDebugDrawerVisible(true)
  }
  const [form] = Form.useForm()

  /**
   * 发布版本
   */
  const handleRelease = () => {
    form.setFieldsValue({
      versionName: agentName + moment().format("YYYYMMDDHHmmss")
    })

    modal.confirm({
      title: "提示",
      width: 500,
      content: (
        <Form layout="vertical" form={form} className="w-[400px]">
          <div className="mb-5">是否确认发布该版本?</div>
          <Form.Item
            label="版本名"
            name="versionName"
            rules={[
              {
                required: true,
                message: "请输入版本名"
              }
            ]}
          >
            <Input className="ml-2" />
          </Form.Item>
          <Form.Item
            label="备注"
            name="description"
            labelCol={{ span: 5 }}
            rules={[
              {
                required: false,
                message: "请输入备注，200字以内"
              }
            ]}
          >
            <Input.TextArea className="ml-2" maxLength={200} placeholder="请输入备注，200字以内" />
          </Form.Item>
          <Form.Item label="是否默认选中该版本" name="isCurrent" initialValue={true}>
            <Switch defaultChecked={true} />
          </Form.Item>
        </Form>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        form.validateFields().then((values) => {
          console.log(values)
          releaseAgent(
            {
              botNo,
              agentNo: agentData?.agentNo,
              versionNo: agentData?.versionNo,
              isCurrent: values.isCurrent ? true : false,
              versionName: values.versionName,
              description: values.description
            },
            {
              onSuccess: (e) => {
                if (e.success) {
                  // @ts-ignore
                  message.success(e.message)
                  queryClient.invalidateQueries([QUERY_KEYS.AGENT_VERSION_LIST])
                  queryClient.invalidateQueries([QUERY_KEYS.LATEST_AGENT_DEFINITION])
                  form.setFieldsValue({
                    description: ""
                  })
                  setDebugDrawerVisible(false)
                } else {
                  // @ts-ignore
                  message.error(e.message)
                }
              }
            }
          )
        })
      }
    })
  }

  return (
    <div className="agent-tool-bar-wrapper pl-2 w-full p-2 flex items-center justify-between">
      <div>
        <ArrowLeftOutlined className="ml-4 mr-4 cursor-pointer" onClick={handleBack} />
        <span className="skill-status">{agentData?.releaseStatusDisplayName}</span>
        <Button
          // loading={isLoading}
          className="ml-2"
          onClick={onSave}
          type="primary"
        >
          保存
        </Button>
        <Button
          className="ml-2"
          onClick={() => {
            setHistoryDrawerVisible(true)
          }}
        >
          历史记录
        </Button>
      </div>
      <div className="skill-name ml-20 text-lm font-bold">{agentName}</div>

      <div className="mr-4">
        <Dropdown
          menu={{
            items: [
              {
                key: "2",
                label: (
                  <Upload
                    maxCount={1}
                    accept=".json,.txt"
                    name="file"
                    headers={{
                      "X-Usercenter-Session": token
                    }}
                    action={getUploadUrl()}
                    beforeUpload={(file) => {
                      // 判断文件类型
                      const isJson = file.type === "application/json"
                      const isTxt = file.type === "text/plain"
                      if (!isJson && !isTxt) {
                        message.error("请上传json或txt文件!")
                        return false
                      }
                    }}
                    showUploadList={false}
                    onChange={handleUploadChange}
                  >
                    <Button loading={importLoading} type="link">
                      导入
                    </Button>
                  </Upload>
                )
              }
            ]
          }}
        >
          <Button>更多功能</Button>
        </Dropdown>
        <Button
          // loading={isLoading}
          className="ml-2"
          onClick={onDebugAgent}
          type="primary"
        >
          调试
        </Button>
        {/* 当禁用的时候, 需要hover提示调试通过后即可发布 */}
        <Tooltip title={agentData?.releaseStatus !== "to_be_released" ? "调试通过后即可发布" : ""}>
          <Button
            className="ml-2"
            onClick={handleRelease}
            disabled={agentData?.releaseStatus !== "to_be_released"}
          >
            发布
          </Button>
        </Tooltip>
      </div>
      <div className="agent-header-drawer-wrapper">
        <Drawer
          getContainer={false}
          width={700}
          rootClassName={"global-drawer"}
          styles={{
            body: {
              display: "flex",
              padding: "0"
            }
          }}
          title="调试"
          placement={"right"}
          closable={true}
          onClose={() => {
            setDebugDrawerVisible(false)
          }}
          open={debugDrawerVisible}
          key={"right"}
          extra={
            <Space>
              <Button onClick={onResetSession} type="text" icon={<ClearOutlined />}>
                清空会话
              </Button>
            </Space>
          }
        >
          <AgentDebugComponent
            botNo={botNo}
            agentNo={agentNo}
            versionNo={versionNo}
            ref={debugRef}
          />
        </Drawer>
        <Drawer
          className="!left-[20px]"
          getContainer={false}
          forceRender={true}
          rootClassName={"global-drawer"}
          title="历史记录"
          placement={"left"}
          closable={true}
          width={800}
          onClose={() => {
            setHistoryDrawerVisible(false)
          }}
          open={historyDrawerVisible}
          key={"left-history"}
        >
          {historyDrawerVisible && <AgentHistoryVersion agentData={agentData} />}
        </Drawer>
      </div>

      {contextHolder}
    </div>
  )
}

export default Header
