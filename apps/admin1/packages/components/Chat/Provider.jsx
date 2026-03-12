import { ConfigProvider } from "antd"
import Chat from "./main.jsx"
import { Global } from "@emotion/react"
import GlobalAntdStyles from "./antd-styles"
const ChatProvider = () => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#5D5FEF"
      }
    }}
  >
    <Global styles={GlobalAntdStyles} />
    <Chat />
  </ConfigProvider>
)

export default ChatProvider
