import { Spin } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import queryString from "query-string"
import { useFetchPublishOrderDetail } from "@/api/versionRelease"
import BasicInfo from "./BasicInfo"
import ReleaseList from "./ReleaseList"
import ReleaseSteps from "./ReleaseSteps"

const VersionReleaseDetail = () => {
  const navigate = useNavigate()
  const { publishOrderId } = useParams()
  const location = useLocation()
  const { search } = location
  const { parentOrigin, botNo, studioenv } = queryString.parse(search) || {}

  const { data, isLoading } = useFetchPublishOrderDetail({ publishOrderId })

  return (
    <Spin spinning={isLoading}>
      <div className="min-h-screen flex flex-col overflow-hidden bg-[#EFF1F4]">
        <div className="flex items-center justify-between px-[20px] py-[12px] h-[60px] bg-white mb-[8px]">
          <div
            className="text-[#181B25] cursor-pointer flex items-center text-[16px]"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftOutlined className="mr-[12px] text-[14px]" />
            <span className="font-[600]">发布单</span>
          </div>
        </div>
        <div className="flex flex-1">
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="bg-white rounded-[8px]">
              <BasicInfo data={data?.data} />
            </div>
            <div className="bg-white rounded-[8px] mt-[8px] flex-1 overflow-y-auto">
              <ReleaseList
                currentNode={data?.data?.currentNode}
                data={data?.data?.materials}
                botNo={botNo}
                parentOrigin={parentOrigin}
                studioenv={studioenv}
              />
            </div>
          </div>
          <div className="w-[33%] min-w-[430px] overflow-hidden bg-white rounded-[8px] ml-[8px]">
            <ReleaseSteps
              data={data?.data}
              botNo={botNo}
              parentOrigin={parentOrigin}
              publishOrderId={publishOrderId}
            />
          </div>
        </div>
      </div>
    </Spin>
  )
}

export default VersionReleaseDetail
