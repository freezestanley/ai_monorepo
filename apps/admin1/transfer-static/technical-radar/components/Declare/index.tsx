import { FC, useState, useRef } from "react"
import { HistoryOutlined } from "@ant-design/icons"
import { Button, Popover, Tooltip, message } from "antd"
import DeclareModal from "./DeclareModal"
import DeclareHistory from "./DeclareHistory"
import styles from "./index.module.scss"
import { queryTechnicalDeclaration } from "../../../services/technicalRadar"

const Declare: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 技术申报提交
  const handleSubmit = async (values: any, cb: () => void) => {
    await queryTechnicalDeclaration(values)
    cb && cb()
    message.success("申报提交成功")
    setIsModalOpen(false)
  }

  return (
    <div className={styles.declare} ref={containerRef}>
      <Button type="primary" className={styles.declareBtn} onClick={() => setIsModalOpen(true)}>
        技术申报
      </Button>
      <Popover
        content={<DeclareHistory />}
        placement="rightTop"
        trigger="click"
        classNames={{ root: styles.historyPopover }}
        getPopupContainer={() => containerRef.current || document.body}
        arrow={false}
        destroyOnHidden
      >
        <Tooltip title="申报记录" placement="top" color="#4b5563">
          <div className={styles.historyBtn}>
            <HistoryOutlined />
          </div>
        </Tooltip>
      </Popover>

      <DeclareModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default Declare
