import { useEffect, useMemo, useState } from "react"
import { Search, Check } from "lucide-react"
import { Input, Modal, Col, Row, Typography, Tag } from "antd"
import classNames from "classnames"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import useBots from "@/hooks/useBots"
import styles from "./index.module.scss"

const ChooseBotModal = ({ open, onClose, onOk }) => {
  const { botsListInfo } = useBots()
  const [currentBot, setCurrentBot] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeName, setActiveName] = useState("")
  const [loading, setLoading] = useState(false)

  const botList = useMemo(() => {
    return botsListInfo?.botList?.filter(
      (item) =>
        item.botName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) &&
        (!activeName ? true : activeName === item.deptName)
    )
  }, [botsListInfo, searchTerm, activeName])

  const depsNames = useMemo(() => {
    const list = new Set()
    botsListInfo?.botList?.forEach((item) => {
      item.deptName && list.add(item.deptName)
    })
    return [
      { label: "全部", value: "" },
      ...[...list].map((item) => ({ label: item, value: item }))
    ]
  }, [botsListInfo, searchTerm])

  useEffect(() => {
    if (!open) {
      setSearchTerm("")
      setCurrentBot(null)
    }
  }, [open])

  const onSubmit = async () => {
    try {
      setLoading(true)
      await onOk?.(currentBot)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="选择空间"
      open={open}
      onCancel={() => onClose()}
      className={classNames("max-w-4xl", styles.chooseBotModal)}
      width={"100%"}
      okButtonProps={{
        disabled: !currentBot,
        loading
      }}
      onOk={onSubmit}
    >
      <div className="px-4 py-4 bg-gray-50/50 border-0 border-b border-solid border-gray-100 space-y-5 shrink-0">
        <Input
          placeholder="输入搜索空间名称"
          className="w-full !px-4 !py-3.5 rounded-2xl !text-sm !font-bold text-slate-700 ring-purple-50"
          prefix={<Search className="text-gray-400 mr-[5px]" size={20} />}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {depsNames.map((item) => (
            <div
              key={item.value}
              onClick={() => setActiveName(item.value)}
              className={`px-4 cursor-pointer py-1.5 rounded-xl text-xs font-black transition-all ${
                activeName === item.value
                  ? "bg-[var(--primary-color)] text-white shadow-lg shadow-purple-500/20"
                  : "bg-white text-slate-500 border border-solid border-gray-100 hover:border-[var(--primary-color)] hover:bg-gray-50"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
      {botList?.length ? (
        <Row
          gutter={[24, 20]}
          className="px-[10px] max-h-[45vh] overflow-y-auto scrollbar-hide mt-6 pt-2"
        >
          {botList?.map((item) => {
            const isSelected = currentBot?.botNo === item.botNo
            return (
              <Col
                span={8}
                key={item.botNo}
                onClick={() => {
                  setCurrentBot(item)
                }}
              >
                <div
                  className={`group p-5 rounded-[24px] border border-solid cursor-pointer transition-all hover:shadow-xl ${
                    isSelected
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-1 ring-[var(--primary-color)]"
                      : "border-gray-100 bg-white hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)]/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      className="w-12 h-12 rounded-[100%] shadow-md transform group-hover:scale-110 transition-transform"
                      src={item.botIcon}
                      alt=""
                    />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <Typography.Paragraph
                          className={`!m-0 text-sm font-black truncate leading-tight ${
                            isSelected ? "text-[var(--primary-color)]" : "text-slate-800"
                          }`}
                          ellipsis={{ rows: 1, tooltip: item.botName }}
                        >
                          {item.botName}
                        </Typography.Paragraph>
                        {isSelected && (
                          <Check size={16} className="text-[var(--primary-color)] shrink-0 ml-2" />
                        )}
                      </div>
                      {!!item?.deptName && <Tag className={item?.deptColor}>{item?.deptName}</Tag>}
                    </div>
                  </div>
                </div>
              </Col>
            )
          })}
        </Row>
      ) : (
        <div className="m-8">
          <CustomEmpty description={"未找到相关业务空间"} />
        </div>
      )}
    </Modal>
  )
}

export default ChooseBotModal
