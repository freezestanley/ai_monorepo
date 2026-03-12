/*
 * @Author: dyton
 * @Date: 2023-10-17 15:01:39
 * @Descripttion: 文件描述
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-17 16:13:13
 * @FilePath: /za-aigc-platform-admin-static/src/pages/xflow/CustomFlowchartFormPanel/CommonContent.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */

import { Button, message } from "antd"
import "./CommonContent.scss"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import Iconfont from "@/components/Icon"
import { useComponentAndDebugPanel } from "@/store"
import { memo, useEffect } from "react"

const CommonContentOriginal = ({
  style = {},
  title = null,
  extraRenderLeft = () => null,
  extraRender = () => null,
  children = null,
  contentClass = "",
  headerClass = "",
  containerClass = "",
  onCancelButtonClick = () => {}, // 取消按钮点击事件 暂时用不到
  onDebuggerButtonClick = () => {}, // 调试按钮点击事件 暂时用不到
  onFinish = () => {}, // 保存按钮点击事件
  isLoading = false, // 是否正在加载
  disabled = false, // 是否禁用
  showDebuggerButton = true, // 是否显示调试按钮
  showHeaderLine = false // 是否显示头部线条
}) => {
  const headerStyle = {}
  if (showHeaderLine) {
    headerStyle.borderBottom = "1px solid rgba(208, 213, 221, 1)"
  }
  const [_, isQueryDisabled, isPublishDisabled] = useFormDisabled()
  const { changeComponentAndDebugPanel } = useComponentAndDebugPanel((state) => state)

  const handleDebuggerButtonClick = () => {
    changeComponentAndDebugPanel({
      showDebuggerPanel: true,
      width: 1200
    })
    // 点击调试按钮时移除隐藏类，显示调试面板
    const customComponents = document.querySelector(".custom-components")
    if (customComponents) {
      customComponents.classList.remove("hide-debug-panel")
    }
  }

  const handleCloseWrapper = () => {
    changeComponentAndDebugPanel({
      showDebuggerPanel: false,
      open: false
    })
  }

  useEffect(() => {
    if (title) {
      // 每次 title 变化时通过 CSS 类隐藏调试面板，避免样式错乱
      const customComponents = document.querySelector(".custom-components")
      if (customComponents) {
        customComponents.classList.add("hide-debug-panel")
      }
    }
  }, [title])
  return (
    <div className={`common-content ${contentClass}`} style={style}>
      <div className={`common-content-header ${headerClass}`} style={headerStyle}>
        {extraRenderLeft() && <div className="common-content-extra-left">{extraRenderLeft()}</div>}
        <span>{title}</span>
        <div className="common-content-extra">
          {isQueryDisabled
            ? null
            : (extraRender() ?? (
                <HeaderButtons
                  showDebuggerButton={showDebuggerButton}
                  onDebuggerButtonClick={async () => {
                    if (onFinish) {
                      try {
                        await onFinish()
                        handleDebuggerButtonClick()
                      } catch (error) {
                        console.error(error)
                      }
                    } else {
                      handleDebuggerButtonClick()
                    }
                  }}
                  onCancelButtonClick={handleCloseWrapper}
                />
              ))}
        </div>
      </div>
      <div className={`common-content-container ${containerClass}`}>{children}</div>
      <div className="flex justify-end absolute common-content-footer">
        <div className="mr-4">
          <Button type="default" className="btn-cancel" onClick={handleCloseWrapper}>
            取消
          </Button>
        </div>
        <div>
          <Button
            type="primary"
            className="btn-submit"
            htmlType={onFinish ? "button" : "submit"}
            loading={isLoading}
            disabled={disabled || isPublishDisabled}
            onClick={() => {
              onFinish && onFinish()
            }}
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}

export const CommonContent = memo(CommonContentOriginal)

function HeaderButtons({ onDebuggerButtonClick, onCancelButtonClick, showDebuggerButton = true }) {
  return (
    <div className="flex items-center color-[#475467]">
      {showDebuggerButton && (
        <div className="flex items-center mr-4 cursor-pointer" onClick={onDebuggerButtonClick}>
          <Iconfont type="icon-tiaoshi" className="mr-2" />
          <span className="text-[14px]">调试</span>
        </div>
      )}
      <Iconfont type="icon-tuodong-shanchu" onClick={onCancelButtonClick} />
    </div>
  )
}
