import { Space, Card, Typography } from "antd"
import { startTransition } from "react"
import { useNavigate } from "react-router-dom"
const Title = Typography.Title

const tools = [
  {
    title: "灵犀markdown渲染预览",
    desc: "管理端和应用端适用",
    link: "/markdown-preview"
  },
  {
    title: "灵犀图表渲染预览",
    desc: "管理端适用，使用开源库mermaid",
    link: "/diagram-preview"
  },
  {
    title: "文件上传",
    desc: "图片上传CDN",
    link: "/tools/upload"
  }
]
function Tools() {
  const navigate = useNavigate()

  const jump = (link) => {
    startTransition(() => {
      navigate(link)
    })
  }
  return (
    <div className=" pl-10 pr-10 pt-10 pb-10">
      <Card
        title={
          <Title level={3} className=" text-center pt-2">
            灵犀工具箱
          </Title>
        }
      >
        <Space size={16}>
          {tools.map((item) => {
            return (
              <Card
                onClick={() => {
                  jump(item.link)
                }}
                key={item.title}
                title={item.title}
                style={{ width: 300 }}
              >
                <p>{item.desc}</p>
              </Card>
            )
          })}
        </Space>
      </Card>
    </div>
  )
}

export default Tools
