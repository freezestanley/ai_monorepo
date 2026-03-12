import { Tree, Typography, Spin, Segmented, Tooltip, message } from "antd"
import { useState, useEffect } from "react"
import dayjs from "dayjs"
import "./CallChain.scss"

function padZero(num, length = 2) {
  return num.toString().padStart(length, "0")
}

function formatDateWithMilliseconds(timestamp, format = "YYYY-MM-DD HH:mm:ss.SSS") {
  const date = new Date(timestamp)

  const replacements = {
    YYYY: date.getFullYear(),
    MM: padZero(date.getMonth() + 1),
    DD: padZero(date.getDate()),
    HH: padZero(date.getHours()),
    mm: padZero(date.getMinutes()),
    ss: padZero(date.getSeconds()),
    SSS: padZero(date.getMilliseconds(), 3)
  }

  // 替换格式字符串中的占位符
  let result = format
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(key, value)
  }

  return result
}

const StepConnector = ({
  steps,
  activeStep = 0,
  direction = "horizontal",
  nodeStyle = {},
  lineStyle = {},
  nodeTextStyle = {},
  lineTextStyle = {}
}) => {
  // 判断方向
  const isHorizontal = direction === "horizontal"

  return (
    <div className={`step-connector ${isHorizontal ? "horizontal" : "vertical"}`}>
      {steps.map((step, index) => (
        <div key={index} className={`step-item ${index <= activeStep ? "active" : ""}`}>
          {/* 节点 */}
          <div
            className="step-node"
            style={{
              ...nodeStyle,
              ...(step.nodeStyle || {})
            }}
          >
            {/* 节点内容 */}
            {step.icon}

            {/* 节点文字 */}
            {step.text && (
              <div
                className={`node-text ${step.textPosition || "bottom"}`}
                style={{
                  ...nodeTextStyle,
                  ...(step.textStyle || {})
                }}
              >
                {step.text}
              </div>
            )}
          </div>

          {/* 连接线 (除了最后一个节点) */}
          {index < steps.length - 1 && (
            <div
              className="step-line"
              style={{
                ...lineStyle,
                ...(steps[index].lineStyle || {})
              }}
            >
              {/* 线上文字 */}
              {steps[index].lineText && (
                <div
                  className={`line-text ${steps[index].lineTextPosition || "center"}`}
                  style={{
                    ...lineTextStyle,
                    ...(steps[index].lineTextStyle || {})
                  }}
                >
                  {steps[index].lineText}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
export default ({ record, extraSkillInfo }) => {
  const [activeStep, setActiveStep] = useState(5)
  const {
    lxSendRequestTimestamp,
    lxReceiveRequestTimestamp,
    platformPreProcessTime,
    platformPostProcessTime,
    receiveRequestTimestamp,
    sendRequestTimestamp,
    receiveResponseTimestamp,
    sendResponseTimestamp,
    providerProcessTime,
    requestId,
    model
  } = record[0]
  // 步骤配置
  const steps = [
    {
      text: `请求网关 ${formatDateWithMilliseconds(lxSendRequestTimestamp, "mm:ss.SSS")}`,
      textPosition: "bottom", // 文字位置：top, bottom, left, right
      textStyle: { fontSize: "11px" }, // 自定义文字样式
      nodeStyle: {}, // 自定义节点样式
      icon: <span className="lx"></span>,
      lineText: "",
      lineTextPosition: "top", // 线上文字位置：top, bottom, center (水平方向) 或 left, right, center (垂直方向)
      lineTextStyle: { fontSize: "12px", fontWeight: "bold" }, // 自定义线上文字样式
      lineStyle: { height: "2px" } // 自定义线样式
    },
    {
      text: `网关收到 ${formatDateWithMilliseconds(receiveRequestTimestamp, "mm:ss.SSS")}`,
      textPosition: "bottom",
      icon: <span style={{ color: "#fff" }}>W</span>, // 自定义图标
      lineText: `网关预处理时长${platformPreProcessTime || 0}毫秒`,
      lineTextPosition: "top"
    },
    {
      text: `网关请求模型 ${formatDateWithMilliseconds(sendRequestTimestamp, "mm:ss.SSS")}`,
      textPosition: "bottom",
      icon: <span style={{ color: "#fff" }}>L</span>, // 自定义图标
      lineText: `模型处理时长${providerProcessTime || 0}毫秒`,
      lineTextPosition: "top"
    },
    {
      text: `网关收到模型反馈 ${formatDateWithMilliseconds(receiveResponseTimestamp, "mm:ss.SSS")}`,
      textPosition: "bottom",
      icon: <span style={{ color: "#fff" }}>W</span>, // 自定义图标
      lineText: `收到响应处理时长${platformPostProcessTime || 0}毫秒`,
      lineTextPosition: "top"
    },
    {
      text: `发送给灵犀 ${formatDateWithMilliseconds(sendResponseTimestamp, "mm:ss.SSS")}`,
      textPosition: "bottom",
      icon: <span className="lx"></span>,
      lineText: "",
      lineTextPosition: "top"
    },
    {
      text: `灵犀收到 ${formatDateWithMilliseconds(lxReceiveRequestTimestamp, "mm:ss.SSS")}`,
      textPosition: "bottom",
      icon: <span style={{ color: "#fff" }}>E</span>, // 自定义图标
      nodeStyle: { backgroundColor: "rgb(24, 144, 255)" }
    }
  ]

  // 全局样式配置
  const globalConfig = {
    nodeStyle: {
      width: "20px",
      height: "20px",
      borderRadius: "50%"
    },
    lineStyle: {
      height: "2px"
    },
    nodeTextStyle: {
      fontSize: "10px",
      fontWeight: "bold",
      color: "#999"
    },
    lineTextStyle: {
      fontSize: "10px",
      color: "#888"
    }
  }

  return (
    <div className="timeLine-zone">
      <div className="text-[14px] font-[500]">ID: {requestId}</div>
      <div className="text-[12px] font-[500]" style={{ color: "#666" }}>
        时间:{" "}
        {lxSendRequestTimestamp
          ? dayjs(lxSendRequestTimestamp).format("YYYY-MM-DD HH:mm:ss")
          : "-"}{" "}
      </div>
      <div className="text-[12px] font-[500]" style={{ color: "#666" }}>
        模型类型：{model}
      </div>
      <div style={{ padding: "50px 20px", margin: "10px 0 20px" }}>
        <StepConnector
          steps={steps}
          activeStep={activeStep}
          direction="horizontal"
          {...globalConfig}
        />
      </div>
      <div className="text-[14px] font-[500]" style={{ color: "#999" }}>
        {" "}
        单位: 分:秒.毫秒
      </div>
    </div>
  )
}
