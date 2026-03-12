import { DislikeOutlined, LikeOutlined } from "@ant-design/icons"
import { Tag } from "antd"
import { Image } from "antd"
import { Drawer } from "antd"
import FormRender, { useForm, Schema } from "form-render"
import { useEffect } from "react"
import { disLikedSrc, likedSrc } from "./index"

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
    feedbackResult: {
      title: "反馈结果",
      type: "html",
      labelWidth: 100,
      readOnlyWidget: "ResultWidget"
    },
    feedbackSource: {
      title: "反馈来源",
      type: "html",
      labelWidth: 100
    },
    feedbackTag: {
      title: "反馈标签",
      type: "html",
      labelWidth: 100,
      readOnlyWidget: "TagWidget"
    },
    feedbackDescription: {
      title: "反馈描述",
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
      labelWidth: 100,
      readOnlyWidget: "ResponseWidget"
    }
  }
}

const getImgSrc = (context) => {
  const matches = context.match(/<img src="([^"]*)"/)
  return matches?.[1]
}

const ResultWidget = ({ value }) => {
  return <img style={{ width: "20px" }} src={value === 1 ? likedSrc : disLikedSrc} />
}

const ResponseWidget = ({ value }) => {
  const imgSrc = getImgSrc(value)
  return imgSrc ? <Image width={400} src={imgSrc} /> : value
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
        widgets={{ ResultWidget, TagWidget, ResponseWidget }}
      />
    </Drawer>
  )
}
