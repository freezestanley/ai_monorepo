import styles from "./index.module.less"

const HeaderTitle = ({ title, icon, rightContent }) => {
  return (
    <div className={styles.headerTitle}>
      <div className="flex items-center">
        <div className={styles.icon}>{icon}</div>
        <h1 className="text-[#181B25] text-[16px] font-[500]">{title}</h1>
      </div>
      {rightContent}
    </div>
  )
}

export default HeaderTitle
