import { Modal, Table, Button, Space } from "antd"
import { useState } from "react"

const DuplicateScriptModal = ({ visible, duplicateList, onConfirm, onCancel, loading }) => {
  const [ignoreList, setIgnoreList] = useState([])

  // 处理单个忽略
  const handleIgnore = (content) => {
    setIgnoreList((prev) => {
      if (prev.includes(content)) {
        return prev.filter((item) => item !== content)
      }
      return [...prev, content]
    })
  }

  // 处理单个覆盖
  const handleCover = (content) => {
    setIgnoreList((prev) => prev.filter((item) => item !== content))
  }

  // 处理忽略全部
  const handleIgnoreAll = () => {
    onConfirm({
      isIgnore: 1, // 一键忽略
      ignoreList: []
    })
  }

  // 处理覆盖全部
  const handleCoverAll = () => {
    onConfirm({
      isIgnore: 2, // 覆盖全部
      ignoreList: []
    })
  }

  // 处理确认导入（根据用户在table中选择的忽略列表）
  const handleConfirmImport = () => {
    onConfirm({
      isIgnore: 0, // 根据ignoreList处理
      ignoreList: ignoreList
    })
  }

  // 表格列定义
  const columns = [
    {
      title: "话术ID",
      dataIndex: "scriptId",
      key: "scriptId",
      width: 100
    },
    {
      title: "话术内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (text) => (
        <div className="max-w-md truncate" title={text}>
          {text}
        </div>
      )
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_, record) => {
        const isIgnored = ignoreList.includes(record.content)
        return (
          <Space>
            <Button
              type={isIgnored ? "default" : "primary"}
              size="small"
              onClick={() => handleCover(record.content)}
              disabled={!isIgnored}
            >
              {isIgnored ? "覆盖" : "已覆盖"}
            </Button>
            <Button
              type={isIgnored ? "primary" : "default"}
              size="small"
              onClick={() => handleIgnore(record.content)}
            >
              {isIgnored ? "已忽略" : "忽略"}
            </Button>
          </Space>
        )
      }
    }
  ]

  return (
    <Modal
      title={
        <div className="flex items-center">
          <span className="text-lg font-semibold">检测到重复话术</span>
          <span className="ml-2 text-sm text-gray-500">共 {duplicateList.length} 条重复话术</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            已选择忽略 {ignoreList.length} 条话术，将覆盖 {duplicateList.length - ignoreList.length}{" "}
            条话术
          </div>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button onClick={handleIgnoreAll} loading={loading}>
              忽略全部
            </Button>
            <Button onClick={handleCoverAll} loading={loading}>
              覆盖全部
            </Button>
            <Button type="primary" onClick={handleConfirmImport} loading={loading}>
              确认导入
            </Button>
          </Space>
        </div>
      }
    >
      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm">
        ⚠️ 导入文件中包含与现有话术内容重复的数据，请选择处理方式：
        <ul className="list-disc list-inside mt-2 ml-2">
          <li>
            <strong>单个操作</strong>
            ：为每条重复话术单独选择&ldquo;覆盖&rdquo;或&ldquo;忽略&rdquo;，设置完成后点击&ldquo;确认导入&rdquo;
          </li>
          <li>
            <strong>确认导入</strong>：根据您在表格中的选择执行导入（覆盖未标记为忽略的话术）
          </li>
          <li>
            <strong>覆盖全部</strong>：一键覆盖所有重复话术
          </li>
          <li>
            <strong>忽略全部</strong>：一键忽略所有重复话术，仅导入新话术
          </li>
        </ul>
      </div>

      <Table
        columns={columns}
        dataSource={duplicateList}
        rowKey="scriptId"
        scroll={{ y: 400 }}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条`
        }}
      />
    </Modal>
  )
}

export default DuplicateScriptModal
