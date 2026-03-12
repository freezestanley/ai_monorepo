import { Empty } from "antd"
// @ts-ignore
import empty from "@/assets/img/empty.png"

const CustomEmpty = ({ description }) => {
  return description ? (
    <Empty description={description} /> //image={empty}
  ) : (
    <Empty /> //image={empty}
  )
}

export default CustomEmpty
