import { Button, Upload } from "antd"
import { UploadOutlined, InboxOutlined } from "@ant-design/icons"
import { getTokenAndServiceName } from "@/api/sso"

const UploadFile = ({ isDragger, promptText = "将文档拖拽到此处，或 本地上传", ...props }) => {
  return (
    <>
      {isDragger ? (
        <Upload.Dragger
          maxCount={props.multiple ? undefined : 1}
          headers={{
            "X-Usercenter-Session": getTokenAndServiceName().token
          }}
          {...props}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p>{promptText}</p>
        </Upload.Dragger>
      ) : (
        <Upload
          maxCount={props.multiple ? undefined : 1}
          headers={{
            "X-Usercenter-Session": getTokenAndServiceName().token
          }}
          {...props}
        >
          <Button icon={<UploadOutlined />}>点击上传</Button>
        </Upload>
      )}
    </>
  )
}

export default UploadFile
