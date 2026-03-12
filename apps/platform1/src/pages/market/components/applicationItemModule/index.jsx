import { useFetchApplicationList } from "@/api/application"
import { useMarket } from "../.."
import { ItemModule } from "../itemModule"

const ApplicationItemModule = ({ type }) => {
  const { marketSearch } = useMarket()
  const { data: applicationData, isLoading } = useFetchApplicationList({
    pageNum: 1,
    pageSize: 100,
    keyword: marketSearch
  })
  return (
    <ItemModule
      type={type}
      isPublic
      isLoading={isLoading}
      data={applicationData?.data
        ?.filter((item) => item.status === 1)
        ?.map((item) => ({
          ...item,
          name: item.appName,
          description: item.appDesc,
          bizNo: item.appNo,
          iconUrl: item.icon?.iconURL,
          bizType: "ROBOT"
        }))}
    />
  )
}

export default ApplicationItemModule
