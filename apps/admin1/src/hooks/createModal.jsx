import { useState } from "react"
import ReactDOM from "react-dom/client"
import { ConfigProvider } from "antd"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"

// 创建 Modal 组件的工厂函数
const createModal = (ModalComponent) => {
  const showModal = (props) => {
    const queryClient = new QueryClient()
    const { detail, onOk, onCancel } = props
    const modalContainer = document.createElement("div")
    document.body.appendChild(modalContainer)

    const closeModal = () => {
      ReactDOM.createRoot(modalContainer).unmount()
      modalContainer.remove()
    }

    const ModalWrapper = () => {
      const [visible, setVisible] = useState(true)

      const handleOk = async () => {
        if (onOk) {
          await onOk() // 执行 onOk 回调
        }
        setVisible(false) // 关闭 Modal
        closeModal() // 卸载 Modal
      }

      const handleCancel = () => {
        if (onCancel) onCancel()
        setVisible(false) // 关闭 Modal
        closeModal() // 卸载 Modal
      }

      return (
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#7F56D9" // 设置主题色
            }
          }}
        >
          <ModalComponent
            onOk={handleOk}
            onCancel={handleCancel}
            visible={visible}
            detail={detail}
          />
        </ConfigProvider>
      )
    }

    ReactDOM.createRoot(modalContainer).render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ModalWrapper key={Date.now()} />
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return showModal
}

export default createModal
