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
    sessionId: {
      title: "回话ID",
      type: "html",
      labelWidth: 100
    },
    requestId: {
      title: "请求ID",
      type: "html",
      labelWidth: 100
    },
    traceId: {
      title: "调用链ID",
      type: "html",
      labelWidth: 100
    },
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
    skillVersionName: {
      title: "版本",
      type: "html",
      labelWidth: 100
    },

    modelType: {
      title: "模型",
      type: "html",
      labelWidth: 100
    },
    sensitiveWords: {
      title: "敏感词",
      type: "html",
      labelWidth: 100
    },
    requestUser: {
      title: "用户姓名",
      type: "html",
      labelWidth: 100
    },
    success: {
      title: "是否成功",
      type: "string",
      labelWidth: 100,
      readOnlyWidget: "IsSuccess",
      widget: "IsSuccess"
    },
    errMsg: {
      title: "错误信息",
      type: "html",
      labelWidth: 100
    },
    cost: {
      title: "耗时（毫秒）",
      type: "html",
      labelWidth: 100
    },
    requestTime: {
      title: "创建时间",
      type: "html",
      labelWidth: 100
    },
    // isWithdrawal: {
    //   title: "是否撤回",
    //   type: "string",
    //   labelWidth: 100,
    //   readOnlyWidget: "IsSuccess",
    //   widget: "IsSuccess"
    // },
    sessionContext: {
      title: "上下文",
      type: "html",
      labelWidth: 100
    },
    accessChannel: {
      title: "访问渠道",
      type: "html",
      labelWidth: 100
    },
    mark: {
      title: "标注",
      type: "html",
      labelWidth: 100
    },
    // optimize: {
    //   title: "优化",
    //   type: "html",
    //   labelWidth: 100
    // },

    requestContext: {
      title: "请求内容",
      type: "html",
      labelWidth: 100
    },
    responseContext: {
      title: "响应内容",
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

// 是否成功
const IsSuccess = ({ value }) => {
  return !value ? <Tag color="red">否</Tag> : <Tag color="green">是</Tag>
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
        widgets={{ ResultWidget, TagWidget, IsSuccess }}
      />
    </Drawer>
  )
}
