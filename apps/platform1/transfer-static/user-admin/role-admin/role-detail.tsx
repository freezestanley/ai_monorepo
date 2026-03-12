import BackNav from "../../components/back-nav"
import { SingleTreeCheckBoxItem, TreeMultiCheckBoxItem } from "../../components/tree-check"
import useRouter from "../../hooks/useRouter"
import {
  getBotMenuTree,
  createCustomRole,
  getRoleDetail,
  editCustomRole,
  getChannelList,
  listResource
} from "../../services/userAdmin"
import { getQueryParameters } from "../../utils/token"
import { ExclamationCircleFilled } from "@ant-design/icons"
import { Row, Col, Divider, Card, Form, Button, Input, message, Modal } from "antd"
import { useEffect, useState } from "react"

// 对应tree-check组件中的code字段，用于细粒度权限控制
const fineGrainedAccessControlCodeList: string[] = ["appKnowledgeList"]

function RoleDetail() {
  const urlState = getQueryParameters()
  const botNo = urlState?.botNo
  const roleNo = urlState?.roleNo

  const [form] = Form.useForm()
  const [menuTree, setMenuTree] = useState<any[]>([])
  const [readonly, setReadonly] = useState<boolean>(false)
  const [initialValues, setInitialValues] = useState<any>({})
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [showCustomErrorTip, setShowCustomErrorTip] = useState<boolean>(false)
  const [customSelectOptions, setCustomSelectOptions] = useState<any[]>([])
  const [sceneTagListOptions, setSceneTagListOptions] = useState<any[]>([])
  const [buttonEditOptions, setButtonEditOptions] = useState<any[]>([])
  const [disabled, setDisabled] = useState<boolean>(false)
  const { navigatePush } = useRouter()

  const fetchData = async () => {
    const [sourceTagListResult = [], sceneTagList = [], menuTreeResult = []] = await Promise.all([
      getChannelList({ botNo, dataType: "SOURCE_TAG" }),
      getChannelList({ botNo, dataType: "SCENE_TAG" }),
      getBotMenuTree({ botNo })
    ])

    setMenuTree(menuTreeResult[0].child)

    const customSelectOptions = sourceTagListResult.map((item: any) => {
      return { value: item.resourceNo, label: item.name }
    })
    const sceneSelectOptions = sceneTagList.map((item: any) => {
      return { value: item.resourceNo, label: item.name }
    })
    setCustomSelectOptions(customSelectOptions)
    setSceneTagListOptions(sceneSelectOptions)
  }

  useEffect(() => {
    fetchData()
  }, [botNo])

  // 监听 menuTree 变化，获取按钮列表
  useEffect(() => {
    const fetchButtonList = async () => {
      if (menuTree?.length > 0) {
        // 在 child 中查找知识管理菜单
        const knowledgeMenu = menuTree
          .find((menu: any) => menu.child?.some((child: any) => child.code === "appKnowledgeList"))
          ?.child?.find((child: any) => child.code === "appKnowledgeList")

        if (knowledgeMenu) {
          try {
            const buttonResult = await listResource({
              botNo,
              type: "BUTTON",
              parentNo: knowledgeMenu.resourceNo
            })

            console.log("buttonOptions", buttonResult)
            const buttonOptions =
              buttonResult
                ?.map((item: any) => {
                  // 遍历 child 数组，获取按钮选项
                  return {
                    code: item.code,
                    label: item.name,
                    value: item.resourceNo
                  }
                })
                .flat() || []

            setButtonEditOptions(buttonOptions)
          } catch (error) {
            console.error("获取按钮编辑权限选项失败:", error)
          }
        }
      }
    }
    fetchButtonList()
  }, [menuTree, botNo])

  useEffect(() => {
    if (roleNo && menuTree.length > 0) {
      getRoleDetail({ roleNo }).then((result: any) => {
        const treeData: any = {}
        const theCheckResourceNoList =
          result.menuOrButtons?.map((item: any) => item.resourceNo) || []
        const botDataResourcesList =
          result.botDataResources?.map((item: any) => item.resourceNo) || []
        if (result.roleType !== "CUSTOM") {
          setReadonly(true)
        }
        menuTree.map((tree: any) => {
          if (tree.resourceNo && tree.child?.length > 0) {
            treeData[tree.resourceNo] = {
              checked: {}
            }
            const childLength = tree.child.length
            let childCount = 0
            tree.child.forEach((child: any) => {
              if (child.resourceNo && theCheckResourceNoList?.includes(child.resourceNo)) {
                treeData[tree.resourceNo]["checked"][child.resourceNo] = true
                childCount++
                if (fineGrainedAccessControlCodeList.includes(child.code)) {
                  const selectedOptions = customSelectOptions
                    .filter((item: any) => {
                      return botDataResourcesList?.includes(item.value)
                    })
                    .map((s: any) => s.value)
                  // 修复选择来源字段的回显 - 字段名应该与表单中的name属性一致
                  // 表单中使用的是 [filedKey, option.value]，这里应该对应 child.resourceNo
                  treeData[tree.resourceNo][child.resourceNo] = {
                    type: selectedOptions.length ? "partial" : "all",
                    selectedOptions: selectedOptions
                  }
                  const selectedSceneTagOptions = sceneTagListOptions
                    .filter((item: any) => {
                      return botDataResourcesList?.includes(item.value)
                    })
                    .map((s: any) => s.value)
                  treeData[tree.resourceNo]["sceneTag"] = {
                    type: selectedSceneTagOptions.length ? "partial" : "all",
                    selectedOptions: selectedSceneTagOptions
                  }

                  const selectedButtonEditOptions = buttonEditOptions
                    .map((item: any) => item.value)
                    .filter((item: any) => theCheckResourceNoList?.includes(item))
                  // 给按钮权限赋值
                  treeData[tree.resourceNo]["bizSources"] = selectedButtonEditOptions
                }
              }
            })
            treeData[tree.resourceNo]["checkAll"] = childCount === childLength
          } else if (tree.resourceNo) {
            treeData[tree.resourceNo] = theCheckResourceNoList?.includes(tree.resourceNo)
              ? true
              : false
          }
        })
        const initialValues = {
          roleName: result.roleName,
          description: result.description,
          ...treeData
        }
        form.setFieldsValue(initialValues)
        setInitialValues(initialValues)
      })
    }
  }, [menuTree, roleNo, customSelectOptions, buttonEditOptions])

  const onBackClick = () => {
    const currentValues = form.getFieldsValue()
    if (JSON.stringify(initialValues) !== JSON.stringify(currentValues)) {
      if (!isModalVisible) {
        Modal.confirm({
          title: "请确认您的修改是否已经保存",
          icon: <ExclamationCircleFilled />,
          content: "点击【确认】则返回角色列表页，点击【取消】则取消返回",
          onOk() {
            navigatePush("/user/admin/role/list")
          },
          onCancel() {},
          afterClose: () => setIsModalVisible(false) // 当 Modal 关闭时，更新状态
        })
      }
    } else {
      navigatePush("/user/admin/role/list")
    }
  }

  const onFinish = async () => {
    const values = form.getFieldsValue()
    const tempValues = { ...values }
    try {
      await form.validateFields()
    } catch (errorInfo) {
      message.error("请检查是否有未填的选项！")
      console.log("Failed:", errorInfo)
      return
    }
    try {
      const menuOrButtonsSet = new Set<string>() // 使用Set来存储唯一的resourceNo

      for (const key in values) {
        if (values[key] === true) {
          menuOrButtonsSet.add(key)
        } else if (typeof values[key] === "object") {
          // 处理checked数据
          if (typeof values[key]["checked"] === "object") {
            for (const k in values[key]["checked"]) {
              if (values[key]["checked"][k] === true) {
                // 父级别写入
                menuOrButtonsSet.add(key)
                menuOrButtonsSet.add(k)
                if (!disabled) {
                  // 处理自定义选择器数据
                  if (typeof values[key][k] === "object" && values[key][k]["type"] === "partial") {
                    values[key][k]["selectedOptions"].forEach((item: any) => {
                      menuOrButtonsSet.add(item)
                    })
                    if (values[key][k]["selectedOptions"]?.length === 0) {
                      return false
                    }
                  }
                  if (
                    typeof values[key]["sceneTag"] === "object" &&
                    values[key]["sceneTag"]["type"] === "partial"
                  ) {
                    values[key]["sceneTag"]["selectedOptions"].forEach((item: any) => {
                      menuOrButtonsSet.add(item)
                    })
                    if (values[key]["sceneTag"]["selectedOptions"]?.length === 0) {
                      return false
                    }
                  }
                  // 处理 bizSources 字段
                  if (values[key]["bizSources"]?.length > 0) {
                    values[key]["bizSources"].forEach((bizSource: string) => {
                      menuOrButtonsSet.add(bizSource)
                    })
                  }
                }
              }
            }
          }
        }
      }

      // 将Set转换为所需的对象数组格式
      const menuOrButtonsArray = Array.from(menuOrButtonsSet).map((resourceNo) => ({ resourceNo }))

      const submitData: any = {
        botNo,
        roleName: values.roleName,
        description: values.description,
        menuOrButtons: menuOrButtonsArray
      }
      if (menuOrButtonsArray.length < 1) {
        setShowCustomErrorTip(true)
        message.warning("请构选自定义角色权限", 3)
        return
      }
      setShowCustomErrorTip(false)
      let result: any = ""
      if (roleNo) {
        result = await editCustomRole({ ...submitData, roleNo })
      } else {
        result = await createCustomRole(submitData)
      }
      setInitialValues(tempValues)
      console.log("result:", result)
      message.success("操作成功！")
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "10px" }}>
        <Row gutter={[20, 10]} justify="center">
          <Col span={24} style={{ padding: "0 10px", position: "sticky", top: 0, zIndex: 9 }}>
            <BackNav
              url="/user/admin/role/list"
              onClick={onBackClick}
              title={roleNo ? (readonly ? "查看角色" : "编辑角色") : "新增角色"}
              rightSection={
                <Button type="primary" onClick={onFinish} disabled={readonly}>
                  保存
                </Button>
              }
            />
          </Col>
          <Col
            span={24}
            style={{
              backgroundColor: "#f7f8fa",
              borderRadius: 10,
              height: "calc(100vh - 100px)",
              overflowY: "auto",
              padding: 10,
              background: "#fff"
            }}
          >
            <Card style={{ padding: "20px" }}>
              <Form
                form={form}
                wrapperCol={{ span: 24 }}
                initialValues={{ remember: true }}
                autoComplete="off"
              >
                <Divider orientation="left" style={{ fontSize: 20 }} orientationMargin="0">
                  {readonly ? "角色设置" : "自定义角色设置"}
                </Divider>
                <Form.Item
                  label="角色名称"
                  name="roleName"
                  rules={[{ required: true, message: "请输入角色名称" }]}
                >
                  <Input placeholder="请输入角色名称" maxLength={20} disabled={readonly} />
                </Form.Item>
                <Form.Item
                  label="角色描述"
                  name="description"
                  rules={[{ required: true, message: "请输入角色描述" }]}
                >
                  <Input.TextArea
                    placeholder="请输入角色描述"
                    maxLength={200}
                    disabled={readonly}
                  />
                </Form.Item>

                <Divider
                  orientation="left"
                  style={{ fontSize: 20 }}
                  type="horizontal"
                  orientationMargin="0"
                >
                  <div className="flex-row-center">
                    {readonly ? "角色权限" : "自定义角色权限"}
                    {showCustomErrorTip && (
                      <span style={{ color: "#ff0100", marginLeft: 10, fontSize: 14 }}>
                        {" "}
                        * 请构选自定义角色权限
                      </span>
                    )}
                  </div>
                </Divider>
                {menuTree.map((item: any) => {
                  if (item.child && item.child.length > 0) {
                    return (
                      <TreeMultiCheckBoxItem
                        key={item.resourceNo}
                        type={item.type}
                        readonly={readonly}
                        options={item.child.map((child: any) => {
                          return {
                            label: child.name,
                            value: child.resourceNo,
                            disabled: false,
                            code: child.code
                          }
                        })}
                        filedDisplayName={item.name}
                        filedKey={item.resourceNo}
                        form={form}
                        code={item.code}
                        isEdit={!!roleNo}
                        customSelectOptions={customSelectOptions}
                        sceneTagListOptions={sceneTagListOptions}
                        buttonEditOptions={buttonEditOptions}
                        isDisabledChange={(value: any) => {
                          setDisabled(value)
                        }}
                      />
                    )
                  } else {
                    return (
                      <SingleTreeCheckBoxItem
                        key={item.resourceNo}
                        type={item.resourceType}
                        readonly={readonly}
                        filedDisplayName={item.name}
                        filedKey={item.resourceNo}
                        form={form}
                        code={item.code}
                      />
                    )
                  }
                })}
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default RoleDetail
