import Xflow from "@/pages/xflow"
import "./home.scss"
import { useEffect } from "react"

function Home() {
  // useEffect(() => {
  //   // 向父窗口发送消息 - 页面加载时发送 true
  //   if (window.parent !== window) {
  //     window.parent.postMessage(
  //       {
  //         type: "skill-edit-ready",
  //         data: {
  //           status: true
  //         }
  //       },
  //       "*"
  //     )
  //   }

  //   // 组件卸载时发送 false
  //   return () => {
  //     if (window.parent !== window) {
  //       window.parent.postMessage(
  //         {
  //           type: "skill-edit-ready",
  //           data: {
  //             status: false
  //           }
  //         },
  //         "*"
  //       )
  //     }
  //   }
  // }, [])

  return (
    <div className="home-wrapper">
      <Xflow />
    </div>
  )
}

export default Home
