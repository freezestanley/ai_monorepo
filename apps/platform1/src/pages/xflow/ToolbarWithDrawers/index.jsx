// @ts-nocheck
import { useEffect, useReducer, useRef, useState } from "react"
import {
  Drawer,
  Button,
  message,
  Modal,
  Switch,
  Input,
  Form,
  Tooltip,
  Space,
  Upload,
  Dropdown,
  Popover,
  Table,
  Typography,
  Tag,
  Tabs,
  Radio
} from "antd"
import {
  ArrowLeftOutlined,
  EditOutlined,
  LoadingOutlined,
  EllipsisOutlined
} from "@ant-design/icons"
import { useSSO } from "@/components/SSOProvider"
import Iconfont from "@/components/Icon"
import SkillModal from "@/components/SkillModal"
import FormInput from "./FormInput"
import { MODELS, XFlowGraphCommands, XFlowNodeCommands } from "@antv/xflow"
import GlobalVariableTable from "@/components/GlobalVariableTable"
import DynamicFormComponent from "../CustomFlowchartFormPanel/NodeComponent/components/DynamicFormComponent"
import HistoryTable from "@/components/HistoryTable"
import { useFetchSkillInfo, useReleaseSkill } from "@/api/skill"
import "./index.scss"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useSkillFlow } from "../hooks/useSkillFlow"
import useSaveFlow from "../hooks/useSaveFlow"
import moment from "moment"
import { isSidebarFocused } from "@/api/tools"
import { getTokenAndServiceName } from "@/api/sso"
import { useCanvasShortcut } from "../hooks/useSaveShortcut"
import UseDebugHistory from "../hooks/useDebugHistory"
import { getDependencies, getToolbarState } from "../config-toolbar"
import { exportApiSkill, importSkill, lockSkill, unlockSkill } from "@/api/skill/api"
import TestComponent from "@/components/TestComponent"
import { useCurrentSkillLockInfo } from "@/store/index"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import queryString from "query-string"
import TopDownButton from "@/components/TopDownButton"
import { useComponentAndDebugPanel } from "@/store"
import { reportEvent } from "@/utils/monitorEvent"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"
import { isStudio } from "@/config.env"

const actionTypes = {
  TOGGLE_DRAWER: "TOGGLE_DRAWER"
}

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.TOGGLE_DRAWER:
      if (state.openDrawer === action.drawerName) {
        return { openDrawer: null }
      } else {
        return { openDrawer: action.drawerName }
      }
    default:
      return state
  }
}

const ToolbarWithDrawers = (props) => {
  const initialState = { openDrawer: null }
  const [state, dispatch] = useReducer(reducer, initialState)
  const [form] = Form.useForm()
  const {
    setFormPanelVisible,
    formPanelVisible,
    appData,
    currentSkillInfo: currentSkill,
    style = {},
    isAICreate,
    saveAiCreate
  } = props
  const [isNodeSelected, setIsNodeSelected] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [isLocked, setIsLocked] = useState(null)
  const [exportApiSkillLoading, setExportApiSkillLoading] = useState(false)
  const { userInfo = {} } = useSSO()
  const { isPublishDisabled, isOpenVersion, studioenv } = useStudioPublishData()

  const [modal, contextHolder] = Modal.useModal()

  const { data: currentSkillProcessData = {}, refetch: refetchSkillInfo } = useFetchSkillInfo(
    currentSkill?.skillNo
  )
  const formInputRef = useRef()
  const { changeComponentAndDebugPanel } = useComponentAndDebugPanel((state) => state)

  const closeComponentAndDebugPanel = () => {
    changeComponentAndDebugPanel({
      open: false
    })
  }

  const queryClient = useQueryClient()

  const { mutate: releaseSkill } = useReleaseSkill()
  const { skillFlowData = {}, handleSave, isLoading } = useSkillFlow()
  const { botNo } = skillFlowData
  const { save } = useSaveFlow(handleSave, skillFlowData, props.appData)
  const setCurrentSkillInfo = useCurrentSkillLockInfo((state) => state.setCurrentSkillInfo)

  const { dynamicFormRef, DebugPopoverButton } = UseDebugHistory({
    skillNo: currentSkillProcessData?.skillNo
  })
  // 获取hash参数
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const navigate = useNavigate()

  useEffect(() => {
    const setIsLockedFn = () => {
      if (
        currentSkillProcessData.locked === true &&
        currentSkillProcessData.lockInfo?.username === userInfo.username
      ) {
        return false
      } else if (currentSkillProcessData.locked === true) {
        return true
      }
      return false
    }
    const lockStatus = setIsLockedFn()
    setIsLocked(lockStatus)
    setCurrentSkillInfo({
      isLocked: lockStatus
    })
  }, [currentSkillProcessData.locked, userInfo])

  // useEffect(() => {
  //   if (currentSkillProcessData) {
  //     changeCurrentSkill(currentSkillProcessData)
  //   }
  // }, [changeCurrentSkill, currentSkillProcessData])

  // 保存画布
  const saveGraphData = async (callback, noMessage) => {
    reportEvent({
      eventName: "custom click",
      source: "skillDetail",
      action: "skill save",
      botNo,
      userInfo
    })
    if (isAICreate) {
      return saveAiCreate(callback)
    }
    return MODELS.GRAPH_META.useValue(appData.current.modelService).then((meta) => {
      console.log(callback, noMessage)

      save(null, callback, noMessage)
    })
  }

  const globalData = {
    inputParams: skillFlowData?.formControlDefinitions?.map((item) => ({
      ...item,
      placeholderTip: !!item.placeholder,
      fieldTip: !!item.tip
    }))
  }

  const formData =
    currentSkillProcessData?.type === "2"
      ? globalData?.inputParams
      : [
          {
            attributeName: "inputs_msg",
            attributeType: "STRING",
            controlType: "textarea",
            title: "聊天消息",
            placeholder: "聊天消息",
            placeholderTip: true,
            tip: null,
            fieldTip: false
          }
        ]

  const isJSONDebug = currentSkillProcessData?.type === "3"

  const handleRelease = () => {
    reportEvent({
      eventName: "custom click",
      source: "skillDetail",
      action: "skill release",
      botNo,
      userInfo
    })
    // 设置默认值
    form.setFieldsValue({
      versionName: currentSkillProcessData?.skillName + moment().format("YYYYMMDDHHmmss")
    })

    modal.confirm({
      title: "提示",
      destroy: true,
      width: 530,
      content: (
        <Form layout="vertical" form={form} className="w-[400px]">
          <div className="mb-5">是否确认发布该版本?</div>
          {/* {!skillFlowData?.versionName && ( */}
          <Form.Item
            label="版本名"
            name="versionName"
            className="w-[100%]"
            rules={[
              {
                required: true,
                message: "请输入版本名"
              }
            ]}
          >
            <Input className="w-[100%]" />
          </Form.Item>
          <Form.Item
            label="备注"
            name="description"
            initialValue={skillFlowData?.description}
            className="w-[100%]"
            rules={[
              {
                required: false,
                message: "请输入备注，200字以内"
              }
            ]}
          >
            <Input.TextArea
              className="w-[100%]"
              maxLength={200}
              placeholder="请输入备注，200字以内"
            />
          </Form.Item>
          {/* )} */}
          {/* {skillFlowData?.versionName && (
            <div className="mt-1">版本名: {skillFlowData?.versionName}</div>
          )} */}

          <Form.Item label="是否默认选中该版本" name="inUse" initialValue={true}>
            <Switch defaultChecked={true} />
          </Form.Item>
        </Form>
      ),
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        form.validateFields().then((values) => {
          console.log(values)
          releaseSkill(
            {
              versionNo: skillFlowData?.versionNo,
              skillNo: skillFlowData?.skillNo,
              inUse: values.inUse ? true : false,
              versionName: values.versionName || skillFlowData?.versionName,
              description: values.description
            },
            {
              onSuccess: (e) => {
                if (e.success) {
                  // @ts-ignore
                  message.success(e.message)
                  queryClient.invalidateQueries([QUERY_KEYS.SKILL_VERSION_LIST])
                  queryClient.invalidateQueries([QUERY_KEYS.LATEST_DEFINITION])
                  form.setFieldsValue({
                    description: ""
                  })
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

  const handleToUrl = (createMode) => {
    // 构建回到工作流列表页的路径，保持原有参数
    const searchParams = new URLSearchParams(window.location.search || window.location.hash)
    const isIframe = searchParams.get("isIframe")
    const workbenchNo = searchParams.get("workbenchNo")
    const parentOrigin = searchParams.get("parentOrigin")
    const token = searchParams.get("token")

    // 判断是否来自独立的工作流列表页面还是addBot页面
    // 如果URL中有createMode参数，说明是从工作流列表进入的
    let backPath = createMode ? "/skillList" : `/addbot/${botNo}`

    if (createMode) {
      // 回到独立的工作流列表页面
      const backParams = new URLSearchParams()
      if (botNo) backParams.set("botNo", botNo)
      if (isIframe) backParams.set("isIframe", isIframe)
      if (workbenchNo) backParams.set("workbenchNo", workbenchNo)
      if (parentOrigin) backParams.set("parentOrigin", parentOrigin)
      if (token) backParams.set("token", token)

      const queryString = backParams.toString()
      if (queryString) {
        backPath += `?${queryString}`
      }
    } else {
      // 回到addBot页面的工作流tab
      backPath += "#skill"
    }
    navigate(backPath)
  }

  const handleBack = () => {
    const { isIframe, isTools } = queryParams
    if (isIframe === "true") {
      if (isTools) {
        handleToUrl(true)
      } else {
        window.history.back()
      }
    } else {
      save().then(() => {
        const searchParams = new URLSearchParams(window.location.search)
        const createMode = searchParams.get("createMode")
        handleToUrl(createMode)
      })
    }
  }

  const handleUpload = () => {
    return importSkill({
      skillNo: currentSkillProcessData?.skillNo,
      versionNo: skillFlowData?.versionNo
    })
  }

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

  const handleProcessDebug = () => {
    dispatch({
      type: actionTypes.TOGGLE_DRAWER,
      drawerName: "processDebug"
    })
    closeComponentAndDebugPanel()
    setFormPanelVisible(false)
  }
  const handleBatchTest = () => {
    // dispatch({
    //   type: actionTypes.TOGGLE_DRAWER,
    //   drawerName: "batchTest"
    // })
    // setFormPanelVisible(false)
    navigate(
      `/batch-testing?type=skill&skillNo=${skillFlowData?.skillNo}&botNo=${skillFlowData?.botNo}&versionNo=${skillFlowData?.versionNo}&name=${encodeURIComponent(currentSkillProcessData?.skillName || "")}&studioenv=${studioenv || ""}`
    )
  }

  useCanvasShortcut(saveGraphData, isLoading) // 快捷键保存

  const handleApiSkillExport = () => {
    setExportApiSkillLoading(true)
    exportApiSkill({
      versionNo: skillFlowData?.versionNo,
      studioenv,
      botNo: skillFlowData?.botNo
    }).then((res) => {
      console.log(res)
      setExportApiSkillLoading(false)
    })
  }

  /**
   * 工作流锁的点击事件
   */
  const onSkillLock = async () => {
    if (isPublishDisabled) return
    if (currentSkillProcessData.locked === true) {
      const result = await unlockSkill({
        skillNo: currentSkillProcessData.skillNo
      })
      if (result.success === true) {
        message.success("解锁成功！")
      } else {
        message.error(result.message || "解锁失败，请稍后重试")
      }
    } else {
      const result = await lockSkill({
        skillNo: currentSkillProcessData.skillNo
      })
      if (result.success === true) {
        message.success("锁定成功！")
      } else {
        message.error(result.message || "锁定失败，请稍后重试")
      }
    }
    refetchSkillInfo()
  }

  useEffect(() => {
    let subscriptions = []
    console.log(appData, "appDataappData")
    if (appData.current?.modelService) {
      const fetchModelsAndWatch = async () => {
        const models = await getDependencies(appData.current.modelService)
        subscriptions = models.map((model) =>
          model.watch(async () => {
            const state = await getToolbarState(appData.current.modelService)
            setIsNodeSelected(state.isNodeSelected)
          })
        )
      }

      fetchModelsAndWatch()
    }

    return () => {
      subscriptions.forEach((sub) => {
        if (sub && typeof sub.destroy === "function") {
          sub.destroy()
        }
      })
    }
  }, [appData.current])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSidebarFocused()) {
        setFormPanelVisible(false)
        setIsNodeSelected(false)
        e.stopPropagation()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [setFormPanelVisible])

  useEffect(() => {
    if (!formPanelVisible) {
      setIsNodeSelected(false)
      console.log(appData.current)
      appData.current?.executeCommand(XFlowNodeCommands.SELECT_NODE.id, {
        nodeIds: [],
        resetSelection: true
      })
    }
  }, [appData, formPanelVisible])

  // useEffect(() => {
  //   if (!isNodeSelected) {
  //     setFormPanelVisible(false)
  //   }
  // }, [isNodeSelected])
  const lockTitle =
    currentSkillProcessData.locked === true
      ? currentSkillProcessData.lockInfo?.username === userInfo.username
        ? "当前工作流已为您锁定，锁定期间他人不可保存、调试和发布等操作，使用结束记得解锁哦~"
        : `【${currentSkillProcessData.lockInfo?.userRealName}】已锁定当前工作流，如需解锁请联系锁定人${currentSkillProcessData.lockInfo?.userRealName}/${currentSkillProcessData.lockInfo?.username}解锁`
      : `锁定工作流后其他人则不能保存、调试和发布等操作`

  return (
    <>
      <div
        className={`tool-bar-wrapper flex items-center pl-2 justify-between w-full ${isAICreate ? "tool-bar-wrapper-ai" : ""}`}
        style={style}
      >
        <div>
          {/* <ArrowLeftOutlined className="ml-1 mr-4 cursor-pointer" onClick={handleBack} /> */}
          <Tag color="volcano" className="!border-none">
            {skillFlowData?.releaseStatusDisplayName}
          </Tag>

          <span className="skill-name ml-2 text-[16px] font-bold">
            {currentSkillProcessData?.skillName}
            {!isLocked && !isPublishDisabled && (
              <EditOutlined
                className="ml-1 cursor-pointer"
                onClick={() => {
                  dispatch({
                    type: actionTypes.TOGGLE_DRAWER,
                    drawerName: "skillModal"
                  })
                }}
              />
            )}
          </span>

          {/* {currentSkillProcessData?.type === "2" && (
            <Button
              className="ml-2"
              onClick={() => {
                dispatch({
                  type: actionTypes.TOGGLE_DRAWER,
                  drawerName: "formInput"
                })
                // setFormPanelVisible(false)
              }}
            >
              表单录入项
            </Button>
          )} */}
        </div>

        {/* <div>
          <Tabs
            defaultValue={"1"}
            tabBarStyle={{ border: "none" }}
            items={[
              {
                key: "1",
                label: "编排"
              },
              {
                key: "2",
                label: "分析"
              }
            ]}
          />
        </div> */}

        <div>
          {!isAICreate && (
            <div className="flex justify-end">
              {/* {currentSkillProcessData?.type === "3" && (
                <Button
                  type="primary"
                  onClick={handleApiSkillExport}
                  loading={exportApiSkillLoading}
                >
                  导出API文档
                </Button>
              )} */}
              <Tooltip placement="bottom" title={"批量测试"}>
                <div
                  className="inline-block  mr-2 cursor-pointer transition-all duration-300 px-[10px] py-[0px] align-middle text-center bg-[#F5F7FA] leading-[36px] rounded-[8px] hover:text-[#7F56D9]"
                  onClick={handleBatchTest}
                >
                  <i className="iconfont icon-piliangceshi text-lg "></i>
                </div>
              </Tooltip>
              <Tooltip placement="bottom" title={isPublishDisabled ? "" : lockTitle}>
                {/* <Button
                  type="primary"
                  icon={
                    <Iconfont
                      type={currentSkillProcessData.locked === true ? "icon-lock" : "icon-unlock"}
                      className="text-lg"
                    />
                  }
                  className="mr-2 ml-2"
                  style={{
                    backgroundColor: currentSkillProcessData.locked === true ? "#ff4d4f" : "#63DAB0"
                  }}
                  onClick={onSkillLock}
                >
                  {currentSkillProcessData.locked === true ? "锁定中" : "未锁定"}
                </Button> */}
                {currentSkillProcessData.locked === true ? (
                  <div
                    onClick={onSkillLock}
                    className={`inline-block  mr-2 ${isPublishDisabled ? "cursor-not-allowed" : "cursor-pointer"} transition-all duration-300 px-[10px] py-[0px] align-middle text-center bg-[#FFF1EB] leading-[36px] rounded-[8px]`}
                  >
                    <i className="iconfont icon-lock text-[#D05E25]"></i>
                  </div>
                ) : (
                  <div
                    onClick={onSkillLock}
                    className={`inline-block  mr-2 ${isPublishDisabled ? "cursor-not-allowed" : "cursor-pointer"} transition-all duration-300 px-[10px] py-[0px] align-middle text-center bg-[#F5F7FA] leading-[36px] rounded-[8px] hover:text-[#7F56D9]`}
                  >
                    <i className="iconfont icon-unlock hover:text-[#7F56D9]"></i>
                  </div>
                )}
              </Tooltip>
              <Button
                className="mr-2"
                onClick={() => {
                  dispatch({
                    type: actionTypes.TOGGLE_DRAWER,
                    drawerName: "globalVariables"
                  })
                  closeComponentAndDebugPanel()
                }}
              >
                变量管理
              </Button>
              {/* <Button className="mr-2 ml-2" onClick={handleBatchTest}>
                批量测试
                
              </Button> */}

              {!isAICreate && (
                <>
                  <Button
                    loading={isLoading}
                    className="mr-2"
                    onClick={() => saveGraphData()}
                    disabled={isNodeSelected || isLocked || isPublishDisabled}
                  >
                    保存画布
                  </Button>
                  {/* <Button
                    className="mr-2"
                    onClick={() =>
                      dispatch({
                        type: actionTypes.TOGGLE_DRAWER,
                        drawerName: "historyRecord"
                      })
                    }
                  >
                    历史记录
                  </Button> */}
                  {/* 开启的时候就关闭,关闭的时候就开启 */}
                </>
              )}

              <Button
                variant="outlined"
                style={{ borderColor: "#7F56D9" }}
                onClick={handleProcessDebug}
                className="mr-2"
                disabled={isLocked}
              >
                <span className="text-[#7F56D9]">流程调试</span>
              </Button>

              {/* 当禁用的时候, 需要hover提示调试通过后即可发布 */}

              {/* <Dropdown.Button
                    onClick={handleRelease}
                    type="primary"
                    disabled={skillFlowData?.releaseStatus !== "to_be_released"}
                    menu={{
                      items: [],
                      onClick: () => {}
                    }}
                  >
                    发布
                  </Dropdown.Button> */}
              {/* disabled={skillFlowData?.releaseStatus !== "to_be_released"} */}
              <Button type="primary">
                <Tooltip
                  placement="bottom"
                  title={
                    !isOpenVersion && skillFlowData?.releaseStatus !== "to_be_released"
                      ? "调试通过后即可发布"
                      : ""
                  }
                >
                  <span
                    className={`inline-block p-[3px] pr-[18px]  ${skillFlowData?.releaseStatus !== "to_be_released" ? "cursor-not-allowed text-gray-300 line-through decoration-pink-500 decoration-double" : ""}`}
                    style={{ borderRight: "1px solid rgba(140, 113, 246, 0.5)" }}
                    onClick={() => {
                      if (isOpenVersion) {
                        message.warning("版本发布已开启，请前往版本发布页面操作")
                        return
                      }
                      if (skillFlowData?.releaseStatus !== "to_be_released") {
                        message.warning("调试通过后即可发布")
                        return
                      }
                      handleRelease()
                    }}
                  >
                    发布
                  </span>
                </Tooltip>

                <Popover
                  content={
                    <div className="flex flex-wrap items-start gap-2 p-2 max-w-[260px]">
                      <Upload
                        maxCount={1}
                        accept=".json,.txt"
                        name="file"
                        headers={{
                          "X-Usercenter-Session": getTokenAndServiceName().token,
                          ...(isStudio()
                            ? { botno: botNo || undefined, studioenv: studioenv || "prd" }
                            : {})
                        }}
                        action={handleUpload()}
                        beforeUpload={(file) => {
                          const isJson = file.type === "application/json"
                          const isTxt = file.type === "text/plain"
                          if (!isJson && !isTxt) {
                            message.error("请上传json或txt文件!")
                            return false
                          }
                        }}
                        showUploadList={false}
                        disabled={isLocked || isPublishDisabled}
                        onChange={handleUploadChange}
                      >
                        <div
                          className={`flex flex-col items-center gap-1 ${isLocked || isPublishDisabled ? "cursor-not-allowed" : "cursor-pointer"} text-[#475467] hover:text-[#7F56D9] w-[76px] py-2`}
                        >
                          <div className="w-[30px] h-[30px] bg-[#F5F7FA]  flex items-center justify-center rounded">
                            <i className="iconfont icon-daoru text-lg "></i>
                          </div>
                          <span>导入</span>
                        </div>
                      </Upload>

                      <div
                        className="flex flex-col items-center gap-1 cursor-pointer text-[#475467] hover:text-[#7F56D9] w-[76px] py-2"
                        onClick={() => {
                          dispatch({
                            type: actionTypes.TOGGLE_DRAWER,
                            drawerName: "historyRecord"
                          })
                        }}
                      >
                        <div className="w-[30px] h-[30px] bg-[#F5F7FA]  flex items-center justify-center rounded">
                          <i className="iconfont icon-lishijilu1 text-lg "></i>
                        </div>
                        <span>历史记录</span>
                      </div>

                      {currentSkillProcessData?.type === "3" && (
                        <div
                          className="flex flex-col items-center gap-1 cursor-pointer text-[#475467] hover:text-[#7F56D9] w-[76px] py-2"
                          onClick={handleApiSkillExport}
                          loading={exportApiSkillLoading}
                        >
                          <div className="w-[30px] h-[30px] bg-[#F5F7FA] flex items-center justify-center rounded ">
                            {exportApiSkillLoading ? (
                              <LoadingOutlined />
                            ) : (
                              <i className="iconfont icon-API text-lg "></i>
                            )}
                          </div>
                          <span>导出API</span>
                        </div>
                      )}
                    </div>
                  }
                  title={""}
                  placement="bottomRight"
                  trigger="hover"
                >
                  <EllipsisOutlined className="text-lg text-bold leading-3 -mr-[5px] py-[5px]" />
                </Popover>
              </Button>

              {/* <Upload
                maxCount={1}
                accept=".json,.txt"
                name="file"
                headers={{
                  "X-Usercenter-Session": getTokenAndServiceName().token
                }}
                action={handleUpload()}
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
                disabled={isLocked}
                onChange={handleUploadChange}
              >
                <Button disabled={isLocked} loading={importLoading}>
                  导入
                </Button>
              </Upload> */}
            </div>
          )}
          {isAICreate && (
            <>
              <Button
                loading={isLoading}
                className="ml-2"
                onClick={() => saveGraphData()}
                type="primary"
                disabled={isNodeSelected || isLocked || isPublishDisabled}
              >
                保存画布
              </Button>
              <Button
                variant="outlined"
                style={{ borderColor: "#7F56D9" }}
                onClick={handleProcessDebug}
                className="ml-2"
                disabled={isLocked}
              >
                <span className="text-[#7F56D9]">流程调试</span>
              </Button>

              <Tooltip
                title={
                  skillFlowData?.releaseStatus !== "to_be_released" ? "调试通过后即可发布" : ""
                }
              >
                <Button
                  className="ml-2"
                  onClick={handleRelease}
                  disabled={skillFlowData?.releaseStatus !== "to_be_released" || isOpenVersion}
                >
                  发布
                </Button>
              </Tooltip>
            </>
          )}
          {/* <Button type="primary" onClick={handleProcessDebug} className="ml-2" disabled={isLocked}>
            流程调试
          </Button> */}
          {/* 当禁用的时候, 需要hover提示调试通过后即可发布 */}
          {/* <Tooltip
            title={skillFlowData?.releaseStatus !== "to_be_released" ? "调试通过后即可发布" : ""}
          >
            <Button
              className="ml-2"
              onClick={handleRelease}
              disabled={skillFlowData?.releaseStatus !== "to_be_released"}
            >
              发布
            </Button>
          </Tooltip> */}
        </div>
      </div>

      <Drawer
        headerStyle={{ display: "none" }}
        bodyStyle={{ padding: 0, overflow: "hidden" }}
        rootStyle={{ zIndex: 100, position: "fixed", top: 68 }}
        footer={null}
        getContainer={false}
        width={700}
        rootClassName={"global-drawer process-debug-drawer"}
        placement={"right"}
        open={state.openDrawer === "processDebug" && state.openDrawer !== null}
        key={"right"}
        // extra={DebugPopoverButton()}
      >
        <div className="common-node-wrapper h-full">
          <div className="debug-panel w-full h-full">
            <DynamicFormComponent
              isJSONDebug={isJSONDebug}
              onFinish={saveGraphData}
              preview={false}
              nodeId={null}
              isProcess={true}
              formData={formData}
              ref={dynamicFormRef}
              skillFlowData={skillFlowData}
              isAICreate={isAICreate}
              forceShowPanel={true}
              className="w-full-important"
              onClose={() => {
                dispatch({
                  type: actionTypes.TOGGLE_DRAWER,
                  drawerName: "processDebug"
                })
              }}
            />
            <TopDownButton
              target={document.querySelector(
                ".dynamicFormComponent-wrapper.common-content-container"
              )}
            />
          </div>
        </div>
      </Drawer>

      {/* <Drawer
        getContainer={false}
        width={1100}
        rootClassName={"global-drawer batch-test-drawer"}
        destroyOnClose
        title="批量测试"
        placement={"right"}
        closable={true}
        bodyStyle={{ padding: 0 }}
        onClose={() => {
          dispatch({
            type: actionTypes.TOGGLE_DRAWER,
            drawerName: "batchTest"
          })
        }}
        open={state.openDrawer === "batchTest" && state.openDrawer !== null}
        key={"rightBatchTest"}
      >
        <TestComponent skillFlowData={skillFlowData} />
      </Drawer> */}
      <Drawer
        getContainer={false}
        forceRender={true}
        rootClassName={"global-drawer const-test-drawer"}
        title="变量管理"
        placement={"left"}
        closable={true}
        width={500}
        destroyOnClose={true}
        onClose={() => {
          dispatch({
            type: actionTypes.TOGGLE_DRAWER,
            drawerName: "globalVariables"
          })
        }}
        open={state.openDrawer === "globalVariables" && state.openDrawer !== null}
        mask={false}
        key={"left"}
        bodyStyle={{ padding: 0 }}
      >
        {state.openDrawer === "globalVariables" && state.openDrawer !== null && (
          <GlobalVariableTable
            visible={state.openDrawer === "globalVariables" && state.openDrawer !== null}
          />
        )}
      </Drawer>

      <Drawer
        getContainer={false}
        forceRender={true}
        rootClassName={"global-drawer"}
        title="历史记录"
        placement={"left"}
        closable={true}
        width={1000}
        onClose={() => {
          dispatch({
            type: actionTypes.TOGGLE_DRAWER,
            drawerName: "historyRecord"
          })
        }}
        open={state.openDrawer === "historyRecord" && state.openDrawer !== null}
        key={"left-history"}
      >
        <HistoryTable
          botNo={botNo}
          studioenv={studioenv}
          isPublishDisabled={isPublishDisabled}
          isLocked={isLocked}
          onClose={() => {
            dispatch({
              type: actionTypes.TOGGLE_DRAWER,
              drawerName: "historyRecord"
            })
          }}
        />
      </Drawer>

      <Drawer
        getContainer={false}
        destroyOnClose={true}
        disabled={isLocked || isPublishDisabled}
        rootClassName={"form-input-wrapper"}
        title="表单输入项"
        width={600}
        placement={"left"}
        closable={true}
        onClose={() => {
          dispatch({
            type: actionTypes.TOGGLE_DRAWER,
            drawerName: "formInput"
          })
        }}
        open={state.openDrawer === "formInput" && state.openDrawer !== null}
        key={"left-2"}
        extra={
          <Space>
            <Button
              onClick={() => {
                dispatch({
                  type: actionTypes.TOGGLE_DRAWER,
                  drawerName: "formInput"
                })
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => {
                // @ts-ignore
                formInputRef.current?.onFinish()
              }}
            >
              保存
            </Button>
          </Space>
        }
      >
        <FormInput
          ref={formInputRef}
          // @ts-ignore
          save={save}
          targetData={globalData}
          onClose={() => {
            dispatch({
              type: actionTypes.TOGGLE_DRAWER,
              drawerName: "formInput"
            })
          }}
        />
      </Drawer>

      <SkillModal
        visible={state.openDrawer === "skillModal" && state.openDrawer !== null}
        skillNo={currentSkillProcessData?.skillNo}
        botNo={botNo}
        initialValues={{
          ...currentSkillProcessData,
          skillName: currentSkillProcessData?.skillName,
          description: currentSkillProcessData?.description,
          type: currentSkillProcessData?.type
        }}
        onClose={() => {
          dispatch({
            type: actionTypes.TOGGLE_DRAWER,
            drawerName: "skillModal"
          })
        }}
      />
      {contextHolder}
    </>
  )
}

export default ToolbarWithDrawers
