import { useState, useEffect } from "react"
import { Modal, Progress } from "antd"
import styles from "./index.module.less"

const PublishProgressModal = ({ visible, isCompleted }) => {
  const [progress, setProgress] = useState(0)

  // 假进度逻辑
  useEffect(() => {
    if (!visible) {
      setProgress(0)
      return
    }
    const timer = setInterval(() => {
      setProgress((prev) => {
        // 如果已经收到完成信号且进度>=95%，快速完成到100%
        if (isCompleted && prev >= 95) {
          return Math.min(100, prev + 5)
        }
        // 正常的假进度增长
        if (prev < 30) {
          // 0-30%: 快速增长，给用户"启动"的感觉
          return prev + Math.random() * 5 + 2
        } else if (prev < 70) {
          // 30-70%: 中等速度
          return prev + Math.random() * 2 + 0.5
        } else if (prev < 90) {
          // 70-90%: 慢一点
          return prev + Math.random() * 1 + 0.2
        } else if (prev < 95) {
          // 90-95%: 很慢
          return prev + Math.random() * 0.3 + 0.1
        } else {
          // 95%以上：几乎不动，等待完成信号
          // 偶尔微微增长一点点，让用户觉得还在工作
          return prev + Math.random() * 0.1
        }
      })
    }, 300) // 稍微慢一点，300ms更新一次
    return () => clearInterval(timer)
  }, [visible, isCompleted])

  return (
    <Modal
      className={styles.modal}
      open={visible}
      closable={false}
      footer={null}
      centered
      maskClosable={false}
      width={400}
      styles={{
        mask: { backgroundColor: "rgba(0, 0, 0, 0.8)" }
      }}
    >
      <h1>正在准备配套发布环境，请稍等...</h1>
      <Progress
        percent={Math.floor(progress)}
        status={progress >= 100 ? "success" : "active"}
        strokeColor={{
          "0%": "#7F56D9",
          "100%": "#7F56D9"
        }}
        trailColor="#E4E7EC"
        size={["100%", 6]}
        showInfo={false}
      />
    </Modal>
  )
}

export default PublishProgressModal
