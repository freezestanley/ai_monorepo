/*
 * @Author: Dyton
 * @Date: 2023-10-23 20:06:48
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-22 13:02:41
 * @FilePath: /za-aigc-platform-admin-static/src/components/DeleteModal/DeleteModal.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Modal, Input, message } from "antd"
import { useEffect, useState } from "react"
import { WarningOutlined } from "@ant-design/icons"
import { ExclamationCircleFilled } from "@ant-design/icons"
import { Divider } from "antd"
const DeleteModal = ({
  confirmText,
  title,
  desc,
  placeholder = "请输入",
  openDeleteModal,
  setOpenDeleteModal,
  confirmCallback
}) => {
  const [inputValue, setInputValue] = useState("")

  const handleOk = () => {
    if (confirmText === inputValue) {
      confirmCallback()
      setOpenDeleteModal(false)
    } else {
      message.warning(`请输入正确的信息`)
    }
  }

  useEffect(() => {
    setInputValue("")
  }, [openDeleteModal])
  const descStyle = {
    margin: "10px 0",
    display: "flex"
  }

  return (
    <Modal
      title={
        <div className="text-[20px] font-[400] align-middle">
          {/* <ExclamationCircleFilled /> */}
          <ExclamationCircleFilled
            style={{
              color: "#7F56D9",
              marginRight: "8px",
              flex: "none",
              fontSize: "28px",
              verticalAlign: "bottom"
            }}
          />
          {title}
          {/* <Divider /> */}
        </div>
      }
      open={openDeleteModal}
      okButtonProps={{
        disabled: confirmText?.trim() !== inputValue?.trim()
      }}
      onOk={handleOk}
      onCancel={() => setOpenDeleteModal(false)}
    >
      <p style={descStyle}>{desc}</p>
      <Input
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => setInputValue(e.target.value)}
      />
    </Modal>
  )
}

export default DeleteModal
