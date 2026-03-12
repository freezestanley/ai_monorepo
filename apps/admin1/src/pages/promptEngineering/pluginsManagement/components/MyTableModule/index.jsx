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
  Switch,
  Modal,
  Tag,
  Table,
  Segmented,
  Space
} from "antd"
import {
  StarOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SettingOutlined
} from "@ant-design/icons"
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
import {
  usePluginListApi,
  useCancelSubscribeApi,
  useSubscribeApi,
  usePluginChangeStatus,
  usePluginDelete,
  usePluginDeleteApi
} from "@/api/pluginManage"
import { fetchPluginReference } from "@/api/pluginManage/api"
import DeleteModal from "@/components/DeleteModal/DeleteModal"

// @ts-ignore
import toolImg from "@/assets/img/tool.png"
import "./index.scss"
import { Empty } from "antd"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

export const MyTableModule = (props) => {
  const {
    type = "app"
    // dataSource = [0, 1, ...new Array(10).fill(1).map((v, i) => `${2 * i}`)],
  } = props || {}
  const [modal, contextHolder] = Modal.useModal()
  const { isPublishDisabled, studioenv } = useStudioPublishData()
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

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
  const { searchKey, currentRecord, setVisible, setIsEditing, setCurrentRecord } = usePlginsManage()
  const theme = {
    components: {
      Button: {
        colorPrimary: color,
        defaultBorderColor: color,
        defaultColor: color,
        colorPrimaryHover: hover,
        colorPrimaryActive: hover
      },
      Switch: {
        colorPrimary: color,
        colorPrimaryHover: hover
      }
    }
  }
  // 获取列表
  const { data, isLoading: listLoading } = usePluginListApi({
    // pageNum: pagination.current,
    // pageSize: pagination.pageSize,
    botNo,
    searchText: searchKey
  })
  const dataSource = data || []
  const totalCount = data?.totalCount ?? 0
  const queryClient = useQueryClient()
  const updateHome = () => queryClient.invalidateQueries([QUERY_KEYS.PLUGIN_LIST])
  // 订阅
  const { mutate: mutateSubscribe } = useSubscribeApi(updateHome)
  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(updateHome)
  // 修改状态
  const { mutate: mutateChangeStatus } = usePluginChangeStatus(updateHome)
  // 删除
  const { mutate: mutateDelete } = usePluginDelete(updateHome)
  const { mutate: deletePlugin } = usePluginDeleteApi(updateHome)
  // 取消订阅
  const handleCancelSubscribe = (e, record) => {
    mutateCancelSubscribe({
      botNo,
      pluginNo: record.pluginNo,
      status: record.bizNo
    })
  }
  // 订阅
  const handleSubscribe = (e, record) => {
    mutateSubscribe({ botNo, bizType: type, bizNo: record.bizNo })
  }
  // 修改状态
  const handleChangeStatus = (checked, record, e) => {
    cancelBubble(e)
    const status = checked ? 1 : 0
    const confirmContent =
      status === 1
        ? "启用后，将启用该工具所有相关调用，是否确认？"
        : "停用后，将停止该工具所有相关调用，是否确认？"
    Modal.confirm({
      title: "提示",
      content: confirmContent,
      onOk: () => {
        mutateChangeStatus({ botNo, pluginNo: record.pluginNo, status: status })
      },
      onCancel: () => {
        // 如果用户点击取消，不做任何操作
      }
    })
  }
  // 删除
  const handleDelete = async (e, record) => {
    // mutateDelete({ botNo, bizType: type, bizNo: record.bizNo })
    cancelBubble(e)
    const res = await fetchPluginReference({ botNo, pluginNo: record.pluginNo })
    if (res.success) {
      if (res.data.agentResponse?.length || res.data.skillInfoVOS?.length) {
        modal.warning({
          title: "删除提醒",
          classNames: { content: "custom-modal-content" },
          content: (
            <>
              当前卡片内工具已应用于以下Agent/工作流，不可删除！
              {!!res.data.agentResponse?.length && (
                <p className="text-[#7f56d9]">
                  Agent：{res.data.agentResponse?.map((v) => v.agentName)?.join("、")}
                </p>
              )}
              {!!res.data.skillInfoVOS?.length && (
                <p className="text-[#7f56d9]">
                  工作流：{res.data.skillInfoVOS?.map((v) => v.skillName)?.join("、")}
                </p>
              )}
            </>
          ),
          okText: "我知道了"
        })
      } else {
        setCurrentRecord(record)
        setOpenDeleteModal(true)
      }
    } else {
      res.message && message.error(res.message)
    }
  }

  const confirmCallback = () => {
    deletePlugin(
      { botNo, pluginNo: currentRecord.pluginNo },
      {
        onSuccess: (res) => {
          if (res?.success) {
            setOpenDeleteModal(false)
            setCurrentRecord(null)
          }
        }
      }
    )
  }

  // 设置
  const handleEdit = (e, record) => {
    cancelBubble(e)
    setCurrentRecord(record)
    setIsEditing(true)
    setVisible(true)
  }
  // 跳转至工具
  const handleGoTool = (record) => {
    const { botNo, pluginNo } = record || {}
    const urls = queryString.stringifyUrl({
      url: `/plugin/${pluginNo}`,
      query: {
        botNo,
        studioenv: studioenv || ""
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
          {record.type === "MCP" ? (
            <Tag color="blue" className="text-xs">
              MCP
            </Tag>
          ) : (
            <span className="text-gray-400">普通工具</span>
          )}
        </div>
      )
    },
    {
      title: "订阅量",
      key: "subscriberCount",
      width: "10%",
      render: (_, record) => <div className="text-sm">{record?.subscriberCount || 0}</div>
    },
    // {
    //   title: "状态",
    //   key: "status",
    //   width: "12%",
    //   render: (_, record) => (
    //     <div onClick={(e) => e.stopPropagation()}>
    //       <Switch
    //         size="small"
    //         checked={record.status === 1}
    //         onChange={(checked, e) => handleChangeStatus(checked, record, e)}
    //       />
    //     </div>
    //   )
    // },
    {
      title: "操作",
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Space size="small">
            <Tooltip title="编辑">
              <Button
                onClick={() => handleGoTool(record)}
                type="text"
                size="small"
                icon={<div className="iconfont icon-bianji1" />}
              />
            </Tooltip>
            <Tooltip title="设置">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={(e) => handleEdit(e, record)}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                icon={<div className="iconfont icon-shanchu1" />}
                onClick={(e) => handleDelete(e, record)}
              />
            </Tooltip>
            {/* {record.share && (
              <div className="flex items-center">
                <StarOutlined className="mr-1 text-xs" />
                <span className="text-xs">{record.subscriberCount}</span>
              </div>
            )} */}
          </Space>
        </div>
      )
    }
  ]

  return (
    <div className={styles["market-item-module"]} key={type}>
      {/* <Divider className={styles["divider"]}>我的工具</Divider> */}
      <ConfigProvider theme={theme}>
        {dataSource.length > 0 ? (
          <>
            {/* 视图切换按钮 */}
            <div className="flex justify-end mb-4 absolute top-[23px] right-[260px]">
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
                  pagination={false}
                  size="middle"
                  onRow={(record) => ({
                    onClick: () => handleGoTool(record),
                    style: { cursor: "pointer" }
                  })}
                  rowKey="pluginNo"
                />
              </div>
            )}

            {/* 卡片视图 */}
            {viewMode === "grid" && (
              <div className={styles["list-container"]}>
                <Row gutter={15} className="promptEngineering">
                  {dataSource.map((v, i) => (
                    <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6} key={v.id}>
                      {/* <QueueAnim
                      delay={50 * i}
                      type="top"
                      className="queue-simple"
                    >
                    </QueueAnim> */}
                      <div
                        className={styles["card-item"]}
                        key={i}
                        // style={{ borderColor: border }}
                        onClick={() => handleGoTool(v)}
                      >
                        <div className="w-[100%]">
                          {/* className={styles["card"]} */}
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
                                {/* <Switch
                                size="small"
                                value={v.status === 1}
                                onClick={(checked, e) => handleChangeStatus(checked, v, e)}
                              /> */}
                              </div>
                            </div>
                            {/* <span className={styles["iconimg"]}>{icon}</span> */}
                          </div>
                          <div className="skill-item-text belongTo-botName">
                            {v.type === "MCP" && (
                              <div className="time-tag">
                                <span className="title">类型</span>
                                <span className="time">MCP</span>
                              </div>
                            )}
                            <div className="time-tag">
                              <span className="title">订阅量</span>
                              <span className="time">{v?.subscriberCount}</span>
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
                          <Tooltip
                            title={v.description || "这个人很懒，暂未填写描述～"}
                            className={styles["description"]}
                          >
                            {v.description || "这个人很懒，暂未填写描述～"}
                          </Tooltip>
                          <Divider className="!my-[18px] !mt-[18px]" />
                          <div className="bottom-center ">
                            <div className="remove-btn">
                              {/* v.share */}
                              {v.share ? (
                                // className="mt-[8px]"
                                <div>
                                  <StarOutlined className="mr-[12px]" />
                                  <span>{v.subscriberCount}</span>
                                </div>
                              ) : null}
                              <Button
                                type="link"
                                className="p-0 !text-[#181B25] !hover:text-[#7F56D9] text-[12px]"
                              >
                                <i className="iconfont icon-bianji1 text-[#98A2B3] align-middle -mt-[1px] mr-[3px]"></i>
                                编辑
                              </Button>
                              <Button
                                type="link"
                                onClick={(e) => handleEdit(e, v)}
                                className="p-0 !text-[#181B25] !hover:text-[#7F56D9] text-[12px]"
                              >
                                <i className="iconfont icon-peizhi align-middle -mt-[1px] mr-[3px]"></i>
                                设置
                              </Button>
                              <Button
                                className="p-0  !text-[#181B25]  text-[12px]"
                                type="link"
                                disabled={isPublishDisabled}
                                onClick={(e) => handleDelete(e, v)}
                              >
                                <i className="iconfont icon-shanchu1 text-[#98A2B3] align-middle -mt-[1px] mr-[3px]"></i>
                                删除
                              </Button>
                              {/* <Button
                                type="link"
                                className="p-0 !text-[#181B25] !hover:text-[#7F56D9]"
                                onClick={(e) => handleSetCurrentSkill(e, skill)}
                              >
                                <i className="iconfont icon-peizhi align-middle mt-[1px] mr-[10px]"></i>
                                使用设置
                              </Button> */}
                            </div>
                          </div>
                          {/* <div className={styles["custom"]}> */}
                          {/* <div className={styles["custom-right"]}> */}
                          {/* {v.share ? (
                                <div
                                  className={styles["count"]}
                                  style={{ color: color }}
                                >
                                  <StarOutlined />
                                  <span>{v.subscriberCount}</span>
                                </div>
                              ) : null}
                              <Button
                                type="link"
                                onClick={(e) => handleEdit(e, v)}
                                style={{ color: color }}
                              >
                                使用设置
                              </Button> */}
                          {/* <Popconfirm
                                title={"【删除】后，将停止该插件所有相关调用"}
                                okText="确认"
                                cancelText="取消"
                                onConfirm={(e) => handleDelete(e, v)}
                              >
                                <Button type="link">删除</Button>
                              </Popconfirm> */}
                          {/* </div> */}
                          {/* </div> */}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
                {/* <Pagination
                  className="pr-2"
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
                /> */}
              </div>
            )}
            <DeleteModal
              title={<span>删除</span>}
              desc={
                <div>
                  <p className="text-[#475467]">删除工具卡片后，内部工具将同步删除，是否确定删除</p>
                  <br />
                  <p className="-mt-[20px] mb-[10px]">
                    请输入工具卡片名称 <b style={{ color: "red" }}>{currentRecord?.name} </b>以确认
                  </p>
                </div>
              }
              placeholder="请输入工具卡片名称"
              confirmText={currentRecord?.name}
              openDeleteModal={openDeleteModal}
              setOpenDeleteModal={setOpenDeleteModal}
              confirmCallback={confirmCallback}
            />
            {contextHolder}
          </>
        ) : (
          <div className="mt-[34vh]">
            <CustomEmpty description={`您还未创建任何工具`}></CustomEmpty>
          </div>
        )}
      </ConfigProvider>
    </div>
  )
}
