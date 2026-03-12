/*
 * @Author: Dyton
 * @Date: 2024-05-22 11:32:29
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-23 12:14:42
 * @FilePath: /za-aigc-platform-admin-static/src/pages/modelManage/SwitchDeleteModel.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { useCallback, useEffect, useState } from "react"
import { Switch, message } from "antd"
import DeleteModal from "@/components/DeleteModal/DeleteModal"
import { useChangeModelStatusApi } from "@/api/modelManage"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { Typography } from "antd"
const { Paragraph, Text } = Typography

const SwitchDeleteModel = ({ record }) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [checked, setChecked] = useState(record?.status === 1)
  const queryClient = useQueryClient()
  const updateMutate = () => queryClient.invalidateQueries([QUERY_KEYS.MODELS_LIST])
  const { mutate } = useChangeModelStatusApi(updateMutate)
  const changeStatus = useCallback(
    async (status) => {
      if (!record?.configNo) {
        message.warning("未获取到configNo")
        return
      }
      mutate(
        {
          configNo: record?.configNo,
          status
        },
        {
          onSuccess: (e) => {
            if (e?.success) setChecked(status)
          }
        }
      )
    },
    [record]
  )

  const onChange = (checked, e) => {
    e.stopPropagation()
    if (!checked) setOpenDeleteModal(true)
    else changeStatus(1)
  }
  return (
    <>
      <DeleteModal
        title="停用模型可能导致应用端该模型选项不可见"
        desc={
          <Text copyable={{ text: record?.name }}>
            <span>
              请输入模型名称
              <b style={{ color: "red", fontWeight: "bold", margin: "0 5px" }}>{record?.name}</b>
              以确认
            </span>
          </Text>
        }
        placeholder="请输入模型名称"
        confirmText={record?.name}
        openDeleteModal={openDeleteModal}
        setOpenDeleteModal={setOpenDeleteModal}
        confirmCallback={() => changeStatus(0)}
      />
      <Switch
        checked={checked}
        onChange={onChange}
        checkedChildren="启用"
        unCheckedChildren="停用"
      ></Switch>
    </>
  )
}

export default SwitchDeleteModel
