/*
 * @Author: dyton
 * @Date: 2023-10-17 19:14:03
 * @Descripttion: 文件描述
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-19 17:08:48
 * @FilePath: /za-aigc-platform-admin-static/src/pages/xflow/react-node/content.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import React from "react"
import { Button, Tooltip } from "antd"
import { customNodeIcon, customNodesClass } from "../custom-nodes"

import "./content.scss"
import { XflowV2Template } from "../xflowV2/templates"
import { InsertIcon } from "../xflowV2/templates/InsertNode"
import { useState } from "react"

/**
 * @description: 统一节点组件
 * type = circle 弧形
 * type = normal 矩形
 * type = condition 条件
 * @return {*}
 */
export const NodeContent = (props) => {
  const {
    size = { width: 100, height: 33 },
    data,
    theme = "#7F56D9",
    type = "normal",
    originTitle: propsOriginTitle,
    tooltip
  } = props
  const { width, height } = size
  const { label, parentKey, name, originData } = data
  const originTitle = propsOriginTitle || data?.originData?.label

  // const [initData, setInitData] = useState(data)

  const border = { borderColor: theme }
  const getClassName = () => {
    switch (type) {
      case "normal":
        return " custom-node-content"
      case "circle":
        return "custom-node-circle-content"
      case "condition":
        return "custom-node-condition-content"
      default:
        return "custom-node-content"
    }
  }
  /**
   * @description: 兼容历史未分类组件
   * @return {*}
   */
  const getParentKey = () => {
    let compatibilityKey = parentKey
    customNodesClass?.forEach((v) => {
      const { nodes, key } = v
      const match = nodes.map((v) => v?.name).includes(name)
      if (match) compatibilityKey = key
    })
    return compatibilityKey
  }
  const nodeParentKey = getParentKey()
  const hasIcon = nodeParentKey && nodeParentKey !== "CONTROL" && customNodeIcon?.[nodeParentKey]

  return (
    <div
      className={`custom-item ${getClassName()} ${data?.name === "condition-node" && data?.x && data?.y ? "!bg-[#e6e3fc]" : ""}`} // 条件节点加个背景
      style={{
        width,
        height,
        ...border,
        paddingTop: !hasIcon ? "0" : "",
        paddingBottom: !hasIcon ? "0" : "",
        display: data?.originData?.visible === false ? "none" : "flex"
      }}
      onMouseDown={() => {
        // setInitData((p) => {
        //   if (!p.isPressed) {
        //     return {
        //       ...p,
        //       [p?.id]: {
        //         isPressed: "progress"
        //       }
        //     }
        //   }
        // })
        data.isPressed = true
      }}
      onMouseUp={() => {
        data.isPressed = false
        // setInitData((p) => {
        //   return {
        //     ...p,
        //     [p?.id]: {
        //       isPressed: undefined
        //     }
        //   }
        // })
      }}
    >
      {/* {hasIcon && (
        <div className="custom-icon">
          <span style={{ color: theme }}>{customNodeIcon?.[nodeParentKey]}</span>
          <span>{originTitle}</span>
        </div>
      )} */}
      {data.x || data.y ? (
        <Tooltip
          placement="right"
          title={`${label}${originData?.label !== label ? `（${originData?.label}）` : ""}`}
        >
          <span className="custom-node-label truncate overflow-hidden whitespace-nowrap ">
            <div className="flex justify-start items-center h-[35px]">
              <img
                className="w-[24px] h-[24px] align-middle mr-[4px] mt-[4px]"
                src={InsertIcon(data)}
                alt={label}
              />
              <div>
                {originData?.label !== label && (
                  <div className="text-[#475467] text-[12px] mt-[5px]">{originData?.label}</div>
                )}
                <div
                  className={`truncate overflow-hidden whitespace-nowrap w-[180px] ${originData?.label !== label ? "" : "mt-[8px]"}`}
                >
                  {label}
                </div>
              </div>
            </div>
          </span>
        </Tooltip>
      ) : (
        <span className="custom-node-label !flex items-center">
          {label}
          {tooltip}
        </span>
      )}
      {/* xflowV改版 */}
      <XflowV2Template data={data} />
    </div>
  )
}
