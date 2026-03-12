import classNames from "classnames"
import { Segmented } from "antd"
import { AppstoreOutlined, BarsOutlined } from "@ant-design/icons"
import styles from "./index.module.scss"

const PageSegmented = ({ className, ...props }) => {
  return (
    <Segmented
      options={[
        { value: "card", icon: <AppstoreOutlined /> },
        { value: "list", icon: <BarsOutlined /> }
      ]}
      className={classNames(
        "bg-white border border-solid border-gray-100 rounded-[var(--radius-m)] p-1.5 shadow-sm",
        styles.segmented,
        className
      )}
      {...props}
    />
  )
}

export default PageSegmented
