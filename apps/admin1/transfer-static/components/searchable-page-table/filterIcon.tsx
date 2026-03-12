/**
 * 列表的筛选按钮
 */
import { Image } from 'antd'

export const transformedFilters = (data: any) =>
  data?.map((item: any) => ({
    text: item.name,
    value: item.code
  })) ?? []

const filterIcon = () => (
  <Image
    src="https://cdn.zaticdn.com/if/zaip-toolweb-seagull-httpsvr/if/2023-09-08/clmaaoeu600qq2gpef355fwvo_wrapper.png"
    preview={false}
    style={{ width: 16, height: 16 }}
  />
)

export default filterIcon
