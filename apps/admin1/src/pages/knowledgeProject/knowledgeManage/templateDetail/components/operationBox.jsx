import { Button } from "antd"
import { ProductOutlined } from "@ant-design/icons"
import styles from "./index.module.scss"

export const OPTION_TYPE = {
  BIND: "bind",
  UNBIND: "unbind",
  MOVE: "move"
}

const OperationBox = ({ optionType, onChangeOptionType, pendingRequestSync }) => {
  return (
    <div className={styles["operation-box"]}>
      <Button
        className={styles["orange"]}
        type="primary"
        disabled={(optionType && optionType !== OPTION_TYPE.BIND) || pendingRequestSync}
        onClick={() => onChangeOptionType(OPTION_TYPE.BIND)}
      >
        绑定
      </Button>
      <Button
        className={styles["processing"]}
        type="primary"
        disabled={(optionType && optionType !== OPTION_TYPE.UNBIND) || pendingRequestSync}
        onClick={() => onChangeOptionType(OPTION_TYPE.UNBIND)}
      >
        解绑
      </Button>
      <Button
        className={`${styles["cyan"]} template-move-btn`}
        type="primary"
        disabled={(optionType && optionType !== OPTION_TYPE.MOVE) || pendingRequestSync}
        onClick={() => onChangeOptionType(OPTION_TYPE.MOVE)}
      >
        移动
      </Button>
      <ProductOutlined />
    </div>
  )
}

export default OperationBox
