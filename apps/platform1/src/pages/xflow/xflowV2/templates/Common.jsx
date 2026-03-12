// 输入类型
import { Tooltip } from "antd"
import { Fragment } from "react"

export const CommonNode = (props) => {
  const { topDescription, subDescription, maxTopLines = 1, maxSubLines = 1 } = props

  // 处理 title，支持函数式和字符串
  const renderTitle = (titleValue) => {
    if (typeof titleValue === "function") {
      return titleValue()
    }
    return titleValue
  }

  const renderTopDescription = (item) => {
    return (
      <div className="flex items-center justify-between w-[100%] mt-[2px]">
        {item?.description && (
          <Tooltip
            title={
              item?.descriptionTooltipText ? item?.descriptionTooltipText() : item?.description()
            }
            placement="right"
          >
            <div
              className={`text-[#0E121B] font-[400] flex-1 text-[12px] overflow-hidden ${
                maxTopLines === 1
                  ? "text-ellipsis whitespace-nowrap"
                  : `line-clamp-${maxTopLines} display-webkit-box webkit-line-clamp-${maxTopLines} webkit-box-orient-vertical`
              }`}
            >
              {item?.description()}
            </div>
          </Tooltip>
        )}
        {item?.extraDescriptionRender && item?.extraDescriptionRender()}
      </div>
    )
  }

  // console.log("topDescription", topDescription?.description())
  return (
    <>
      <div
        className={`${topDescription?.descriptionList ? "h-[84px] overflow-auto" : "h-[44px]"} w-[100%] bg-[#F5F7FA] rounded-[4px] p-[4px]`}
      >
        <div className="text-[#525866] text-[12px] font-[400]">
          {renderTitle(topDescription?.title) || "未知组件"}
        </div>
        {!!topDescription?.descriptionList?.length &&
          topDescription.descriptionList.map((item, index) => {
            return <Fragment key={index}>{renderTopDescription(item)}</Fragment>
          })}
        {renderTopDescription(topDescription)}
      </div>

      {subDescription && (
        <div
          className={`${maxSubLines >= 10 ? "h-[206px]  overflow-auto" : "h-[44px]"} w-[100%] bg-[#F5F7FA] rounded-[4px] p-[4px] -mt-[10px]`}
        >
          <div className="text-[#525866] text-[12px] font-[400]">
            {renderTitle(subDescription?.title) || "未知组件"}
          </div>
          {topDescription?.description && (
            <Tooltip title={subDescription?.description()} placement="right">
              <div
                className={`text-[#0E121B] font-[400] w-[100%] text-[12px] overflow-hidden mt-[2px] ${
                  maxSubLines === 1
                    ? "text-ellipsis whitespace-nowrap"
                    : `line-clamp-${maxSubLines} display-webkit-box webkit-line-clamp-${maxSubLines} webkit-box-orient-vertical`
                }`}
              >
                {subDescription?.description()}
              </div>
            </Tooltip>
          )}
        </div>
      )}
    </>
  )
}
