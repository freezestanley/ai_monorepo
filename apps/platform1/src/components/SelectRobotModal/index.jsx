import { Modal, Select, Spin, message } from "antd"
import { useState } from "react"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"

const SelectRobotModal = ({
  open,
  onOk,
  onCancel,
  robotList = [],
  robotListLoading = false,
  title = "选择空间"
}) => {
  const [selectedRobotId, setSelectedRobotId] = useState(null)

  const handleOk = () => {
    if (!selectedRobotId) {
      message.warning("请选择一个空间")
      return
    }
    onOk(selectedRobotId)
    setSelectedRobotId(null)
  }

  const handleCancel = () => {
    onCancel()
    setSelectedRobotId(null)
  }

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确认"
      cancelText="取消"
    >
      <div className="p-2">
        {robotListLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Spin tip="空间加载中..." />
          </div>
        ) : robotList.length > 0 ? (
          <>
            <div className="mb-4">
              <span className="text-[#ff4d4f] mr-1">*</span>
              请选择空间：
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="请选择空间"
              value={selectedRobotId}
              onChange={(value) => setSelectedRobotId(value)}
              showSearch
              required
              status={open && !selectedRobotId ? "error" : undefined}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={robotList.map((robot) => ({
                value: robot.botNo,
                label: robot.botName,
                icon: robot.botIcon
              }))}
              optionRender={(option) => (
                <div className="flex items-center">
                  {option.data.icon && (
                    <img
                      src={option.data.icon}
                      alt={option.data.label}
                      className="w-6 h-6 mr-2 rounded-full"
                    />
                  )}
                  <span>{option.data.label}</span>
                </div>
              )}
            />
          </>
        ) : (
          <div className="my-[50px]">
            <CustomEmpty description={"暂无空间!请联系管理员～"} />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SelectRobotModal
