import { useState } from "react"
import { Button, Form, Input, Row, Col, ConfigProvider } from "antd"
import queryString from "query-string"
import PluginEditModal from "@/components/PluginEditModal"
import { useLocation, useNavigate } from "react-router-dom"
import { getThemeConfig } from "@/constants/market"
import { usePlginsManage } from "../.."
import styles from "./index.module.scss"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

export const SearchForm = () => {
  const [filterForm] = Form.useForm()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const [pluginModalVisible, setPluginModalVisible] = useState(false)
  const { setSearchKey } = usePlginsManage()
  const { isPublishDisabled } = useStudioPublishData()

  const handlerSearch = (e) => {
    setSearchKey(e.target.value)
  }
  const handleCreate = () => {
    setPluginModalVisible(true)
  }
  // 获取统一样式
  const { color, hover, icon, title, border } = getThemeConfig("PLUG_IN")
  const theme = {
    components: {
      Button: {
        colorPrimary: color,
        defaultBorderColor: color,
        defaultColor: color,
        colorPrimaryHover: hover,
        colorPrimaryActive: hover
      },
      Switch: {
        colorPrimary: color,
        colorPrimaryHover: hover
      }
    }
  }

  return (
    <div className={`-mt-[16px] pt-[20px]`}>
      <Form form={filterForm} layout="horizontal" className=" h-[36px]">
        <Row gutter={24} justify="space-between">
          <Col span={6}>
            <Button
              type="primary"
              onClick={handleCreate}
              className="w-[84px] h-[36px]"
              disabled={isPublishDisabled}
            >
              <i className="iconfont icon-chuangjian mt-[2px]"></i>
              创建
            </Button>
          </Col>
          <Col span={6} className="flex justify-end">
            <Form.Item
              name="query"
              rules={[{ required: false, message: "搜索搜索工具" }]}
              className="h-[36px]"
            >
              <Input
                placeholder="搜索工具"
                allowClear
                className="h-[36px] w-[248px]"
                onPressEnter={(e) => handlerSearch(e)}
                suffix={<i className="iconfont icon-sousuo1 text-[#98A2B3]"></i>}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <PluginEditModal
        visible={pluginModalVisible}
        mode="add"
        botNo={botNo}
        onClose={() => {
          setPluginModalVisible(false)
        }}
        onSuccess={() => {
          setPluginModalVisible(false)
        }}
      />
    </div>
  )
}
