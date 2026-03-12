/*
 * @Author: dyton
 * @Date: 2023-10-16 16:17:00
 * @Descripttion: c菜单+按钮权限管理
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-18 16:23:51
 * @FilePath: /za-aigc-platform-admin-static/src/pages/permission/MenuAuthManagement.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */

import { useEffect, useState } from "react"
import { Modal, Input, Button, Layout, message, Row, Col, Form, Select, Empty, Card } from "antd"
import { useDelMenuTree, useGetMenuTree, useGetMenuType, useSaveMenuTree } from "@/api/permission"
import "./MenuAuthManagement.less"
import EditableTree from "@/components/EditableTree"
import { useFormData } from "@/pages/xflow/hooks/useInputFormData"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
const { Item } = Form
const { Sider, Content } = Layout

export default () => {
  const { form } = useFormData()
  const [selectNode, setSelectNode] = useState({})
  const [selectedKeys, setSelectedKeys] = useState([])
  const [isMenu, setIsMenu] = useState(false)
  const { data: treeData = [] } = useGetMenuTree()
  const { data: types = [] } = useGetMenuType()
  const { mutate: saveMenuTree, isLoading } = useSaveMenuTree() //保存
  const { mutate: delMenuTree } = useDelMenuTree() //保存
  const queryClient = useQueryClient()
  const handlerTreeSelect = (selectedKeys, e) => {
    const { node } = e
    const active = node?.title?.props?.dataNode
    setSelectedKeys([...selectedKeys])
    setSelectNode(active)
  }

  useEffect(() => {
    if (treeData?.[0] && !selectNode?.resourceNo) {
      setSelectNode(treeData?.[0])
      setSelectedKeys([treeData?.[0]?.resourceNo])
    }
  }, [treeData])

  const onFinish = () => {
    return form.validateFields().then((values) => {
      saveMenuTree(
        {
          ...values,
          parentNo: selectNode?.parentNo,
          resourceNo: selectNode?.resourceNo
        },
        {
          onSuccess: (e) => {
            const { message: msg, data } = e
            if (e.success) {
              message.success("保存成功")
              setSelectedKeys([data])
              setSelectNode({ ...values, resourceNo: data })
              queryClient.invalidateQueries([QUERY_KEYS.AUTH_MENU_ROLE_TREE])
            } else {
              message.error(msg)
            }
          }
        }
      )
    })
  }
  // 添加同级
  const handlerAddSameNode = (dataNode) => {
    const obj = {
      name: undefined,
      code: undefined,
      resourceType: undefined,
      oprContent: `${dataNode?.name}-添加同级`,
      parentNo: dataNode?.parentNo
    }
    setSelectNode({ ...obj })
  }
  // 添加子级
  const handlerAddChildNode = (dataNode) => {
    const obj = {
      name: undefined,
      code: undefined,
      resourceType: undefined,
      oprContent: `${dataNode?.name}-添加子级`,
      parentNo: dataNode?.resourceNo
    }
    setSelectNode({ ...obj })
  }
  // 删除
  const handlerDelNode = (dataNode) => {
    const content = `确定要删除【${dataNode?.name}】吗？`
    Modal.confirm({
      title: "提示",
      content,
      onOk: () => {
        delMenuTree(dataNode?.resourceNo, {
          onSuccess: (e) => {
            const { message: msg } = e
            if (e.success) {
              message.success("删除成功")
              setSelectNode({})
              queryClient.invalidateQueries([QUERY_KEYS.AUTH_MENU_ROLE_TREE])
            } else {
              message.error(msg)
            }
          }
        })
      }
    })
  }

  useEffect(() => {
    form.setFieldsValue({ ...selectNode })
  }, [selectNode])
  return (
    <Layout className="menu-auth-container">
      {treeData?.length ? (
        <>
          <Sider className="menu-auth-sider">
            <EditableTree
              treeData={[...treeData]}
              onSelect={handlerTreeSelect}
              treeLoading={isLoading}
              selectedKeys={[...selectedKeys]}
              handlerAddSameNode={handlerAddSameNode}
              handlerAddChildNode={handlerAddChildNode}
              handlerDelNode={handlerDelNode}
            />
          </Sider>
          <Content className="menu-content">
            <Card title={selectNode?.oprContent ?? "编辑"}>
              <Form form={form} onFinish={onFinish} labelCol={{ span: 5 }}>
                <Row>
                  <Col span={24}>
                    <Item
                      name="name"
                      label="资源名称"
                      rules={[{ required: true, message: "请输入资源名称" }]}
                    >
                      <Input placeholder="请输入资源名称" />
                    </Item>
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Item
                      name="code"
                      label="资源CODE	"
                      rules={[{ required: true, message: "请输入资源CODE" }]}
                    >
                      <Input placeholder="请输入资源CODE" disabled={selectNode?.code} />
                    </Item>
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Item
                      name="resourceType"
                      label="资源类型"
                      rules={[{ required: true, message: "请选择类型" }]}
                    >
                      <Select placeholder="请选择类型">
                        {types.map((type) => (
                          <Select.Option key={type.code} value={type.code}>
                            {type.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Item>
                  </Col>
                </Row>
                <Row style={{ display: "none" }}>
                  <Col span={24}>
                    <Item name="orderNo" label="排序">
                      <Input placeholder="请输入资源排序" defaultValue={1} />
                    </Item>
                  </Col>
                </Row>
                <Row>
                  <Col span={24} style={{ textAlign: "center" }}>
                    <Item>
                      <Button type="primary" htmlType="submit" loading={isLoading}>
                        {selectNode?.code ? "保存" : "新增"}
                      </Button>
                    </Item>
                  </Col>
                </Row>
              </Form>
            </Card>
          </Content>
        </>
      ) : (
        <Empty description="请联系管理员配置初始菜单" style={{ marginTop: "50px" }}></Empty>
      )}
    </Layout>
  )
}
