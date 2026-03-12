import { useEffect } from "react"
import { Button, Table, Tag, Switch } from "antd"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import MateImg from "@/assets/img/mate-img.png"
import ToolsTable from "./ToolsTable"
import "./styles.scss"

const MateAgentContent = ({
  loading,
  agentDetail,
  metaAgentModelList,
  isNeedExecuteDefaultAgent,
  handleSave,
  isOnlyRead,
  knowledgeBases,
  selectedSkills,
  setSelectedSkills,
  selectedTools,
  setSelectedTools,
  onSave
}) => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, workbenchNo, parentOrigin } = queryParams
  const origin = decodeURIComponent(parentOrigin || "")

  // 初始化数据和请求
  useEffect(() => {
    if (agentDetail) {
      // 设置选中的ID
      setSelectedSkills(agentDetail.skillNos || [])
    }
  }, [agentDetail])

  const toolsColumns = [
    {
      title: "工具名称",
      dataIndex: "toolName",
      key: "toolName"
    },
    {
      title: "工具状态",
      dataIndex: "status",
      key: "status",
      render: (text) => (
        <Tag className="tag" color={text ? "success" : "error"}>
          {text ? "启用" : "停用"}
        </Tag>
      )
    }
  ]

  const toknowledgeManage = (record) => {
    window.open(
      `${origin}/knowledge/${record.structureNo ? "structure" : "questions"}?botNo=${botNo}&workbenchNo=${workbenchNo}&catalogNo=${record.catalogNo || ""}&knowledgeData=${agentDetail.knowledgeBaseNo || ""}&structureNo=${record.structureNo || ""}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  const knowledgeColumns = [
    {
      title: "知识库名称",
      dataIndex: "structureName",
      key: "structureName"
    },
    {
      title: "知识库状态",
      dataIndex: "status",
      key: "status",
      render: (text) => (
        <Tag className="tag" color={text ? "success" : "error"}>
          {text ? "启用" : "停用"}
        </Tag>
      )
    },
    {
      title: "操作",
      dataIndex: "operation",
      key: "operation",
      render: (_, record) => (
        <Button
          type="link"
          className="!p-0"
          onClick={() => {
            toknowledgeManage(record)
          }}
        >
          查看
        </Button>
      )
    }
  ]

  return (
    <div className="mateAgentContent">
      <div className="mateHeader">
        <img src={MateImg} alt="" />
        <div className="mateHeaderCon">
          <h3>模版</h3>
          <div className="mateHeaderConName">{metaAgentModelList?.[0]?.modelName || ""}</div>
        </div>
      </div>
      <div className="mt-[25px]">
        <div className="mateContentItem">
          <h2>设置</h2>
          <div className="flex items-center">
            <span className="mr-[28px] text-[14px] text-[#181B25]">是否需要兜底</span>
            <Switch
              checked={isNeedExecuteDefaultAgent ?? true}
              onChange={handleSave}
              checkedChildren="开"
              unCheckedChildren="关"
              disabled={isOnlyRead}
            />
          </div>
        </div>
        <div className="mateContentItem">
          <div className="flex items-center justify-between mb-[8px]">
            <h2 style={{ margin: 0 }}>工具列表</h2>
            <Button
              type="link"
              className="!p-0"
              icon={<i className="iconfont icon-peizhi"></i>}
              onClick={() =>
                window.open(
                  `${origin}/prompt/pluginList?botNo=${botNo}&workbenchNo=${workbenchNo}&pluginNo=${agentDetail?.tools?.[0]?.pluginNo || ""}&isTools=true`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              管理工具
            </Button>
          </div>
          <Table
            className="mateTable"
            rowKey="toolNo"
            columns={toolsColumns}
            loading={loading}
            dataSource={agentDetail?.tools}
            pagination={false}
          />
        </div>
        <div className="mb-[15px]" style={{ borderBottom: "1px solid #d0d5dd" }}>
          <ToolsTable
            isOnlyRead={isOnlyRead}
            agentDetail={agentDetail}
            setSelectedTools={setSelectedTools}
            selectedTools={selectedTools}
            selectedSkills={selectedSkills}
            knowledgeBases={knowledgeBases}
            onSave={onSave}
            botNo={botNo}
          />
        </div>
        <div className="mateContentItem">
          <h2>知识库</h2>
          <Table
            className="mateTable"
            rowKey={(record) => record.structureNo || record.catalogNo}
            columns={knowledgeColumns}
            loading={loading}
            dataSource={
              agentDetail?.commonKnowledgeBaseInfo?.catalogNo
                ? [
                    {
                      catalogNo: agentDetail.commonKnowledgeBaseInfo.catalogNo,
                      structureName: agentDetail.commonKnowledgeBaseInfo.catalogName,
                      status: 1
                    },
                    ...(agentDetail?.structKnowledgeBaseInfos || [])
                  ]
                : agentDetail?.structKnowledgeBaseInfos
            }
            pagination={false}
          />
        </div>
      </div>
    </div>
  )
}

export default MateAgentContent
