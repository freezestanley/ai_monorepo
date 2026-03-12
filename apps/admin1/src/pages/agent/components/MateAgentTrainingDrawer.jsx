import { Button, Drawer, Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import "./styles.scss"

const MateAgentTrainingDrawer = ({ visible, data, onCancel }) => {
  return (
    <Drawer
      title="训练过程"
      open={visible}
      onClose={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>
      ]}
      classNames={{
        header: "mateAgentTrainingDrawerHeader"
      }}
      width={"50%"}
    >
      <div className="flex flex-col gap-[12px]">
        {data?.latestLogs?.map((item, index) => (
          <div className="flex items-center justify-between font-[500] p-[8px]" key={index}>
            <div className="flex items-center gap-[8px]">
              {item.status === 0 && (
                <div className="iconfont icon-a-InfoFillon text-[16px] text-[#525866]" />
              )}
              {item.status === 1 && (
                <Spin indicator={<LoadingOutlined className="text-[16px] text-[#7f56d9]" spin />} />
              )}
              {item.status === 2 && (
                <div className="iconfont icon-a-CheckCircleFillon text-[16px] text-[#1FC16B]" />
              )}
              {item.status === 3 && (
                <div className="iconfont icon-a-InfoFillon text-[16px] text-[#FB3748]" />
              )}
              <span className="text-[#181B25] text-[14px]">{item.title}</span>
            </div>
            <div
              className="text-[#475467] text-[12px] max-w-lg overflow-hidden whitespace-nowrap text-ellipsis"
              title={item.content}
            >
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  )
}

export default MateAgentTrainingDrawer
