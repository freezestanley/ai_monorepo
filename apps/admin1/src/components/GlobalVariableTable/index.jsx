import React, { useEffect } from "react"
import { Form, Table, Tooltip, message, Tabs } from "antd"
import CopyToClipboard from "react-copy-to-clipboard"
import { CopyOutlined } from "@ant-design/icons"
import { useFetchGlobalVariableNewCustom } from "@/api/skill"
import { useSkillFlowData } from "@/store"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"

const { TabPane } = Tabs

const VariableTable = ({ variables, columnTitle }) => {
  const columns = [
    {
      title: columnTitle,
      dataIndex: "displayName",
      key: "displayName",
      render: (text) => (
        <>
          {text}
          <CopyToClipboard text={`$\{${text}}`} onCopy={() => message.success("复制成功")}>
            <Tooltip title="点击复制">
              <CopyOutlined className="ml-1" style={{ cursor: "pointer" }} />
            </Tooltip>
          </CopyToClipboard>
        </>
      )
    },
    {
      title: "类型",
      dataIndex: "variableValueType",
      key: "variableValueType"
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description"
    }
  ]

  return (
    <Table
      columns={columns}
      dataSource={Array.isArray(variables) ? variables : []}
      pagination={false}
      rowKey="variableId"
    />
  )
}

const GlobalVariableTable = ({ visible }) => {
  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)

  const { data: { botConstantVariables, flowVariables, sessionVariables } = {}, refetch } =
    useFetchGlobalVariableNewCustom(skillFlowData?.versionNo)

  /**
   * 打开就要重新刷新一次
   */
  useEffect(() => {
    visible && refetch()
  }, [visible])

  // 假设流程变量和会话变量数据获取方式与全局变量相似
  // 需要根据实际项目情况调整
  const processData = flowVariables || []
  const sessionData = sessionVariables || []
  const globalData = botConstantVariables || []

  return (
    <Form>
      <Tabs defaultActiveKey="1" type="card" onChange={() => refetch()}>
        <TabPane tab="流程变量" key="1">
          <VariableTable variables={processData} columnTitle="流程变量名称" />
        </TabPane>
        <TabPane tab="会话变量" key="2">
          <VariableTable variables={sessionData} columnTitle="会话变量名称" />
        </TabPane>
        <TabPane tab="全局常量" key="3">
          <VariableTable variables={globalData} columnTitle="全局常量名称" />
        </TabPane>
      </Tabs>
    </Form>
  )
}

export default GlobalVariableTable
