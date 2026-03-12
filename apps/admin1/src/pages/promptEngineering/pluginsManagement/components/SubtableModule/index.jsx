import React, { useState } from "react"
import styles from "./index.module.scss"
import {
  Button,
  Col,
  Row,
  message,
  Divider,
  ConfigProvider,
  Tooltip,
  Pagination,
  Popconfirm,
  Table,
  Segmented,
  Space,
  Tag
} from "antd"
import { AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons"
import CopyToClipboard from "react-copy-to-clipboard"
import QueueAnim from "rc-queue-anim"
import queryString from "query-string"
import { useLocation, useNavigate } from "react-router-dom"
import { getThemeConfig } from "@/constants/market"
import { EmptyPro } from "@/components/Empty"
import { usePlginsManage } from "../.."
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { cancelBubble } from "@/utils"
import { usePluginSubListApi, useCancelSubscribeApi, useSubscribeApi } from "@/api/pluginManage"
import { Empty } from "antd"
import "../MyTableModule/index.scss"
// @ts-ignore
import toolImg from "@/assets/img/tool.png"
import { Switch } from "form-render"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

export const SubtableModule = (props) => {
  const {
    type = "app",
    // dataSource = [0, 1, ...new Array(10).fill(1).map((v, i) => `${2 * i}`)],
    onChangePage = () => {}
  } = props || {}

  // 视图模式状态
  const [viewMode, setViewMode] = useState("grid")
  // 获取链接上参数
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  // 定义表格翻页
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  // 获取统一样式
  const { color, hover, icon, title, border } = getThemeConfig("PLUG_IN")
  const { searchKey } = usePlginsManage()
  const theme = {
    components: {
      Button: {
        colorPrimary: color,
        defaultBorderColor: color,
        defaultColor: color,
        colorPrimaryHover: hover,
        colorPrimaryActive: hover
      }
    }
  }
  // 获取列表
  const { data, isLoading: listLoading } = usePluginSubListApi({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    botNo,
    bizType: "PLUG_IN",
    searchText: searchKey
  })
  const dataSource = data?.list || []
  const totalCount = data?.totalCount ?? 0
  const queryClient = useQueryClient()
  const updateHome = () => queryClient.invalidateQueries([QUERY_KEYS.PLUGIN_SUB_LIST])
  // 订阅
  const { mutate: mutateSubscribe } = useSubscribeApi(updateHome)
  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(updateHome)
  const { studioenv, isPublishDisabled } = useStudioPublishData()

  // 取消订阅
  const handleCancelSubscribe = (e, record) => {
    mutateCancelSubscribe({ botNo, bizNo: record.bizNo, bizType: "PLUG_IN" })
  }
  // 订阅
  const handleSubscribe = (e, record) => {
    mutateSubscribe({ botNo, bizType: type, bizNo: record.bizNo })
  }
  // 跳转详情
  const handleGoDetail = (record) => {
    const { bizNo } = record || {}
    const urls = queryString.stringifyUrl({
      url: "/plugins-detail",
      query: {
        botNo: botNo,
        pluginNo: bizNo,
        studioenv
      }
    })
    navigate(urls)
  }

  // 表格列定义
  const columns = [
    {
      title: "工具信息",
      key: "toolInfo",
      width: "35%",
      render: (_, record) => (
        <div className="flex items-center">
          <div className="flex items-center justify-center mr-[12px] bg-[#E0FAEC] bg-opacity-50 w-[48px] h-[48px] rounded-[8px]">
            <img className="w-6 h-6" src={toolImg} alt="" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <Tooltip title={record.name}>
                <span className="font-medium truncate mr-2 text-sm" style={{ maxWidth: "200px" }}>
                  {record.name}
                </span>
              </Tooltip>
              <CopyToClipboard text={record.pluginNo} onCopy={() => message.success("复制成功")}>
                <Tooltip title={`点击复制工具编号: ${record.pluginNo}`}>
                  <Tag onClick={(e) => cancelBubble(e)} className="text-xs cursor-pointer">
                    ID
                  </Tag>
                </Tooltip>
              </CopyToClipboard>
            </div>
            <span className="text-sm text-gray-500 truncate block" style={{ maxWidth: "300px" }}>
              {record.description || "这个人很懒，暂未填写描述～"}
            </span>
          </div>
        </div>
      )
    },
    {
      title: "类型",
      key: "type",
      width: "12%",
      render: (_, record) => (
        <div className="text-sm">
          <Tag color="orange" className="text-xs">
            订阅工具
          </Tag>
        </div>
      )
    },
    {
      title: "来源",
      key: "belongToBotName",
      width: "15%",
      render: (_, record) => <div className="text-sm">{record?.belongToBotName || "--"}</div>
    },
    {
      title: "状态",
      key: "status",
      width: "12%",
      render: (_, record) => (
        <div>
          <span
            className={`px-2 py-1 text-xs rounded ${record.status ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}
          >
            {record.status ? "启用中" : "已停用"}
          </span>
        </div>
      )
    },
    {
      title: "操作",
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Popconfirm
            title={"【取消订阅】将无法调用对应工作流。"}
            okText="确认"
            cancelText="取消"
            onConfirm={(e) => handleCancelSubscribe(e, record)}
            onPopupClick={(e) => cancelBubble(e)}
          >
            <Button
              className="p-0 !text-[#181B25] !hover:text-[#7F56D9] text-[12px]"
              type="text"
              size="small"
              onClick={(e) => cancelBubble(e)}
              disabled={isPublishDisabled}
            >
              取消订阅
            </Button>
          </Popconfirm>
        </div>
      )
    }
  ]

  return (
    <div className={styles["market-item-module"]} key={type}>
      {/* <Divider className={styles["divider"]}>订阅工具</Divider> */}
      <ConfigProvider theme={theme}>
        {dataSource.length > 0 ? (
          <>
            {/* 视图切换按钮 */}
            <div className="flex justify-end mb-4">
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    value: "grid",
                    icon: <AppstoreOutlined />
                  },
                  {
                    value: "list",
                    icon: <UnorderedListOutlined />
                  }
                ]}
              />
            </div>

            {/* 表格视图 */}
            {viewMode === "list" && (
              <div className="table-container">
                <Table
                  columns={columns}
                  dataSource={dataSource}
                  pagination={{
                    current: pagination?.current ?? 1,
                    pageSize: pagination?.pageSize ?? 10,
                    total: totalCount,
                    onChange: (page, pageSize) => {
                      const p = { current: page, pageSize }
                      setPagination(p)
                    },
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                    style: { marginTop: "15px", textAlign: "right" }
                  }}
                  size="middle"
                  onRow={(record) => ({
                    onClick: () => handleGoDetail(record),
                    style: { cursor: "pointer" }
                  })}
                  rowKey="bizNo"
                />
              </div>
            )}

            {/* 卡片视图 */}
            {viewMode === "grid" && (
              <div className={styles["list-container"]}>
                <Row gutter={15} className="promptEngineering">
                  {dataSource.map((v, i) => (
                    <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6} key={i}>
                      {/* <QueueAnim
                      delay={50 * i}
                      type="top"
                      className="queue-simple"
                    >
                      
                    </QueueAnim> */}
                      <div
                        key={i}
                        className={styles["card-item"]}
                        onClick={() => handleGoDetail(v)}
                      >
                        <div className="w-[100%]">
                          <div>
                            <div className={styles["info"]}>
                              <div className={styles["text-base"]}>
                                <div className="flex items-center justify-center mr-[12px] bg-[#E0FAEC] bg-opacity-50 w-[48px] h-[48px] rounded-[8px]">
                                  <img className={styles["text-base-img"]} src={toolImg} alt="" />
                                </div>
                                <div className="flex flex-1 flex-col items-start overflow-hidden">
                                  <Tooltip
                                    title={v.name}
                                    className="overflow-hidden text-ellipsis whitespace-nowrap w-[80%]"
                                  >
                                    {v.name}
                                  </Tooltip>
                                  <CopyToClipboard
                                    text={v.pluginNo}
                                    onCopy={() => message.success("复制成功")}
                                  >
                                    <Tooltip title="点击复制工具编号">
                                      <span
                                        className="text-[#626263] cursor-pointer leading-[18px] text-[12px] mt-[8px] font-normal"
                                        onClick={(e) => cancelBubble(e)}
                                      >
                                        {v.pluginNo}
                                      </span>
                                    </Tooltip>
                                  </CopyToClipboard>
                                </div>
                              </div>

                              <div className={styles["custom-left"]}>
                                <span className={`status ${!v.status ? "not" : ""}`}>
                                  {v.status ? "启用中" : "已停用"}
                                </span>
                                {/* {v.status ? (
                                <Button type="primary" shape="round">
                                  启用中
                                </Button>
                              ) : (
                                <Button
                                  type="primary"
                                  shape="round"
                                  style={{ background: "#999" }}
                                >
                                  已停用
                                </Button>
                              )} */}
                              </div>

                              {/* <span className={styles["iconimg"]}>{icon}</span> */}
                            </div>
                            <div className="skill-item-text belongTo-botName">
                              <div className="time-tag">
                                <span className="title">类型</span>
                                <span className="time">订阅工具</span>
                              </div>
                              <div className="time-tag">
                                <span className="title">来源</span>
                                <span className="time">{v?.belongToBotName}</span>
                              </div>
                              {/* <div className="time-tag">
                              {v?.subscribeCount > 0 && (
                                <div className="time-tag">
                                  <span className="title">订阅量</span>
                                  <span className="time">
                                    {v?.subscribeCount}
                                  </span>
                                </div>
                              )}
                            </div> */}
                            </div>
                            <Tooltip placement="topLeft" destroyTooltipOnHide title={v.description}>
                              <span className={styles["description"]}>
                                {v.description || "这个人很懒，暂未填写描述～"}
                              </span>
                            </Tooltip>
                          </div>
                          {/* <div className={styles["origin"]}>
                          <span>来源: </span>
                          <span>{v.belongToBotName}</span>
                        </div> */}
                          <Divider className="!my-[18px] !mt-[18px]" />
                          <div className="bottom-center ">
                            <div className="remove-btn">
                              <Popconfirm
                                title={"【取消订阅】将无法调用对应工作流。"}
                                okText="确认"
                                cancelText="取消"
                                onConfirm={(e) => handleCancelSubscribe(e, v)}
                                onPopupClick={(e) => cancelBubble(e)}
                              >
                                <Button
                                  className="p-0 !text-[#181B25] !hover:text-[#7F56D9] text-[12px]"
                                  type="link"
                                  onClick={(e) => cancelBubble(e)}
                                  disabled={isPublishDisabled}
                                >
                                  <i className="iconfont icon-dingyue align-middle -mt-[1px] mr-[3px] text-[#F6B51E]"></i>
                                  取消订阅
                                </Button>
                                {/* <Button
                                type="link"
                                onClick={(e) => cancelBubble(e)}
                                style={{ color: color }}
                              >
                                取消订阅
                              </Button> */}
                              </Popconfirm>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
                <Pagination
                  // className="pr-2 pagination-v2"
                  // size="small"
                  current={pagination?.current ?? 1}
                  pageSize={pagination?.pageSize ?? 10}
                  total={totalCount}
                  onChange={(page, pageSize) => {
                    const p = { current: page, pageSize }
                    setPagination(p)
                  }}
                  showSizeChanger={true}
                  style={{ marginTop: "15px", textAlign: "right" }}
                  showTotal={(total) => `共 ${total} 条`}
                />
              </div>
            )}
          </>
        ) : (
          // <EmptyPro type={type} />
          <div className="mt-[36vh]">
            <CustomEmpty description={`您还未订阅任何工具`}></CustomEmpty>
          </div>
        )}
      </ConfigProvider>
    </div>
  )
}
