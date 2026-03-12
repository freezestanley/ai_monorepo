import { Form, Button, Spin, Tooltip, Popover, Table } from "antd"
import { useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useState } from "react"
import DynamicFormItem from "@/components/DynamicFormItem"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import "./index.scss"
import { useDebugHandler } from "../hooks/useDebugHandler"
import { useCell } from "@/pages/xflow/hooks/useCell"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import React from "react"
import JSONValidator from "@/components/JSONValidator"
import {
  useComponentAndDebugPanel,
  useCurrentSkillLockInfo,
  useHistoryDebugData
} from "@/store/index"
import UseDebugHistory from "@/pages/xflow/hooks/useDebugHistory"
import { useDebugAIGeneratingSkill } from "@/api/AICreate"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import "./../../CommonContent.scss"
import Iconfont from "@/components/Icon"
import TopDownButton from "@/components/TopDownButton"
import { InfoIcon } from "@/components/FormIcon"

const DynamicFormComponent = (
  {
    formData = [],
    preview,
    nodeId,
    isProcess,
    isJSONDebug = false,
    onFinish: save,
    skillFlowData = {},
    isAICreate = false,
    forceShowDebugButton = false,
    forceShowPanel = false,
    onClose = null,
    className = ""
  },
  ref
) => {
  const [form] = Form.useForm()
  const loadingRef = useRef(null)
  const { skillNo } = skillFlowData
  const [_, isQueryDisabled] = useFormDisabled()
  const [isUploading, setIsUploading] = useState(false)
  const JsonValidatorRef = useRef(null)

  const { debugContent, handleDebug, setDebugContent, loading } = useDebugHandler(nodeId)
  const { mutate: debugAIGeneratingSkill } = useDebugAIGeneratingSkill()
  const queryClient = useQueryClient()

  const { componentNo } = useCell(nodeId)
  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)

  const { componentAndDebugPanel, changeComponentAndDebugPanel } = useComponentAndDebugPanel(
    (state) => state
  )
  const showDebuggerPanel = useMemo(() => {
    return componentAndDebugPanel.showDebuggerPanel || forceShowPanel
  }, [componentAndDebugPanel, forceShowPanel])

  const setFormData = (formData) => {
    form.setFieldsValue(formData)
    JsonValidatorRef.current?.handleInputChange?.(
      formData?.[isProcess ? "$apiInputParam" : "$webHookParams"]
    )
  }

  const skillNoOrComponentNo = skillNo || nodeId
  const { setDebugData, debugData } = useHistoryDebugData((state) => state)
  const { DebugPopoverButton } = UseDebugHistory({
    skillNo: skillNoOrComponentNo,
    setFormData
  })

  useImperativeHandle(ref, () => ({
    setFormData
  }))

  // 根据 variableValueType 转换值格式的函数
  const transformValuesByType = (values, formData) => {
    const transformedValues = { ...values }

    formData.forEach((item) => {
      const { attributeName, variableValueType = "string" } = item
      const value = transformedValues[attributeName]

      // 只处理非空值
      if (value !== undefined && value !== null && value !== "") {
        switch (variableValueType) {
          case "boolean":
            if (typeof value === "string") {
              transformedValues[attributeName] = value.toLowerCase() === "true"
            } else if (typeof value === "boolean") {
              transformedValues[attributeName] = value
            }
            break
          case "int":
            transformedValues[attributeName] = parseInt(value, 10)
            break
          case "float":
            transformedValues[attributeName] = parseFloat(value)
            break
          case "json":
            if (typeof value === "string") {
              try {
                transformedValues[attributeName] = JSON.parse(value)
              } catch {
                // 如果解析失败，保持原值
              }
            }
            break
          case "array":
            if (typeof value === "string") {
              try {
                const parsed = JSON.parse(value)
                if (Array.isArray(parsed)) {
                  transformedValues[attributeName] = parsed
                }
              } catch {
                // 如果解析失败，保持原值
              }
            }
            break
          default:
            // string 类型或其他类型保持原值
            break
        }
      }
    })

    return transformedValues
  }

  const onFinish = async () => {
    setDebugContent("")

    form.validateFields().then((values) => {
      try {
        if (save) {
          save((AICreateParams = {}) => {
            if (isAICreate) {
              let params = {}
              try {
                params = JSON.parse(values["$apiInputParam"])
              } catch (error) {
                console.log("error:", error)
              }

              debugAIGeneratingSkill(
                { ...params, ...AICreateParams },
                {
                  onSuccess: (e) => {
                    if (e.success === true) {
                      setDebugContent(`${e.data?.log}`)
                    } else {
                      setDebugContent(e?.message)
                    }
                    queryClient.invalidateQueries([QUERY_KEYS.LATEST_DEFINITION])
                  }
                }
              )
            } else {
              //attributeName
              const transformedValues = transformValuesByType(values, formData)
              const hasValidValues =
                transformedValues &&
                Object.keys(transformedValues).some(
                  (key) => key && transformedValues[key] !== undefined
                )

              handleDebug(hasValidValues ? transformedValues : {})
            }
          }, true)
        } else {
          //attributeName
          const transformedValues = transformValuesByType(values, formData)
          const hasValidValues =
            transformedValues &&
            Object.keys(transformedValues).some(
              (key) => key && transformedValues[key] !== undefined
            )
          handleDebug(hasValidValues ? transformedValues : {})
        }
      } catch (error) {
        console.log("Validate failed:", error)
      } finally {
        const theSaveData = {
          ...values,
          __time: new Date().getTime()
        }
        const historyData = debugData
        // 如果还没有任何数据，那么直接写进去
        if (!historyData[skillNoOrComponentNo]) {
          setDebugData({ [skillNoOrComponentNo]: [theSaveData] })
        } else {
          if (historyData[skillNoOrComponentNo].length > 4) {
            historyData[skillNoOrComponentNo].pop()
          }
          historyData[skillNoOrComponentNo].unshift(theSaveData)
          setDebugData({
            [skillNoOrComponentNo]: historyData[skillNoOrComponentNo]
          })
        }
      }
    })
  }

  useEffect(() => {
    if (loadingRef.current) {
      loadingRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [debugContent])

  const show =
    (formData && formData.filter((item) => item.controlType)?.length !== 0) || forceShowDebugButton

  if (!showDebuggerPanel) {
    return null
  }

  const closeDebugPanel = () => {
    if (onClose) {
      onClose()
    } else {
      changeComponentAndDebugPanel({
        ...componentAndDebugPanel,
        showDebugPanel: false,
        width: 600
      })
    }
  }

  const formContainerStyle = {}
  const commonContentStyle = {}
  if (preview) {
    formContainerStyle.height = "auto"
    formContainerStyle.padding = 0
    commonContentStyle.width = "100%"
    commonContentStyle.paddingTop = 0
  }

  // 创建基于 variableValueType 的验证规则
  const createValidationRules = (required, variableValueType) => {
    const rules = [
      {
        required: required,
        message: "请完成必填项"
      }
    ]

    // 根据 variableValueType 添加对应的验证规则
    if (variableValueType && variableValueType !== "string") {
      switch (variableValueType) {
        case "boolean":
          rules.push({
            validator: (_, value) => {
              if (value === undefined || value === null || value === "") {
                return Promise.resolve()
              }
              const strValue = String(value).toLowerCase()
              if (strValue === "true" || strValue === "false" || typeof value === "boolean") {
                return Promise.resolve()
              }
              return Promise.reject(new Error("请输入有效的布尔值 (true/false)"))
            }
          })
          break
        case "int":
          rules.push({
            validator: (_, value) => {
              if (value === undefined || value === null || value === "") {
                return Promise.resolve()
              }
              const numValue = Number(value)
              if (Number.isInteger(numValue) && !isNaN(numValue)) {
                return Promise.resolve()
              }
              return Promise.reject(new Error("请输入有效的整数"))
            }
          })
          break
        case "float":
          rules.push({
            validator: (_, value) => {
              if (value === undefined || value === null || value === "") {
                return Promise.resolve()
              }
              const numValue = Number(value)
              if (!isNaN(numValue) && isFinite(numValue)) {
                return Promise.resolve()
              }
              return Promise.reject(new Error("请输入有效的浮点数"))
            }
          })
          break
        case "json":
          rules.push({
            validator: (_, value) => {
              if (value === undefined || value === null || value === "") {
                return Promise.resolve()
              }
              try {
                const parsed = JSON.parse(value)
                // JSON类型不应该是数组
                if (Array.isArray(parsed)) {
                  return Promise.reject(new Error("请输入有效的JSON对象格式，不能是数组"))
                }
                return Promise.resolve()
              } catch {
                return Promise.reject(new Error("请输入有效的JSON格式"))
              }
            }
          })
          break
        case "array":
          rules.push({
            validator: (_, value) => {
              if (value === undefined || value === null || value === "") {
                return Promise.resolve()
              }
              try {
                const parsed = JSON.parse(value)
                if (Array.isArray(parsed)) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error("请输入有效的数组格式"))
              } catch {
                return Promise.reject(new Error("请输入有效的数组格式"))
              }
            }
          })
          break
      }
    }

    return rules
  }

  return (
    <div className={`common-content ${className}`} style={commonContentStyle}>
      {!skillNo && componentNo ? (
        <div className={`common-content-header`} style={{ borderBottom: "1px solid #E5E7EB" }}>
          <span>组件调试</span>
          <div className="common-content-extra color-[#475467]">
            <DebugPopoverButton />
            <Iconfont type="icon-tuodong-shanchu" className="ml-4" onClick={closeDebugPanel} />
          </div>
        </div>
      ) : (
        isProcess && (
          <div className={`common-content-header`} style={{ borderBottom: "1px solid #E5E7EB" }}>
            <span>流程调试</span>
            <div className="common-content-extra">
              <DebugPopoverButton />
              <Iconfont type="icon-tuodong-shanchu" className="ml-4" onClick={closeDebugPanel} />
            </div>
          </div>
        )
      )}

      <div
        className="dynamicFormComponent-wrapper common-content-container"
        style={formContainerStyle}
      >
        <Form
          onFinish={onFinish}
          form={form}
          disabled={isQueryDisabled}
          layout="vertical"
          labelCol={{ span: 24 }}
        >
          {show &&
            !isJSONDebug &&
            formData.map((item) => {
              const {
                controlType,
                attributeName,
                title,
                tip,
                placeholder,
                options,
                required = false,
                variableValueType = "string"
              } = item

              return (
                <Form.Item
                  rules={createValidationRules(required, variableValueType)}
                  className="dynamicFormComponent-item"
                  key={attributeName}
                  name={attributeName}
                  tooltip={
                    tip
                      ? {
                          icon: <InfoIcon />,
                          title: tip
                        }
                      : ""
                  }
                  label={
                    <Tooltip placement="left" title={title}>
                      {title}
                    </Tooltip>
                  }
                  initialValue={controlType === "switch" ? false : undefined}
                >
                  <DynamicFormItem
                    name={attributeName}
                    controlType={controlType}
                    placeholder={placeholder}
                    options={options}
                    onUploadStatusChange={setIsUploading}
                  />
                </Form.Item>
              )
            })}

          {isJSONDebug && (
            <Form.Item
              name={isProcess ? "$apiInputParam" : "$webHookParams"}
              rules={[
                {
                  required: true,
                  message: "请完成必填项"
                }
              ]}
              initialValue="{}"
            >
              <JSONValidator ref={JsonValidatorRef} />
            </Form.Item>
          )}

          <div
            className="debug-content-wrapper"
            style={
              {
                // maxHeight: !isProcess && 600
              }
            }
          >
            <MarkdownRenderer content={debugContent} />
            {loading && (
              <div
                style={{
                  margin: "20px auto",
                  display: "flex",
                  justifyContent: "center"
                }}
              >
                <Spin tip="正在玩命加载中……" spinning={loading} />
              </div>
            )}
            <div ref={loadingRef} />
          </div>
        </Form>

        {!preview && (
          <div className="flex justify-end absolute common-content-footer">
            <div className="mr-4">
              <Button type="default" className="btn-cancel" onClick={closeDebugPanel}>
                取消
              </Button>
            </div>
            <div>
              {isJSONDebug && (
                <Button
                  type="primary"
                  onClick={onFinish}
                  loading={loading}
                  disabled={(!componentNo && !isProcess) || isLocked || isUploading}
                >
                  调试
                </Button>
              )}
              {/* show && !preview && !isJSONDebug */}
              {!preview && !isJSONDebug && (
                <Button
                  type="primary"
                  onClick={onFinish}
                  loading={loading}
                  disabled={(!componentNo && !isProcess) || isLocked || isUploading}
                >
                  调试
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <TopDownButton
        target={document.querySelector(".dynamicFormComponent-wrapper.common-content-container")}
      />
    </div>
  )
}
const DynamicForm = forwardRef(DynamicFormComponent)

export default React.memo(DynamicForm)
