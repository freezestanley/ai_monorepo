/*
 * @Author: Dyton
 * @Date: 2024-05-08 10:00:25
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-28 17:31:51
 * @FilePath: /za-aigc-platform-admin-static/src/components/CodeEditor/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import React, { useCallback, useEffect, useState } from "react"
import CodeMirror, { showDialog, showPanel } from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { indentationMarkers } from "@replit/codemirror-indentation-markers"
import "./index.css"
import LargeEditorModal from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/LargeEditorModal"
import { Tooltip } from "antd"
import Iconfont from "../Icon"
import { andromeda } from "@uiw/codemirror-theme-andromeda"

const extensionsMap = {
  python: [
    python(),
    indentationMarkers({
      hideFirstIndent: false,
      markerType: "fullScope",
      thickness: 1,
      colors: {
        light: "#E8E8E8",
        dark: "#404040",
        activeLight: "#C0C0C0",
        activeDark: "#606060"
      }
    })
  ],
  javascript: [
    javascript({ jsx: true, typescript: true }),
    indentationMarkers({
      hideFirstIndent: false,
      markerType: "fullScope",
      thickness: 1,
      colors: {
        light: "#E8E8E8",
        dark: "#404040",
        activeLight: "#C0C0C0",
        activeDark: "#606060"
      }
    })
  ]
}

export const CodeEditor = ({
  scriptType = "python",
  codeContent = "",
  height = "330px",
  width = "100%",
  placeholder = "请生成代码……",
  editable = true,
  theme = undefined,
  onCodeChange = (v) => {},
  onChange = (v) => {}, //兼容form
  variables = [],
  miniStyle = {},
  miniTitle = "",
  showPanel = true // 展示放大器
}) => {
  const [value, setValue] = useState(codeContent)
  const [isLargeEditorOpen, setLargeEditorOpen] = useState(false)

  const onChangeEvent = useCallback((val, viewUpdate) => {
    setValue(val)
    onCodeChange?.(val)
    onChange?.(val)
    return val
  }, [])

  useEffect(() => {
    setValue(codeContent)
  }, [codeContent])

  const handleLargeEditorSubmit = (newValue) => {
    setValue(newValue)
    onCodeChange?.(newValue)
    onChange?.(newValue)
    setLargeEditorOpen(false)
  }

  return (
    <>
      <div className="code-mirror-util" style={miniStyle.util}>
        {miniTitle && <div>{miniTitle}</div>}
        {showPanel && (
          <Tooltip title="放大编辑框">
            <Iconfont
              type={"icon-a-expand"}
              onClick={() => setLargeEditorOpen(true)}
              className="code-mirror-large-icon"
            />
          </Tooltip>
        )}
      </div>
      <CodeMirror
        className="code-mirror"
        value={value}
        height={height}
        width={width}
        editable={editable}
        placeholder={placeholder}
        extensions={extensionsMap[scriptType]}
        onChange={onChangeEvent}
        style={miniStyle.editor}
        theme={theme && theme === "dark" ? andromeda : undefined}
      />
      <LargeEditorModal
        mode="code"
        scriptType={scriptType}
        disabled={!editable}
        isOpen={isLargeEditorOpen}
        onClose={() => setLargeEditorOpen(false)}
        initialValue={value}
        onSubmit={handleLargeEditorSubmit}
        variables={variables}
      />
    </>
  )
}
