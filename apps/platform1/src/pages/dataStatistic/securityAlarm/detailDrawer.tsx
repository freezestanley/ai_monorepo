import { DislikeOutlined, LikeOutlined } from "@ant-design/icons"
import { Tag } from "antd"
import { Drawer } from "antd"
import FormRender, { useForm, Schema } from "form-render"
import { useEffect } from "react"

const formSchema: Schema = {
  type: "object",
  displayType: "row",
  column: 1,
  properties: {
    authPermissionGroupName: {
      title: "标签",
      type: "html",
      labelWidth: 100
    },
    botName: {
      title: "空间",
      type: "html",
      labelWidth: 100
    },
    skillName: {
      title: "工作流",
      type: "html",
      labelWidth: 100
    },
    requestUser: {
      title: "请求人",
      type: "html",
      labelWidth: 100
    },
    gmtCreated: {
      title: "时间",
      type: "html",
      labelWidth: 100
    },
    sensitiveWords: {
      title: "命中敏感词",
      type: "html",
      labelWidth: 100
    },
    requestContext: {
      title: "请求内容",
      type: "html",
      labelWidth: 100
    },
    responseContext: {
      title: "返回内容",
      type: "html",
      labelWidth: 100
    }
  }
}

const ResultWidget = ({ value }) => {
  return value === 1 ? (
    <LikeOutlined style={{ color: "blue", fontSize: "14px" }} />
  ) : (
    <DislikeOutlined style={{ color: "red", fontSize: "14px" }} />
  )
}
const TagWidget = ({ value }) => {
  return value ? value.split(",").map((item) => <Tag color="processing">{item}</Tag>) : null
}

export default ({ visible, setVisible, formData = {} }) => {
  const formInstance = useForm()

  useEffect(() => {
    formInstance.setValues(formData)
  }, [formData])

  useEffect(() => {
    if (!visible) {
      formInstance.setValues({})
    }
  }, [visible])

  return (
    <Drawer open={visible} width={800} title="详情" onClose={() => setVisible(false)}>
      <FormRender
        schema={formSchema}
        readOnly
        form={formInstance}
        widgets={{ ResultWidget, TagWidget }}
      />
    </Drawer>
  )
}
