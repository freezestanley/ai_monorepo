import React from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Form, Space, Popconfirm, Button } from "antd"
import {
  MenuOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined
} from "@ant-design/icons"
import { useEffect } from "react"
import Iconfont from "../Icon"
import Icon from "@ant-design/icons/lib/components/Icon"

const FormList = ({ fields, renderField, onChange, deleteConfirmTitle = "确认删除？" }) => {
  const onDragEnd = (result) => {
    if (!result.destination) return

    const newFields = Array.from(fields)
    const [reorderedField] = newFields.splice(result.source.index, 1)
    newFields.splice(result.destination.index, 0, reorderedField)

    onChange(newFields)
  }

  const handleDelete = (index) => {
    const newFields = fields.filter((_, i) => i !== index)
    onChange(newFields)
  }

  const handleAdd = (index) => {
    const newFields = [...fields]
    newFields.splice(index + 1, 0, {})
    onChange(newFields)
  }

  const handleAddLast = () => {
    const newFields = [...fields, {}]
    onChange(newFields)
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Form
          name="wrap"
          labelCol={{ flex: "110px" }}
          labelAlign="left"
          labelWrap
          wrapperCol={{ flex: 1 }}
          colon={false}
          style={{ maxWidth: 600 }}
        >
          <Droppable droppableId="formList">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {fields.map((field, index) => (
                  <Draggable
                    key={`${field.id || ""}_${index}`}
                    draggableId={`${field.id || ""}_${index}`}
                    index={index}
                  >
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <Space
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            width: "100%"
                          }}
                        >
                          <div {...provided.dragHandleProps}>
                            <Iconfont
                              type="icon-tuodong"
                              className="text-[#98A2B3] hover:text-[#d2bdff]"
                            />
                          </div>
                          {renderField(field, index)}
                          <Space>
                            <Popconfirm
                              title={deleteConfirmTitle}
                              onConfirm={() => handleDelete(index)}
                            >
                              <Iconfont
                                type="icon-tuodong-shanchu"
                                className="text-[#181B25] hover:text-[#7F56D9]"
                              />
                            </Popconfirm>
                          </Space>
                        </Space>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </Form>
      </DragDropContext>
      <Button
        type="link"
        onClick={handleAddLast}
        style={{ marginLeft: "8px", marginTop: "-15px" }}
        icon={<PlusOutlined />}
      >
        创建分组
      </Button>
    </>
  )
}

export default FormList
