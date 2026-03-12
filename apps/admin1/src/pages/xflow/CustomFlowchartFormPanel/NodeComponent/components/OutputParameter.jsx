import { Button, Col, Form, Input, Row, Select, Space } from "antd"
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons"
import { useFetchVariableType } from "@/api/common"
import Iconfont from "@/components/Icon"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { PlusOutlined } from "@ant-design/icons"
import { useDrag, useDrop } from "react-dnd"
import { MenuOutlined } from "@ant-design/icons"
import { DragIcon } from "@/components/FormIcon"
const ItemTypes = {
  OUTPUT_PARAMETER: "OUTPUT_PARAMETER"
}

const isJSONMethod = (method) => method === "JSON" || method === "JSON_ARRAY"

export const OutputParameter = ({
  index,
  parseMethod,
  deleteOutput,
  addOutput,
  allowDelete,
  inputParamsOrOutputParams = "outputParams",
  isFirst,
  isLast,
  suffixChildren,
  form, // 需要传入form实例
  required = true
}) => {
  const showTypeSelect = isJSONMethod(parseMethod)
  const { data = [] } = useFetchVariableType()
  const [isDisabled] = useFormDisabled()

  // 拖拽相关逻辑
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.OUTPUT_PARAMETER,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: () => !isDisabled
  })

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.OUTPUT_PARAMETER,
    hover(item, monitor) {
      if (!form) return
      if (item.index === index) return

      // 获取当前表单数据
      const formData = form.getFieldValue(inputParamsOrOutputParams)
      const dragIndex = item.index
      const hoverIndex = index

      // 交换位置
      const dragRow = formData[dragIndex]
      const newFormData = [...formData]
      newFormData.splice(dragIndex, 1)
      newFormData.splice(hoverIndex, 0, dragRow)

      // 更新表单数据
      form.setFieldsValue({
        [inputParamsOrOutputParams]: newFormData
      })

      // 更新拖拽项的索引
      item.index = hoverIndex
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  // 组合 drag 和 drop ref
  const dragDropRef = (el) => {
    drag(drop(el))
  }

  return (
    <div
      ref={dragPreview}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transition: "all 0.3s",
        padding: "4px 0"
      }}
    >
      <Row key={index}>
        <Row align="top" gutter={[8, 8]}>
          {showTypeSelect && (
            <Col span={1} style={{ display: "flex", justifyContent: "center" }}>
              <div
                ref={dragDropRef}
                style={{
                  cursor: isDisabled ? "not-allowed" : "move",
                  paddingRight: 8,
                  display: "flex",
                  alignItems: "center",
                  height: "36px"
                }}
              >
                <DragIcon />
              </div>
            </Col>
          )}
          <Col span={6}>
            <Form.Item
              name={[inputParamsOrOutputParams, index, "variableName"]}
              rules={[{ required, message: "请输入字段名(必填)" }]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="字段名(必填)" />
            </Form.Item>
          </Col>
          {showTypeSelect && (
            <Col span={6} style={{ display: "flex", alignItems: "center" }}>
              <Form.Item
                name={[inputParamsOrOutputParams, index, "variableValueType"]}
                rules={[{ required, message: "请选择类型(必选)" }]}
                style={{ marginBottom: 0 }}
              >
                <Select placeholder="类型(必选)" style={{ width: "127px" }}>
                  {data.map((type) => (
                    <Select.Option key={type.code} value={type.code}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
          <Col span={10}>
            <Form.Item
              name={[inputParamsOrOutputParams, index, "description"]}
              rules={[{ required, message: "请输入字段描述(必填)" }]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="字段描述(必填)" />
            </Form.Item>
          </Col>
          {showTypeSelect && (
            <Col span={1} style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ height: "36px", display: "flex", alignItems: "center" }}>
                <Iconfont
                  type="icon-tuodong-shanchu"
                  onClick={() => {
                    if (isDisabled || !allowDelete || (isFirst && isLast)) return
                    deleteOutput(index)
                  }}
                  style={{
                    fontSize: "16px",
                    cursor:
                      isDisabled || !allowDelete || (isFirst && isLast) ? "not-allowed" : "pointer",
                    color:
                      isDisabled || !allowDelete || (isFirst && isLast)
                        ? "#d9d9d9"
                        : "rgba(24, 27, 37, 1)"
                  }}
                />
              </div>
            </Col>
          )}
          {suffixChildren && (
            <Row className="w-full">
              <Col span={1}></Col>
              <Col span={22} style={{ paddingLeft: 4 }}>
                {suffixChildren}
              </Col>
              <Col span={1}></Col>
            </Row>
          )}
        </Row>
      </Row>
    </div>
  )
}
