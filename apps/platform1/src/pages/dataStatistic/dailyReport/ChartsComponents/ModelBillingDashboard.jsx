import React, { useState, useMemo } from "react"
import { Table, Space, Typography, Button, Tag, Empty, Tooltip, message } from "antd"
import {
  ExportOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  DownloadOutlined
} from "@ant-design/icons"
import dayjs from "dayjs"
import { exportModelBillingDetail } from "@/api/dailyReport/api"

const { Text } = Typography

// 计费类型枚举映射
const BILL_TYPE_MAP = {
  normal: "统一收费",
  segmented: "分段收费"
}

function ModelBillingDashboard({ data = {}, adjustedStartTime, adjustedEndTime, botNo }) {
  const [expandedRows, setExpandedRows] = useState([])
  const [exportLoading, setExportLoading] = useState(false)

  // 检查是否有错误信息
  const errorMessage = useMemo(() => {
    if (!data) return "未查询到数据，检查查询条件是否符合"
    if (data.success === false) {
      return data.msg || data.errorMsg || "未查询到数据，检查查询条件是否符合"
    }
    return null
  }, [data])

  // 数量级转换为英文单位
  const convertOrderOfMagnitudeToEnglish = (orderOfMagnitude) => {
    const magnitudeMap = {
      thousand: "K",
      million: "M",
      unit: ""
    }
    return magnitudeMap[orderOfMagnitude] || orderOfMagnitude
  }

  // 格式化数字为个、K、M单位（英文显示）
  const formatNumberWithUnit = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M" // 百万
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K" // 千
    }
    return num.toString()
  }

  // 获取最后一天的数据
  const latestData = useMemo(() => {
    const { timeRangeDetails = [] } = data
    if (timeRangeDetails.length === 0) return null

    // 获取最后一天的数据
    const latestDay = timeRangeDetails[timeRangeDetails.length - 1]
    return latestDay
  }, [data])

  // 为表格准备数据 - 汇总所有版本的计费信息
  const tableData = useMemo(() => {
    if (!latestData) return []

    return latestData.modelDetails.map((modelDetail, index) => {
      // 汇总所有版本的计费信息
      const aggregatedBillInfos = []

      if (modelDetail.pricingVersions && modelDetail.pricingVersions.length > 0) {
        // 遍历所有版本
        modelDetail.pricingVersions.forEach((pricingVersion) => {
          if (pricingVersion.billInfo && pricingVersion.billInfo.length > 0) {
            // 遍历每个版本的计费信息
            pricingVersion.billInfo.forEach((billInfo) => {
              aggregatedBillInfos.push({
                ...billInfo,
                billType: pricingVersion.billType
              })
            })
          }
        })
      }

      // 计算总token数
      const totalTokens = aggregatedBillInfos.reduce((sum, bi) => {
        return (
          sum +
          (bi.inputTokens || 0) +
          (bi.outputTokens || 0) +
          (bi.cacheCreationInputTokens || 0) +
          (bi.cacheReadInputTokens || 0)
        )
      }, 0)

      return {
        key: `${latestData.timeRange}-${index}`,
        model: modelDetail.model,
        requestCount: modelDetail.requestCount || 0,
        totalTokens: totalTokens,
        totalAmount: modelDetail.totalAmount || 0,
        billInfos: aggregatedBillInfos
      }
    })
  }, [latestData])

  // 表格列配置 - 添加模型总费用列
  const columns = [
    {
      title: "模型",
      dataIndex: "model",
      key: "model"
    },
    {
      title: "调用次数",
      dataIndex: "requestCount",
      key: "requestCount"
    },
    {
      title: "总token",
      dataIndex: "totalTokens",
      key: "totalTokens",
      render: (value) => value?.toLocaleString() || 0
    },
    {
      title: <span style={{ color: "#7F56D9" }}>模型总费用(元)</span>,
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => <span style={{ fontWeight: "bold" }}>{value?.toFixed(2) || "0.00"}</span>
    }
  ]

  // 计费信息列配置 - 直接展示汇总的计费信息
  const billInfoColumns = [
    {
      title: "计费类型",
      dataIndex: "billType",
      key: "billType",
      render: (billType) => BILL_TYPE_MAP[billType] || billType
    },
    {
      title: "输入区间",
      dataIndex: "inputTokenRange",
      key: "inputTokenRange",
      render: (range, record) => {
        if (!range || !Array.isArray(range)) {
          // 对于普通计费模式，显示提示信息
          const billType = record.billType || "normal"
          if (billType === "normal") {
            return <Tag color="blue">统一收费</Tag>
          }
          return "-"
        }
        if (range.length === 2) {
          // 使用Tag组件展示输入区间，并使用智能格式化
          return (
            <Tag color="blue">
              [{formatNumberWithUnit(range[0])}-{formatNumberWithUnit(range[1])}]
            </Tag>
          )
        }
        return "-"
      }
    },
    {
      title: "输入tokens",
      dataIndex: "inputTokens",
      key: "inputTokens",
      render: (value) => value?.toLocaleString() || 0
    },
    {
      title: "非思考模式输出tokens",
      dataIndex: "nonThinkingModeOutputTokens",
      key: "nonThinkingModeOutputTokens",
      render: (value, record) => {
        // 如果有 nonThinkingModeOutputTokens，直接显示
        if (
          record.nonThinkingModeOutputTokens !== undefined &&
          record.nonThinkingModeOutputTokens !== null
        ) {
          return record.nonThinkingModeOutputTokens.toLocaleString()
        }
        // 如果没有非思考模式输出token，但有outputTokens，使用outputTokens
        return (record.outputTokens || 0).toLocaleString()
      }
    },
    {
      title: "思考模式输出tokens",
      dataIndex: "thinkingModeOutputTokens",
      key: "thinkingModeOutputTokens",
      render: (value, record) => {
        // 如果有 thinkingModeOutputTokens，直接显示
        if (
          record.thinkingModeOutputTokens !== undefined &&
          record.thinkingModeOutputTokens !== null
        ) {
          return record.thinkingModeOutputTokens.toLocaleString()
        }
        // 如果没有思考模式输出token，但有outputTokens，使用outputTokens
        // 这里根据用户反馈，由于ck数据库没存，思考模式下的输出token先用completion_tokens的量去计算
        return (record.outputTokens || 0).toLocaleString()
      }
    },
    {
      title: "缓存创建输入tokens",
      dataIndex: "cacheCreationInputTokens",
      key: "cacheCreationInputTokens",
      render: (value) => value?.toLocaleString() || 0
    },
    {
      title: "缓存读取输入tokens",
      dataIndex: "cacheReadInputTokens",
      key: "cacheReadInputTokens",
      render: (value) => value?.toLocaleString() || 0
    },
    {
      title: "调用次数",
      dataIndex: "requestCount",
      key: "requestCount"
    },
    {
      title: <span style={{ color: "#7F56D9" }}>总金额(元)</span>,
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => <span style={{ fontWeight: "bold" }}>{value?.toFixed(2) || "0.00"}</span>
    }
  ]

  // 价格信息列配置
  const priceInfoColumns = [
    {
      title: "计费项",
      dataIndex: "itemName",
      key: "itemName",
      width: 150
    },
    {
      title: "单价",
      dataIndex: "price",
      key: "price",
      width: 100
    },
    {
      title: "计费单元",
      dataIndex: "unit",
      key: "unit",
      width: 120
    },
    {
      title: "折扣",
      dataIndex: "discount",
      key: "discount",
      width: 80
    },
    {
      title: "税率",
      dataIndex: "taxRate",
      key: "taxRate",
      width: 80
    }
  ]

  // 处理导出功能
  const handleExport = async () => {
    if (!botNo) {
      message.error("空间编号不能为空")
      return
    }

    let exportDate = null
    if (adjustedEndTime) {
      exportDate = dayjs(adjustedEndTime).format("YYYY-MM-DD")
    } else if (latestData && latestData.timeRange) {
      exportDate = dayjs(latestData.timeRange).format("YYYY-MM-DD")
    } else {
      message.error("无法确定导出日期")
      return
    }

    setExportLoading(true)
    try {
      // 调用API获取响应
      const response = await exportModelBillingDetail(botNo, exportDate)

      // 直接使用固定格式的文件名
      const filename = `模型计费明细_${botNo}_${exportDate}.xlsx`

      // 获取blob数据
      const blob = await response.blob()

      // 创建下载链接
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 释放URL对象
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
      }, 100)

      message.success("导出成功")
    } catch (error) {
      console.error("导出失败:", error)
      message.error("导出失败，请稍后重试")
    } finally {
      setExportLoading(false)
    }
  }

  // 判断是否显示导出按钮（有数据时才显示）
  const showExportButton = tableData && tableData.length > 0

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Text strong>模型计费明细</Text>
          {latestData && adjustedStartTime && adjustedEndTime && (
            <Text style={{ fontSize: "12px", color: "#6B7280" }}>
              （当前计费明细统计日期：{dayjs(adjustedEndTime).format("YYYY-MM-DD")}）
            </Text>
          )}
          {latestData && (!adjustedStartTime || !adjustedEndTime) && (
            <Text style={{ fontSize: "12px", color: "#6B7280" }}>
              （当前计费明细统计日期：{dayjs(latestData.timeRange).format("YYYY-MM-DD")}）
            </Text>
          )}
          <Tooltip title="仅展示查询时间最后一日计费明细，可通过日期筛选器调整计费明细统计。">
            <QuestionCircleOutlined
              style={{ fontSize: "14px", color: "#8C8C8C", cursor: "help", marginLeft: "4px" }}
            />
          </Tooltip>
        </div>
        <Button
          icon={<DownloadOutlined />}
          type="link"
          size="small"
          onClick={handleExport}
          loading={exportLoading}
          disabled={!showExportButton}
        >
          导出
        </Button>
      </div>
      <Table
        dataSource={tableData}
        columns={columns}
        pagination={false}
        rowKey="key"
        rowClassName={() => "bg-white"}
        locale={{
          emptyText: errorMessage ? (
            <Empty description={errorMessage} />
          ) : (
            <Empty description="暂无数据" />
          )
        }}
        expandable={{
          expandedRowRender: (record) => {
            // 直接展示汇总的计费信息，移除版本层级
            const billInfos = record.billInfos.map((bi, biIndex) => ({
              key: `bi-${record.key}-${biIndex}`,
              ...bi
            }))

            return (
              <div style={{ margin: "8px 0" }}>
                <Table
                  dataSource={billInfos}
                  columns={billInfoColumns}
                  pagination={false}
                  size="small"
                  expandable={{
                    expandedRowRender: (billRecord) => {
                      // 构造价格信息数据 - 按计费项展示
                      // 顺序：输入、缓存存储、缓存命中、输出
                      const priceInfo = billRecord.priceInfo || {}
                      const magnitudeEnglish = priceInfo.orderOfMagnitude
                        ? convertOrderOfMagnitudeToEnglish(priceInfo.orderOfMagnitude || "thousand")
                        : ""
                      const unitText =
                        magnitudeEnglish && priceInfo.unit
                          ? `${magnitudeEnglish}${priceInfo.unit}`
                          : "-"

                      const priceInfoData = []

                      // 1. 模型输入
                      if (priceInfo.inputPrice !== undefined && priceInfo.inputPrice !== null) {
                        priceInfoData.push({
                          key: `price-input-${billRecord.key}`,
                          itemName: "模型输入",
                          price: priceInfo.inputPrice,
                          unit: unitText,
                          discount: "-",
                          taxRate: "-"
                        })
                      }

                      // 2. 输入缓存存储
                      if (
                        priceInfo.cacheCreationInputPrice !== undefined &&
                        priceInfo.cacheCreationInputPrice !== null &&
                        priceInfo.cacheCreationInputPrice > 0
                      ) {
                        priceInfoData.push({
                          key: `price-cache-creation-${billRecord.key}`,
                          itemName: "输入缓存存储",
                          price: priceInfo.cacheCreationInputPrice,
                          unit: unitText,
                          discount: "-",
                          taxRate: "-"
                        })
                      }

                      // 3. 缓存命中
                      if (
                        priceInfo.cacheReadInputPrice !== undefined &&
                        priceInfo.cacheReadInputPrice !== null &&
                        priceInfo.cacheReadInputPrice > 0
                      ) {
                        priceInfoData.push({
                          key: `price-cache-read-${billRecord.key}`,
                          itemName: "缓存命中",
                          price: priceInfo.cacheReadInputPrice,
                          unit: unitText,
                          discount: "-",
                          taxRate: "-"
                        })
                      }

                      // 4. 根据模式显示输出价格
                      const mode = priceInfo.mode || "general"

                      if (mode === "support_thinking") {
                        // 支持思考模式 - 显示思考/非思考价格
                        if (
                          priceInfo.nonThinkingModeOutputPrice !== undefined &&
                          priceInfo.nonThinkingModeOutputPrice !== null
                        ) {
                          priceInfoData.push({
                            key: `price-non-thinking-${billRecord.key}`,
                            itemName: "非思考模式输出",
                            price: priceInfo.nonThinkingModeOutputPrice,
                            unit: unitText,
                            discount: "-",
                            taxRate: "-"
                          })
                        }

                        if (
                          priceInfo.thinkingModeOutputPrice !== undefined &&
                          priceInfo.thinkingModeOutputPrice !== null
                        ) {
                          priceInfoData.push({
                            key: `price-thinking-${billRecord.key}`,
                            itemName: "思考模式输出",
                            price: priceInfo.thinkingModeOutputPrice,
                            unit: unitText,
                            discount: "-",
                            taxRate: "-"
                          })
                        }
                      } else {
                        // 通用模式 - 显示通用输出价格
                        if (priceInfo.outputPrice !== undefined && priceInfo.outputPrice !== null) {
                          priceInfoData.push({
                            key: `price-output-${billRecord.key}`,
                            itemName: "模型输出",
                            price: priceInfo.outputPrice,
                            unit: unitText,
                            discount: "-",
                            taxRate: "-"
                          })
                        }
                      }

                      return (
                        <div style={{ margin: "8px 0" }}>
                          <Table
                            dataSource={priceInfoData}
                            columns={priceInfoColumns}
                            pagination={false}
                            size="small"
                            showHeader={true}
                          />
                        </div>
                      )
                    },
                    expandIcon: ({ expanded, onExpand, record }) => (
                      <span
                        onClick={(e) => onExpand(record, e)}
                        style={{
                          cursor: "pointer",
                          color: "#1890ff",
                          fontSize: "16px",
                          transition: "transform 0.3s ease",
                          display: "inline-block",
                          transform: expanded ? "rotate(0deg)" : "rotate(-90deg)"
                        }}
                      >
                        <DownOutlined />
                      </span>
                    )
                  }}
                />
              </div>
            )
          },
          expandedRowKeys: expandedRows,
          onExpand: (expanded, record) => {
            if (expanded) {
              // 点击展开时，收起其他所有行，只展开当前行
              setExpandedRows([record.key])
            } else {
              // 点击收起时，移除当前行
              setExpandedRows(expandedRows.filter((key) => key !== record.key))
            }
          },
          expandIcon: ({ expanded, onExpand, record }) => (
            <span
              onClick={(e) => onExpand(record, e)}
              style={{
                cursor: "pointer",
                color: "#1890ff",
                fontSize: "16px",
                transition: "transform 0.3s ease",
                display: "inline-block",
                transform: expanded ? "rotate(0deg)" : "rotate(-90deg)"
              }}
            >
              <DownOutlined />
            </span>
          )
        }}
      />
    </div>
  )
}

export default ModelBillingDashboard
