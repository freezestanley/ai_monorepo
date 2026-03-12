import React from "react"
import { Skeleton } from "antd"

/**
 * 加载占位符组件
 * @param {string} title - 加载提示文本，默认为"火焰图正在准备中..."
 * @param {boolean} showIcon - 是否显示图标，默认为 true
 */
const LoadingPlaceholder = ({ title = "火焰图正在准备中...", showIcon = true }) => {
  return (
    <div className="flex justify-center items-center h-full mt-[25px]">
      <div className="flex flex-col items-center justify-center p-2 text-gray-500 w-full">
        <div className="flex justify-start w-full gap-3">
          {showIcon && (
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="49" height="48" fill="none">
                <path
                  fill="#000"
                  fillOpacity=".3"
                  d="M38.5 30h-4v2h10v12h-40V32h10v-2h-4v-2h28v2Zm-32 12h36v-8h-36v8Zm8-2h-4v-4h4v4Zm24-2h-10v-2h10v2Zm-22-6h16v-2h-16v2Zm-6-4h-2V6h2v22Zm30 0h-2V6h2v22Zm-4-2h-24V8h24v18Zm-22-2h20V10h-20v14Zm14-2h-8v-2h8v2Zm-8-2h-2v-2h2v2Zm10 0h-2v-2h2v2Zm-4-2h-4v-2h2v-3h2v5Zm-6-4h-2v-2h2v2Zm10 0h-2v-2h2v2Zm8-8h-28V4h28v2Z"
                />
              </svg>
            </div>
          )}
          <Skeleton active />
        </div>

        <div className="mt-4">{title}</div>
      </div>
    </div>
  )
}

export default LoadingPlaceholder
