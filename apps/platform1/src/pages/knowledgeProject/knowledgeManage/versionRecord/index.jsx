import { useNavigate, useLocation, Link } from "react-router-dom"
import queryString from "query-string"
import { useState } from "react"
import { Button, Table, Row, Col, Form, DatePicker, Input, Popover, Breadcrumb } from "antd"
import { InfoCircleFilled } from "@ant-design/icons"
import PageContainer from "@/components/PageContainer"
import styles from "./index.module.scss"

const VersionRecord = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [pagination, setPagination] = useState({ pageNum: 1, pageSize: 10 })
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo, templateName, templateId } = queryParams

  const columns = [
    {
      title: "版本号",
      dataIndex: "ID"
    },
    {
      title: "生效日期",
      dataIndex: "name"
    },
    {
      title: "失效日期",
      dataIndex: "name"
    },
    {
      title: "更新信息",
      dataIndex: "name"
    },
    {
      title: "总意图数量",
      dataIndex: "name"
    },
    {
      title: "处理进度",
      dataIndex: "name"
    },
    {
      title: "操作",
      dataIndex: "action",
      fixed: "right",
      width: 100,
      render: () => {
        return (
          <Button
            style={{ paddingRight: 0, paddingLeft: 0 }}
            type="link"
            onClick={() => navigate("/versionDetail")}
          >
            查看
          </Button>
        )
      }
    }
  ]

  return (
    <PageContainer
      headerTitle={
        <Breadcrumb
          className={styles.breadcrumb}
          items={[
            {
              title: <Link to={`/templateManage?botNo=${botNo}`}>模板管理</Link>
            },
            {
              title: (
                <Link to={`/templateDetail?botNo=${botNo}&templateId=${templateId}`}>
                  {templateName}
                </Link>
              )
            },
            {
              title: "版本记录"
            }
          ]}
        />
      }
      headerCustomeSearch={
        <div className={styles["search-box"]}>
          <Form form={form} layout="horizontal">
            <Row gutter={24}>
              <Col span={6}>
                <Form.Item label="" name="name">
                  <DatePicker.RangePicker placeholder={["生效日期", "失效日期"]} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="" name="name">
                  <Input placeholder="请输入版本号" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="" name="status">
                  <Input placeholder="请输入创建人/更新人" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="" name="name">
                  <Button htmlType="submit" type="primary" style={{ marginRight: 8 }}>
                    查询
                  </Button>
                  <Button onClick={() => form.resetFields()}>重置</Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      }
    >
      {/* <div className="flex justify-end" style={{ marginBottom: "10px" }}>
        <Button
          type="primary"
          disabled={selectedRowKeys.length < 2}
          onClick={() => navigate("/versionCompare")}
        >
          版本比对
          <Popover
            placement="topRight"
            content="请选中版本进入对比，一次不可超过3个"
            arrow={{ pointAtCenter: true }}
          >
            <InfoCircleFilled style={{ pointerEvents: "initial" }} />
          </Popover>
        </Button>
      </div> */}
      <Table
        rowKey={"id"}
        columns={columns}
        dataSource={[{ name: "abc" }]}
        pagination={{
          className: "pr-2",
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          // total,
          onChange: (page, pageSize) => setPagination({ pageNum: page, pageSize }),
          showSizeChanger: true,
          style: { marginTop: "15px", textAlign: "right" },
          showTotal: (total) => `共 ${total} 条`
        }}
        // rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        scroll={{ x: "max-content" }}
      />
    </PageContainer>
  )
}

export default VersionRecord
