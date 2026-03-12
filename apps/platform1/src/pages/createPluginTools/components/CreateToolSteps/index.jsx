import { Steps } from "antd"

function CreateToolSteps({ current }) {
  const items = [
    {
      title: "填写基本信息"
    },
    {
      title: "配置输入参数"
    },
    {
      title: "配置输出参数"
    },
    {
      title: "调试与校验"
    }
  ]
  return <Steps current={current} items={items} />
}

export default CreateToolSteps
