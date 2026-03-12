import { useId } from "react"
import { Affix, Space } from "antd"
import useBots from "@/hooks/useBots"
import SearchExpandInput from "../SearchExpandInput"
import PageSegmented from "../PageSegmented"

const PageContent = ({ children, title, HeaderLeftComp, searchProps, segmentedProps }) => {
  const domId = useId()
  useBots({ isInit: true })
  const urlSearchParams = new URLSearchParams(window.location.search)
  const hashSearchParams = new URLSearchParams(window.location.hash.split("?")[1] || "")
  const hasBotNo = !!(urlSearchParams.get("botNo") || hashSearchParams.get("botNo"))

  return (
    <div className="h-full overflow-y-auto scrollbar-hide" id={domId}>
      <div className="max-w-[1400px] mx-auto px-10 max-h-[100vh]">
        <Affix offsetTop={0} zIndex={20} target={() => document.getElementById(domId)}>
          <div
            className={`${hasBotNo ? "bg-white" : "bg-gray-50"} pt-[10px] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-6`}
          >
            <Space size={35}>
              <h1 className="text-[30px] font-[600] text-slate-900 tracking-tight">{title}</h1>
              {!!HeaderLeftComp && (
                <>
                  <div className="h-6 w-[1px] bg-gray-200" />
                  {HeaderLeftComp}
                </>
              )}
            </Space>
            <Space size={25}>
              {!!segmentedProps && <PageSegmented {...segmentedProps} />}
              {!!searchProps && <SearchExpandInput {...searchProps} />}
            </Space>
          </div>
        </Affix>
        {children}
      </div>
    </div>
  )
}

export default PageContent
