import { Button } from "antd"
import CallChain from "@/pages/dataStatistic/callLogs/LogDetailDrawer/CallChain"

const CallChainComp = ({ record, onBack }) => {
  return (
    <>
      <div className="mb-[20px] flex justify-between align-center">
        <h1 className="text-[16px]">调用链</h1>
        <Button size="small" type="primary" onClick={onBack}>
          返回
        </Button>
      </div>
      <CallChain record={record} style={{ height: "calc(100vh - 133px)" }} />
    </>
  )
}

export default CallChainComp
