import createModal from "@/hooks/createModal"
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons"
import { Button, Modal, Row, Col, Tooltip, Input, message, Popconfirm } from "antd"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { useState, useEffect } from "react"
import { RightOutlined } from "@ant-design/icons"
import { useFetchSourceTag, useFetchSourceTagList, useBatchSaveSourceTag } from "@/api/sourceTag"

// 添加生成随机字符串的函数
const generateRandomCode = (length = 12) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const MyModal = (props) => {
  const { detail, onOk, onCancel, visible } = props

  const [showLeftInput, setShowLeftInput] = useState(false)
  const [showRightInput, setShowRightInput] = useState(false)
  const [leftInputValue, setLeftInputValue] = useState("")
  const [rightInputValue, setRightInputValue] = useState("")
  const [selectedFirstLevel, setSelectedFirstLevel] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editInputValue, setEditInputValue] = useState("")

  const [tempTagList, setTempTagList] = useState([])

  const { data: sourceTagData, isLoading } = useFetchSourceTagList({
    botNo: detail?.botNo,
    tagType: "optimizationReason"
  })

  const { mutateAsync: batchSave } = useBatchSaveSourceTag()

  useEffect(() => {
    if (sourceTagData?.data) {
      // 添加处理函数将树形结构拍平
      const flattenData = (data) => {
        let result = []
        data.forEach((item) => {
          const { children, ...rest } = item
          result.push(rest)
          if (children && children.length > 0) {
            const childrenWithParent = children.map((child) => ({
              ...child,
              parentCode: item.code
            }))
            result = result.concat(childrenWithParent)
          }
        })
        return result
      }

      setTempTagList(flattenData(sourceTagData.data))
    }
  }, [sourceTagData?.data])

  const tagList = tempTagList

  const handleLeftAdd = () => {
    if (leftInputValue.trim()) {
      const newFirstLevel = {
        code: generateRandomCode(),
        tagDesc: leftInputValue.trim(),
        channel: "default",
        parentCode: null,
        botNo: detail?.botNo,
        tagType: "optimizationReason"
      }

      setTempTagList((prev) => [...prev, newFirstLevel])
      setLeftInputValue("")
      setShowLeftInput(false)
    } else {
      setShowLeftInput(false)
    }
  }

  const handleRightAdd = () => {
    if (!selectedFirstLevel) {
      return
    }
    if (rightInputValue.trim()) {
      const newSecondLevel = {
        code: generateRandomCode(),
        tagDesc: rightInputValue.trim(),
        channel: "default",
        parentCode: selectedFirstLevel.code,
        botNo: detail?.botNo,
        tagType: "optimizationReason"
      }

      setTempTagList((prev) => [...prev, newSecondLevel])
      setRightInputValue("")
      setShowRightInput(false)
    } else {
      setShowRightInput(false)
    }
  }

  const renderInput = (value, onChange, onConfirm) => (
    <div className="mb-[8px] mt-[8px]">
      <Input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPressEnter={onConfirm}
        onBlur={onConfirm}
        placeholder="请输入当前分类，按 Enter 确认"
        className="h-[32px] rounded-[6px]"
      />
    </div>
  )

  const handleFirstLevelSelect = (item) => {
    setSelectedFirstLevel(item)
  }

  const handleEditClick = (item, isFirstLevel = true) => {
    setEditingItem({ item, isFirstLevel })
    setEditInputValue(item.tagDesc)
  }

  const handleEditConfirm = () => {
    if (!editInputValue.trim()) {
      message.warning("名称不能为空")
      return
    }

    setTempTagList((prev) =>
      prev.map((tag) => {
        if (tag.code === editingItem.item.code) {
          return {
            ...tag,
            tagDesc: editInputValue
          }
        }
        return tag
      })
    )

    setEditingItem(null)
    setEditInputValue("")
  }

  const handleDelete = (item, isFirstLevel = true) => {
    if (isFirstLevel) {
      // 删除一级分类及其下所有二级分类
      setTempTagList((prev) =>
        prev.filter((tag) => tag.code !== item.code && tag.parentCode !== item.code)
      )

      // 如果删除的是当前选中的一级分类，清空选中状态
      if (selectedFirstLevel?.code === item.code) {
        setSelectedFirstLevel(null)
      }
    } else {
      // 仅删除选中的二级分类
      setTempTagList((prev) => prev.filter((tag) => tag.code !== item.code))
    }

    // 关闭可能打开的编辑状态
    if (editingItem?.item.code === item.code) {
      setEditingItem(null)
      setEditInputValue("")
    }
  }

  const firstLevelTags = tagList.filter((tag) => !tag.parentCode)

  const getSecondLevelTags = (parentCode) => {
    return tagList.filter((tag) => tag.parentCode === parentCode)
  }

  const renderFirstLevelTags = () =>
    firstLevelTags.map((item) => (
      <div
        key={item.code}
        className={`group flex items-center cursor-pointer hover:bg-[#F9F5FF] px-[12px] h-[36px] rounded-[6px] relative mb-[4px] ${
          selectedFirstLevel?.code === item.code ? "bg-[#F9F5FF]" : ""
        }`}
        onClick={() => handleFirstLevelSelect(item)}
      >
        <div className="flex-1 mr-[10px]">
          {editingItem?.item.code === item.code && editingItem?.isFirstLevel ? (
            <Input
              autoFocus
              value={editInputValue}
              onChange={(e) => setEditInputValue(e.target.value)}
              onPressEnter={handleEditConfirm}
              onBlur={handleEditConfirm}
              onClick={(e) => e.stopPropagation()}
              className="h-[32px] rounded-[6px]"
              style={{ marginTop: "2px", marginBottom: "2px" }}
            />
          ) : (
            <Tooltip title={item.tagDesc} placement="topLeft">
              <span className="truncate max-w-[148px] inline-block leading-[36px] mt-[3px]">
                {item.tagDesc}
              </span>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center space-x-[10px]">
          <i
            onClick={(e) => {
              e.stopPropagation()
              handleEditClick(item, true)
            }}
            className={`iconfont icon-Edit text-[#475467] hover:text-[#6938EF] text-[14px] cursor-pointer ${
              selectedFirstLevel?.code === item.code ? "" : "hidden group-hover:inline-block"
            }`}
          ></i>
          <Popconfirm
            title="删除分类"
            description={`【删除】后，历史优化单将无法查看关联字段！`}
            onConfirm={(e) => {
              e?.stopPropagation()
              handleDelete(item, true)
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="确认"
            cancelText="取消"
          >
            <i
              onClick={(e) => e.stopPropagation()}
              className={`iconfont icon-shanchu1 text-[#475467] hover:text-[#F04438] text-[14px] cursor-pointer ${
                selectedFirstLevel?.code === item.code ? "" : "hidden group-hover:inline-block"
              }`}
            ></i>
          </Popconfirm>
          <RightOutlined
            className="text-[#475467] hover:text-[#6938EF] text-[14px] cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    ))

  const renderSecondLevelTags = () => {
    const secondLevelTags = selectedFirstLevel ? getSecondLevelTags(selectedFirstLevel.code) : []

    return secondLevelTags.map((item) => (
      <div
        key={item.code}
        className="group flex items-center cursor-pointer hover:bg-[#F9F5FF] px-[12px] h-[36px] rounded-[6px] relative mb-[4px]"
      >
        <div className="flex-1 mr-[10px]">
          {editingItem?.item.code === item.code && !editingItem?.isFirstLevel ? (
            <Input
              autoFocus
              value={editInputValue}
              onChange={(e) => setEditInputValue(e.target.value)}
              onPressEnter={handleEditConfirm}
              onBlur={handleEditConfirm}
              className="h-[32px] rounded-[6px]"
              style={{ marginTop: "2px", marginBottom: "2px" }}
            />
          ) : (
            <Tooltip title={item.tagDesc} placement="topLeft">
              <span className="truncate max-w-[160px] inline-block leading-[36px]">
                {item.tagDesc}
              </span>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center space-x-[10px]">
          <i
            onClick={() => handleEditClick(item, false)}
            className={`iconfont icon-Edit text-[#475467] hover:text-[#6938EF] text-[14px] cursor-pointer hidden group-hover:inline-block`}
          ></i>
          <Popconfirm
            title="删除分类"
            description={`确定要删除二级分类"${item.tagDesc}"吗？`}
            onConfirm={() => handleDelete(item, false)}
            okText="确认"
            cancelText="取消"
          >
            <i
              className={`iconfont icon-shanchu1 text-[#475467] hover:text-[#F04438] text-[14px] cursor-pointer hidden group-hover:inline-block`}
            ></i>
          </Popconfirm>
        </div>
      </div>
    ))
  }

  const handleOk = async () => {
    try {
      await batchSave({
        botNo: detail?.botNo,
        tags: tempTagList,
        tagType: "optimizationReason"
      })

      message.success("保存成功")
      onOk(tempTagList)
    } catch (error) {
      message.error("保存失败")
    }
  }

  return (
    <Modal
      title={`错误类型设置`}
      open={visible}
      closable={false}
      width={610}
      maskClosable={false}
      footer={[
        <Button className="mr-[10px]" key="back" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" onClick={handleOk} type="primary" loading={isLoading}>
          确定
        </Button>
      ]}
      onCancel={onCancel}
    >
      <div className="min-h-[100px] rounded-[8px] overflow-hidden">
        {/* 头部标题 */}
        <div
          className="flex justify-start h-[36px] leading-[36px] bg-[#FCFCFD]"
          style={{ borderBottom: "1px solid #E4E7EC" }}
        >
          <div className="w-[50%] px-[16px]">一级分类</div>
          <div className="w-[50%] px-[16px] ">二级分类</div>
        </div>

        {/* 内容区域 */}
        <Row className="relative">
          {/* 中间分隔线 */}
          <div className="absolute left-1/2 -translate-x-[0.5px] top-0 w-[1px] h-full bg-[#E4E7EC]" />

          {/* 左侧一级分类 */}
          <Col span={12} className="min-h-[100px]">
            <div className="h-full flex flex-col">
              {!showLeftInput && (
                <div className="px-[8px] py-[6px]">
                  <Button
                    type="link"
                    className="p-0 text-[#6938EF] hover:text-[#5925DC]"
                    onClick={() => setShowLeftInput(true)}
                  >
                    <PlusOutlined className="align-[0.1em]" />
                    <span className="ml-[4px]">新增</span>
                  </Button>
                </div>
              )}

              <div className="px-[6px] flex-1 overflow-y-auto max-h-[300px]">
                {showLeftInput && renderInput(leftInputValue, setLeftInputValue, handleLeftAdd)}
                {renderFirstLevelTags()}
              </div>
            </div>
          </Col>

          {/* 右侧二级分类 */}
          <Col span={12} className="min-h-[100px]">
            <div className="h-full flex flex-col">
              {selectedFirstLevel && !showRightInput && (
                <div className="px-[8px] py-[6px]">
                  <Button
                    type="link"
                    className="p-0 text-[#6938EF] hover:text-[#5925DC]"
                    onClick={() => setShowRightInput(true)}
                  >
                    <PlusOutlined className="align-[0.1em]" />
                    <span className="ml-[4px]">新增</span>
                  </Button>
                </div>
              )}

              <div className="px-[8px] flex-1 overflow-y-auto max-h-[600px]">
                {!selectedFirstLevel ? (
                  <div className="flex items-center justify-center h-full pb-[10px]">
                    <CustomEmpty description="请选一级分类" />
                  </div>
                ) : (
                  <>
                    {showRightInput &&
                      renderInput(rightInputValue, setRightInputValue, handleRightAdd)}
                    {renderSecondLevelTags()}
                  </>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Modal>
  )
}

export const OptimizeSettingModal = createModal(MyModal)
