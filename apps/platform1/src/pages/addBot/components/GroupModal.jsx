import { batchSaveSourceTag, fetchSourceTag } from "@/api/sourceTag/api"
import DragFormList from "@/components/DragFormList"
import NiceModal, { useModal } from "@ebay/nice-modal-react"
import { Button, Divider, Form, Input, Modal, message } from "antd"
import { useEffect, useId, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useFetchSourceTagList } from "@/api/sourceTag"
const tagType = "skillGroupTag"

export const GroupModal = NiceModal.create(({ botNo, groupList, getGroupList }) => {
  const queryClient = useQueryClient()
  const modal = useModal()

  const [fields, setFields] = useState(groupList)

  const inputRule = [
    {
      required: true,
      message: "请输入分组名称"
    },
    ({ getFieldValue }) => ({
      validator(_, value) {
        const isSame = !!value && fields.filter((item) => item.tagDesc === value).length > 1
        if (!isSame) {
          return Promise.resolve()
        }
        return Promise.reject(new Error("分组名称已存在"))
      }
    })
  ]

  const handleChange = (newFields) => {
    setFields([...newFields])
  }

  const renderField = (field, index) => (
    <Form.Item
      label=""
      name={`item-${index}-${useId()}.tagDesc`}
      initialValue={field.tagDesc}
      rules={inputRule}
    >
      <Input
        placeholder="请输入分组名称"
        style={{ width: "380px" }}
        onChange={(e) => {
          const newFields = fields.map((f, i) =>
            i === index ? { ...f, tagDesc: e.target.value } : f
          )
          handleChange(newFields)
        }}
      />
    </Form.Item>
  )

  const onOk = async () => {
    console.log("fields", fields)

    // return
    try {
      await batchSaveSourceTag({
        botNo,
        tagType,
        tags: fields
      })
      queryClient.invalidateQueries([QUERY_KEYS.SOURCE_TAG_LIST])
      getGroupList()
      message.success("保存成功")
      modal.hide()
    } catch (error) {}
  }

  // const getGroupList = async () => {
  //   const res = await fetchSourceTag({ botNo, tagType })
  //   setFields(res.data?.length ? res.data : [{}])
  // }

  // useEffect(() => {
  //   getGroupList()
  // }, [])

  return (
    <Modal
      title={
        <div>
          分组管理
          <p className="text-[#475467] text-[12px] font-[300] mt-[5px]">
            创建分组后，可在【工作流设置-分组设置】处设置对应工作流分组
          </p>
        </div>
      }
      closable={false}
      open={modal.visible}
      onOk={onOk}
      onCancel={modal.hide}
      afterClose={modal.remove}
      width={490}
    >
      {/* <Divider /> */}

      <div
        style={{
          maxHeight: "60vh",
          overflow: "auto",
          paddingRight: "14px",
          marginRight: "-20px"
        }}
      >
        <DragFormList
          fields={fields}
          renderField={renderField}
          onChange={handleChange}
          deleteConfirmTitle="确定【删除】该分组？"
        />
        <Input
          style={{
            marginBottom: "24px",
            marginTop: "24px",
            width: "380px",
            marginLeft: "24px"
          }}
          disabled
          value={"未分组"}
        />
      </div>
      {/* <Divider /> */}
    </Modal>
  )
})
