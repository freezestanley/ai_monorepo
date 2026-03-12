import React, { useState } from "react"
import { Card, Modal, Transfer, Button, message } from "antd"
import { VerifiedOutlined } from "@ant-design/icons"
import { useBindBotToWorkbench, useFetchAllWorkbenches, useFetchBots } from "@/api/workBench"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"

const mockRobots = [
  { key: "robot1", title: "Robot 1", description: "Robot Description 1" },
  { key: "robot2", title: "Robot 2", description: "Robot Description 2" },
  { key: "robot3", title: "Robot 3", description: "Robot Description 3" }
]

const cardsData = [
  {
    id: 1,
    title: "Card 1",
    description: "Description 1",
    icon: <VerifiedOutlined />
  },
  {
    id: 2,
    title: "Card 2",
    description: "Description 2",
    icon: <VerifiedOutlined />
  },
  {
    id: 3,
    title: "Card 3",
    description: "Description 3",
    icon: <VerifiedOutlined />
  }
]

const Workbench = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedRobots, setSelectedRobots] = useState([])
  const [workbenchNo, setWorkbenchNo] = useState(null)

  const { data: workbenchesData } = useFetchAllWorkbenches()
  const { data: botsData } = useFetchBots()
  const { mutate: bindBotToWorkbench, isLoading } = useBindBotToWorkbench()
  const robotsData = botsData?.map((item) => ({
    ...item,
    key: item.botNo,
    title: item.botName
  }))

  const queryClient = useQueryClient()

  const showModal = (boundBots, workbenchNo) => {
    setSelectedRobots(boundBots?.map((item) => item.botNo) || [])
    setWorkbenchNo(workbenchNo)
    setIsModalVisible(true)
  }
  const handleCancel = () => setIsModalVisible(false)
  const handleSave = () => {
    bindBotToWorkbench(
      {
        workbenchNo,
        botNos: selectedRobots
      },
      {
        onSuccess: (e) => {
          console.log(e)
          if (e.success) {
            queryClient.invalidateQueries([QUERY_KEYS.WORKBENCH_FETCH_ALL])
            message.success(e.message)
          } else {
            message.error(e.message)
          }
          setIsModalVisible(false)
        }
      }
    )
    // 模拟调用保存接口
    handleCancel()
  }
  console.log(workbenchesData)

  return (
    <div className="flex" style={{ minHeight: "70vh" }}>
      {workbenchesData?.map(({ name, desc, icon, boundBots, workbenchNo }) => (
        <Card
          className="w-96 mr-10 h-40"
          key={workbenchNo}
          style={{ borderColor: "#D6D4FC", marginBottom: "20px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <h3 className="text-lg font-bold">{name}</h3>
              <p>{desc}</p>
            </div>
            <img src={icon} alt="" className="w-14" />
          </div>
          <Button className="mt-6" onClick={() => showModal(boundBots, workbenchNo)} type="primary">
            编辑管理
          </Button>
        </Card>
      ))}

      <Modal
        title="管理空间"
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSave}
        destroyOnClose
        okText={"保存"}
      >
        <Transfer
          className="mt-4 mb-10"
          listStyle={{
            height: 400,
            width: 300
          }}
          showSearch
          dataSource={robotsData}
          titles={["未开通", "已开通"]}
          targetKeys={selectedRobots}
          onChange={setSelectedRobots}
          render={(item) => item.title}
          filterOption={(inputValue, item) => item.title.indexOf(inputValue) > -1}
        />
      </Modal>
    </div>
  )
}

export default Workbench
