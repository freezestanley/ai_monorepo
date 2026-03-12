import styles from "./KnowledgeBaseWrapperItem.module.scss"
import { Button } from "antd"

const KnowledgeBaseWrapperItem = ({
  title,
  description,
  icon,
  background,
  border,
  onClick,
  isActive,
  rightBtnText,
  rightBtnClick
}) => {
  return (
    <div
      className={`${styles.knowledgeBase} ${isActive ? "" : styles.inactive}`}
      style={{ backgroundColor: background, borderColor: border }}
      onClick={onClick}
    >
      <div className={styles.content}>
        <div className={styles.topContainer}>
          <h3 className="font-bold text-lg">{title}</h3>
          <div className={styles.iconBox}>{icon}</div>
        </div>
        <p style={{ paddingRight: rightBtnText ? 60 : 0 }}>{description}</p>
      </div>
      {rightBtnText && (
        <Button className={styles.rightBtn} type="link" onClick={rightBtnClick}>
          {rightBtnText}
        </Button>
      )}
    </div>
  )
}

export default KnowledgeBaseWrapperItem
