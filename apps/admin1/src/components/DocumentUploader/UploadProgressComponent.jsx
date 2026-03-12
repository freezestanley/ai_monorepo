import { Progress } from "antd"
import upload4 from "@/assets/img/upload4.png"
import "./UploadProgressComponent.scss"

const UploadProgressComponent = ({ fileList, loadingProgress }) => {
  return (
    <>
      {fileList.length > 0 && (
        <p className="mb-2 font-semibold text-sm">
          文档: <span style={{ color: "#5E5FF8" }}>{fileList[0].name}</span>{" "}
        </p>
      )}
      <div className="flex flex-col items-center justify-center mt-20 normal-text">
        <img src={upload4} alt="" width={34} height={40} className="mb-2 bounce-animation" />
        <div className="fadeInOut-animation">自动生成中</div>
      </div>
      <Progress
        percent={loadingProgress}
        className="mb-4 mt-5"
        showInfo
        rootClassName="upload-document"
      />
    </>
  )
}

export default UploadProgressComponent
