import QueueAnim from "rc-queue-anim"
import { ArrowRight } from "lucide-react"
import classNames from "classnames"
import CopyToClipboard from "react-copy-to-clipboard"
import { Typography, Tag, Space, Tooltip, message } from "antd"
import dayjs from "dayjs"
import { cancelBubble } from "@/utils"
import styles from "../ChooseBotModal/dept.module.scss"

const ResourceCard = ({
  item,
  i,
  onClick,
  className,
  FooterLeftText,
  FooterRight,
  tagColor = "blue"
}) => {
  return (
    <QueueAnim
      delay={50 * i}
      type="top"
      className={classNames(
        "bg-white rounded-[var(--radius-l)] p-6 border border-solid border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden min-h-[280px] flex flex-col queue-simple",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex items-start gap-4">
          <img
            className="w-14 h-14 rounded-[100%] shrink-0 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500"
            src={item.iconUrl}
            alt=""
          />
          <div className="flex-1 min-w-0 pt-1 flex items-start flex-col gap-1 overflow-hidden">
            {!!item.supplierData?.text && (
              <Tag
                className="!bg-[#fafafa] max-w-[80%]"
                color={item.supplierData?.color}
                style={{ margin: 0 }}
              >
                <Typography.Paragraph
                  ellipsis={{ rows: 1, tooltip: item.supplierData?.text }}
                  className="!m-0 text-inherit text-[12px]"
                >
                  {item.supplierData?.text}
                </Typography.Paragraph>
              </Tag>
            )}
            <div className="w-full flex items-center gap-x-2">
              {!!item.bizNo && (
                <CopyToClipboard text={item.bizNo} onCopy={() => message.success("复制成功")}>
                  <Tooltip title={item.bizNo}>
                    <Tag onClick={(e) => cancelBubble(e)} className="!m-0 font-[600] px-[4px]">
                      ID
                    </Tag>
                  </Tooltip>
                </CopyToClipboard>
              )}
              <Typography.Paragraph
                ellipsis={{ rows: 1, tooltip: item.name }}
                className={`!m-0 font-[600] text-slate-800 text-[18px] leading-tight transition-colors flex-1`}
              >
                {item.name ?? "暂无"}
              </Typography.Paragraph>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col items-start h-[92px] bg-gray-50/60 rounded-[var(--radius-m)] py-2 px-4 mb-2 border border-gray-100/20">
            <Typography.Paragraph
              ellipsis={{ rows: 2, tooltip: item.description }}
              className="text-gray-600 !mb-3 font-[14px] flex-1"
            >
              {item.description || "这个人很懒，暂未填写描述～"}
            </Typography.Paragraph>
            <div className="text-[12px] text-gray-300 font-[500] tracking-tight">
              更新时间： {item.gmtModified ? dayjs(item.gmtModified).format("YYYY-MM-DD") : "-"}
            </div>
          </div>
        </div>
      </div>
      {!!item.inputTypes?.length && (
        <Space>
          {item.inputTypes.slice(0, 3).map((type, index) => (
            <Tag bordered={false} key={index} color={tagColor} style={{ margin: 0 }}>
              {type}
            </Tag>
          ))}
          {item.inputTypes.length > 3 && (
            <Tooltip
              title={
                <div className="flex flex-wrap gap-1">
                  {item.inputTypes.slice(3).map((type, index) => (
                    <Tag key={index} variant="solid" color={tagColor} style={{ margin: 0 }}>
                      {type}
                    </Tag>
                  ))}
                </div>
              }
            >
              <Tag bordered={false} color={tagColor} style={{ margin: 0 }}>
                +{item.inputTypes.length - 3}
              </Tag>
            </Tooltip>
          )}
        </Space>
      )}
      <div className="flex pt-4 items-center justify-between">
        <div
          className={`flex items-center gap-2 text-[14px] font-[500] text-gray-400 transition-all`}
        >
          <span>{FooterLeftText}</span>
          <ArrowRight
            size={14}
            className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
          />
        </div>
        {typeof FooterRight === "function" ? FooterRight(item) : FooterRight}
      </div>
    </QueueAnim>
  )
}

export default ResourceCard
