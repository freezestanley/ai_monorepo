import React, { useState, useEffect } from "react"
import { Input, Button, Table, Switch, message } from "antd"
import { PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { Tooltip } from "antd"

const VariableEditor = ({
  visible,
  onClose,
  initialVars = [],
  onConfirm,
  showAutoExtraction = false
}) => {
  const [tempAgentVars, setTempAgentVars] = useState([])
  const [varNameErrors, setVarNameErrors] = useState({})

  // 初始化临时变量数据
  useEffect(() => {
    if (visible) {
      setTempAgentVars([...initialVars])
      setVarNameErrors({}) // 重置错误状态
    }
  }, [visible, initialVars])

  // 生成变量编号
  const generateVarNo = () => {
    return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 添加新变量行
  const handleAddVarRow = () => {
    const newVar = {
      varNo: generateVarNo(),
      varName: "",
      description: "",
      defaultValue: "",
      enabled: true,
      autoExtraction: 0, // 默认关闭自动提取
      isNew: true
    }
    setTempAgentVars([...tempAgentVars, newVar])
  }

  // 删除变量行
  const handleDeleteVarRow = (varNo) => {
    const newVars = tempAgentVars.filter((v) => v.varNo !== varNo)
    setTempAgentVars(newVars)

    // 清理对应的错误状态
    setVarNameErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[varNo]
      return newErrors
    })
  }

  // 更新变量字段
  const handleUpdateVarField = (varNo, field, value) => {
    // 如果是更新变量名称，进行校验
    if (field === "varName") {
      const varNameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/
      if (value && !varNameRegex.test(value)) {
        // 有值但格式不正确，设置错误
        setVarNameErrors((prev) => ({
          ...prev,
          [varNo]: "大小写字母开头，仅支持大小写字母及中划线和下划线，不超过40个字符"
        }))
      } else {
        // 无值或格式正确，清除错误
        setVarNameErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[varNo]
          return newErrors
        })
      }
    }

    const newVars = tempAgentVars.map((v) => (v.varNo === varNo ? { ...v, [field]: value } : v))
    setTempAgentVars(newVars)
  }

  // 确认保存变量
  const handleConfirmVars = () => {
    // 验证必填字段
    const emptyNameVars = tempAgentVars.filter((v) => !v.varName.trim())
    if (emptyNameVars.length > 0) {
      message.error("请填写所有变量的名称")
      return
    }

    // 重新验证所有变量名称格式，确保错误状态是最新的
    const varNameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/
    const currentErrors = {}
    tempAgentVars.forEach((v) => {
      if (v.varName && !varNameRegex.test(v.varName)) {
        currentErrors[v.varNo] = "大小写字母开头，仅支持大小写字母及中划线和下划线，不超过40个字符"
      }
    })

    // 检查是否有校验错误
    if (Object.keys(currentErrors).length > 0) {
      setVarNameErrors(currentErrors) // 更新错误状态
      message.error("请修正变量名称格式错误")
      return
    }

    // 检查变量名称是否重复
    const varNames = tempAgentVars.map((v) => v.varName.trim())
    const uniqueVarNames = [...new Set(varNames)]
    if (varNames.length !== uniqueVarNames.length) {
      message.error("变量名称不能重复")
      return
    }

    // 清除所有错误状态
    setVarNameErrors({})
    onConfirm?.(tempAgentVars)
  }

  // 表格列定义
  const columns = [
    {
      title: "名称",
      dataIndex: "varName",
      key: "varName",
      width: 180,
      render: (text, record) => (
        <Input
          value={text}
          placeholder="请输入变量名称"
          onChange={(e) => handleUpdateVarField(record.varNo, "varName", e.target.value)}
          status={!text || varNameErrors[record.varNo] ? "error" : ""}
          suffix={
            <div
              style={{
                width: "16px",
                height: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {varNameErrors[record.varNo] ? (
                <Tooltip title={varNameErrors[record.varNo]} placement="topRight">
                  <ExclamationCircleOutlined className="text-red-500 cursor-help" />
                </Tooltip>
              ) : null}
            </div>
          }
        />
      )
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      width: 200,
      render: (text, record) => (
        <Input
          showCount
          value={text}
          placeholder="请输入描述"
          maxLength={200}
          onChange={(e) => handleUpdateVarField(record.varNo, "description", e.target.value)}
        />
      )
    },
    {
      title: "默认值",
      dataIndex: "defaultValue",
      key: "defaultValue",
      width: 200,
      render: (text, record) => (
        <Input
          value={text}
          showCount
          placeholder="请输入默认值"
          maxLength={1000}
          onChange={(e) => handleUpdateVarField(record.varNo, "defaultValue", e.target.value)}
        />
      )
    },
    ...(showAutoExtraction
      ? [
          {
            title: "自动提取变量",
            dataIndex: "autoExtraction",
            key: "autoExtraction",
            width: 120,
            render: (autoExtraction, record) => (
              <Switch
                size="small"
                checked={autoExtraction === 1}
                onChange={(checked) =>
                  handleUpdateVarField(record.varNo, "autoExtraction", checked ? 1 : 0)
                }
              />
            )
          }
        ]
      : []),
    {
      title: "状态",
      dataIndex: "enabled",
      key: "enabled",
      width: 60,
      render: (enabled, record) => (
        <Switch
          size="small"
          checked={enabled}
          onChange={(checked) => handleUpdateVarField(record.varNo, "enabled", checked)}
        />
      )
    },
    {
      title: "操作",
      key: "action",
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<i className="iconfont icon-shanchu1" />}
          onClick={() => handleDeleteVarRow(record.varNo)}
        />
      )
    }
  ]

  if (!visible) return null

  return (
    <div className="w-[780px]">
      <div className="mb-4">
        <Table
          columns={columns}
          dataSource={tempAgentVars}
          rowKey="varNo"
          pagination={false}
          size="small"
          scroll={{ y: 500 }}
          locale={{
            emptyText: <CustomEmpty description="暂无变量" />
          }}
        />
      </div>

      <div className="flex justify-between">
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddVarRow}>
          新增变量
        </Button>
        <div className="flex gap-2">
          <Button size="small" onClick={onClose}>
            取消
          </Button>
          <Button size="small" type="primary" onClick={handleConfirmVars}>
            确定
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VariableEditor
