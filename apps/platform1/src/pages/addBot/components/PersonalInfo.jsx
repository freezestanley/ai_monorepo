// @ts-nocheck
import {
  Form,
  Divider,
  Modal,
  Input,
  Select,
  Switch,
  Row,
  Col,
  Button,
  message,
  Checkbox,
  Radio,
  Space,
  DatePicker,
  Typography
} from "antd"
import { CheckCircleOutlined } from "@ant-design/icons"
import { useState, useLayoutEffect, memo, useMemo, useEffect } from "react"
import dayjs from "dayjs"
import AvatarSelect from "./AvatarSelect"
import { useCreateKnowledge, useFetchKnowledgeListByNamespace } from "@/api/knowledge"
import { useFetchBotInfo, useFetchAppPlatformList } from "@/api/bot"
import { useSaveBot, useUpdateBot } from "@/api/bot"
import { useNavigate, useParams } from "react-router-dom"
import { newAvatarList } from "@/assets/imgUrl"
import { avatarMode, DEFAULT_GREETING, AVATAR_ICON_TYPE, DEFAULTNAMESPACE } from "@/constants"
import { getAppUrl } from "@/api/sso"
import { getUserInfoFromSso, getDepartments, getCompanys } from "@/api/permission/api"
import { generateNO } from "@/utils"
import { useFetchTagList } from "@/api/batchTest"
import { useSearchUser } from "@/api/common"
import debounce from "lodash/debounce"
const { Link } = Typography
const { Option } = Select
const { TextArea } = Input
const CheckboxGroup = Checkbox.Group
const { RangePicker } = DatePicker
// 根据状态，显示可编辑的组件或者文本
const EditableField = memo(({ component: Component, fallback, value, disabled, ...rest }) => {
  if (disabled) {
    return fallback || value
  }
  return <Component value={value} {...rest} />
})

// useIsMutating
// useIsFetching
const PersonalInfo = ({
  form,
  setSelectedSpace,
  setKnowledgeBaseVisible,
  handleAvatarSelect,
  selectedAvatar,
  setIsModified,
  setSelectedKnowledgeBase,
  onCancel,
  setCurrentBotNo,
  setIsModalVisible,
  botDetails,
  isLoadingBotDetails,
  refetchBotDetails,
  defaultGreeting = DEFAULT_GREETING
}) => {
  const [visible, setVisible] = useState(false)
  const [newKnowledgeBaseName, setNewKnowledgeBaseName] = useState("")
  const [knowledgeBaseStatus, setKnowledgeBaseStatus] = useState("0")
  const [searchUsername, setSearchUsername] = useState("")
  const [adminInfo, setAdminInfo] = useState(null)
  const [adminUsernameError, setAdminUsernameError] = useState("")
  const [departments, setDepartments] = useState([])
  const [deptSearchValue, setDeptSearchValue] = useState("")
  const [foundDeptName, setFoundDeptName] = useState("")
  const [companies, setCompanies] = useState([]) // 公司列表
  const [selectedCompanyId, setSelectedCompanyId] = useState("") // 选中的公司ID
  const [companySelectKey, setCompanySelectKey] = useState(0) // 用于强制重新渲染Select组件
  const [deptSelectKey, setDeptSelectKey] = useState(0) // 用于强制重新渲染部门Select组件
  const { data: userOptions = [] } = useSearchUser(searchUsername)
  const today = dayjs()
  const forever = dayjs("2099-12-31")

  // 来一个强制更新的useState
  const [, updateState] = useState()
  const navigate = useNavigate()
  // 获取路由参数
  const { botNo } = useParams()
  // const {
  //   data: botDetails = {},
  //   isLoading: isLoadingBotDetails,
  //   refetch
  // } = useFetchBotInfo(botNo)
  const { data: tagList = [] } = useFetchTagList()
  // 根据表单选择的标签，获取知识库列表
  const { data: knowledgeList = [], refetch: refetchKnowledgeList } =
    useFetchKnowledgeListByNamespace()
  // const { data: chatModelList = [] } = useFetchChatModelList(botNo)
  const { mutateAsync: saveBot } = useSaveBot()
  const { mutateAsync: updateBot } = useUpdateBot()
  const { mutate: createKnowledge, isLoading } = useCreateKnowledge()
  const { data: appPlatformList = [] } = useFetchAppPlatformList()
  const generateBotNo = useMemo(() => {
    return generateNO("b")
  }, [])

  const { setFieldsValue } = form
  // 是否是编辑状态
  const isEdit = !!botNo

  // 创建防抖函数
  const debouncedSearch = useMemo(() => debounce((value) => setSearchUsername(value), 500), [])

  // 组件卸载时取消防抖
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // 使用防抖处理部门搜索
  const debouncedDeptSearch = useMemo(
    () =>
      debounce(async (value) => {
        if (!value || !selectedCompanyId) return

        try {
          // 只有当value非空时才调用搜索
          const response = await getDepartments({ companyId: selectedCompanyId })
          if (response && response.data) {
            setDepartments(
              response.data.map((dept) => ({
                label: dept.name,
                value: String(dept.id || dept.deptId), // 将ID转为字符串
                dept: dept
              }))
            )
          }
        } catch (error) {
          console.error("获取部门列表失败", error)
          setDepartments([])
        }
      }, 500),
    [selectedCompanyId]
  )

  // 组件卸载时取消防抖
  useEffect(() => {
    return () => {
      debouncedDeptSearch.cancel()
    }
  }, [debouncedDeptSearch])

  // 初始加载公司列表
  useEffect(() => {
    // 获取公司列表
    getCompanys()
      .then((response) => {
        if (response && response.data) {
          console.log("公司数据:", response.data)
          const companyList = response.data.map((company) => ({
            label: company.name,
            value: String(company.id || company.companyId), // 将ID转为字符串类型
            company: company
          }))
          setCompanies(companyList)

          // 如果有botDetails且有tenantId，确保公司能正确回显
          if (botDetails && botDetails.tenantId) {
            // 重新设置一下公司ID，确保下拉框能正确显示选中的公司
            const tenantIdStr = String(botDetails.tenantId) // 转为字符串确保一致
            setSelectedCompanyId(tenantIdStr)
            form.setFieldsValue({ companyId: tenantIdStr })
            // 强制重新渲染Select组件
            setCompanySelectKey((prev) => prev + 1)

            // 如果有公司ID，不管是否有部门ID，都加载该公司的部门列表
            getDepartments({ companyId: botDetails.tenantId })
              .then((deptResponse) => {
                if (deptResponse && deptResponse.data) {
                  const deptList = deptResponse.data.map((dept) => ({
                    label: dept.name,
                    value: String(dept.id || dept.deptId), // 将ID转为字符串类型
                    dept: dept
                  }))
                  setDepartments(deptList)

                  // 如果有部门ID，设置部门选中值
                  if (botDetails.deptId) {
                    const deptIdStr = String(botDetails.deptId) // 转为字符串确保一致
                    form.setFieldsValue({ deptInfo: deptIdStr })
                    // 强制重新渲染部门Select组件
                    setDeptSelectKey((prev) => prev + 1)

                    // 找到对应的部门名称并显示
                    const matchedDept = deptList.find((d) => d.value === deptIdStr)
                    if (matchedDept) {
                      setFoundDeptName(matchedDept.label)
                    } else if (botDetails.deptName) {
                      setFoundDeptName(botDetails.deptName)
                    }
                  }
                }
              })
              .catch((error) => {
                console.error("获取部门列表失败", error)
              })
          }
        }
      })
      .catch((error) => {
        console.error("获取公司列表失败", error)
      })
  }, [botDetails, form])

  // 当选择公司变化时，清空已选部门并加载该公司的部门列表
  const handleCompanyChange = (companyId) => {
    console.log("处理公司变更, 公司ID:", companyId)
    if (!companyId) {
      setSelectedCompanyId("")
      form.setFieldsValue({ deptInfo: undefined, deptInfoObject: undefined })
      setFoundDeptName("")
      setDepartments([])
      setDeptSelectKey(Date.now())
      return
    }

    const companyIdStr = String(companyId) // 统一转为字符串处理
    setSelectedCompanyId(companyIdStr)
    form.setFieldsValue({ deptInfo: undefined, deptInfoObject: undefined })
    setFoundDeptName("")
    setDeptSelectKey(Date.now())

    // 加载该公司的部门列表
    getDepartments({ companyId: companyId })
      .then((response) => {
        console.log("获取到部门列表:", response?.data)
        if (response && response.data) {
          setDepartments(
            response.data.map((dept) => ({
              label: dept.name,
              value: String(dept.id || dept.deptId), // 将ID转为字符串类型
              dept: dept
            }))
          )
        }
      })
      .catch((error) => {
        console.error("获取部门列表失败", error)
        setDepartments([])
      })
  }

  useLayoutEffect(() => {
    if (botDetails && !isLoadingBotDetails) {
      // 根据获取到的bot信息，设置表单的初始值
      const {
        botNo,
        botIconUrl: url,
        icon,
        botName,
        botCode,
        status,
        tags: space,
        knowledgeBaseNo,
        description,
        chatModel,
        applicationPlatformTypes,
        greeting,
        remark,
        enableDate,
        disableDate,
        adminUsername,
        deptId, // 部门ID
        deptName, // 部门名称
        tenantId, // 租户/公司ID
        tenantName // 租户/公司名称
      } = botDetails
      const effectiveIconUrl = icon?.iconURL || url
      const effectiveIcon = icon || {
        iconURL: effectiveIconUrl,
        iconType: newAvatarList.includes(effectiveIconUrl)
          ? AVATAR_ICON_TYPE.SYSTEM
          : AVATAR_ICON_TYPE.CUSTOM
      }
      const expire = [
        enableDate ? dayjs(enableDate) : today,
        disableDate ? dayjs(disableDate) : today.add(30, "d")
      ]

      // 设置表单值
      setFieldsValue({
        botName: botName,
        botCode: botCode,
        status: status === 1,
        botIconUrl: effectiveIconUrl,
        icon: effectiveIcon,
        space: space?.map((item) => item.tagNo),
        knowledgeBaseNo: knowledgeBaseNo || undefined,
        description,
        chatModel,
        applicationPlatformTypes: applicationPlatformTypes || [],
        greeting: greeting || defaultGreeting,
        remark: remark || "",
        botNo,
        expire,
        adminUsername,
        companyId: tenantId, // 设置公司ID
        deptInfo: deptId // 设置部门ID
      })

      // 设置选中的公司ID，触发部门加载
      if (tenantId) {
        setSelectedCompanyId(tenantId)
      }

      // 当有部门信息时，设置部门对象
      if (deptId) {
        // 构造部门对象
        const deptObject = {
          id: deptId,
          name: deptName || "",
          companyName: tenantName || "",
          companyAsdepartmentId: tenantId
        }

        // 设置部门对象
        setFieldsValue({
          deptInfoObject: deptObject
        })

        // 设置部门名称显示
        if (deptName) {
          setFoundDeptName(deptName)
        }
      }

      // 处理其他表单初始化
      if (adminUsername) {
        validateAdminUsername(adminUsername)
      }

      if (space) {
        setSelectedSpace(space)
      }

      if (icon) {
        handleAvatarSelect(icon)
      }
    } else {
      setFieldsValue({ greeting: defaultGreeting })
    }
  }, [botDetails, isLoadingBotDetails, form, setSelectedKnowledgeBase, setSelectedSpace])

  // 处理部门选择变更
  const handleDeptChange = (deptId) => {
    if (!deptId) {
      form.setFieldsValue({ deptInfoObject: undefined })
      setFoundDeptName("")
      return
    }

    const deptIdStr = String(deptId) // 统一转为字符串处理

    // 查找选中的部门对象
    const selectedDept = departments.find((item) => String(item.value) === deptIdStr)
    if (selectedDept && selectedDept.dept) {
      // 查找选中的公司对象
      const selectedCompanyStr = String(selectedCompanyId)
      const selectedCompany = companies.find((item) => String(item.value) === selectedCompanyStr)

      // 构造完整的部门对象，包含所需的4个字段
      const deptObject = {
        id: selectedDept.dept.id || selectedDept.dept.deptId, // 保留原始ID类型
        name: selectedDept.dept.name,
        companyName: selectedCompany ? selectedCompany.label : "",
        companyAsdepartmentId: selectedCompanyId
      }

      // 设置部门对象到表单
      form.setFieldsValue({ deptInfoObject: deptObject })
      setFoundDeptName(selectedDept.label)
    }
  }

  const showModal = () => {
    setVisible(true)
  }
  const handleOk = () => {
    createKnowledge(
      {
        name: newKnowledgeBaseName,
        tags: form.getFieldValue("space"),
        namespace: DEFAULTNAMESPACE
      },
      {
        onSuccess: (d) => {
          if (d.success) {
            refetchKnowledgeList()
            setFieldsValue({
              knowledgeBaseNo: d.data.knowledgeBaseNo
            })
            setVisible(false)
            message.success(d.message)
          } else {
            message.error(d.message)
          }
        },
        onError: (error) => {
          console.warn(error)
          // 这里可以处理错误，例如显示一个错误消息
        }
      }
    )
  }
  const handleCancel = () => {
    setVisible(false)
  }

  const dropdownRender = (menu) => (
    <div>
      {menu}
      <Divider />
      <div
        style={{ padding: "8px", cursor: "pointer", paddingTop: 0 }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={showModal}
      >
        <Link>新建知识库</Link>
      </div>
    </div>
  )

  const onKnowledgeBaseChange = (e) => {
    setKnowledgeBaseStatus(e.target.value)
  }

  const onFinish = async (values) => {
    const botIconUrl = values.botIconUrl

    const enableDate = values.expire?.[0].format("YYYY-MM-DD") || ""
    const disableDate = values.expire?.[1].format("YYYY-MM-DD") || forever.format("YYYY-MM-DD")

    // 获取完整的部门对象
    const deptObject = form.getFieldValue("deptInfoObject")

    const botDetails = {
      botNo: botNo || values.botNo,
      tenantId: values.companyId, // 使用选择的公司ID
      tenantName: companies.find((c) => c.value === values.companyId)?.label || "",
      status: values.status ? 1 : 0,
      botIconUrl,
      icon: form.getFieldValue("icon") ?? {
        iconURL: botIconUrl,
        iconType: [...newAvatarList].includes(botIconUrl)
          ? AVATAR_ICON_TYPE.SYSTEM
          : AVATAR_ICON_TYPE.CUSTOM
      },
      botName: values.botName,
      botCode: values.botCode,
      knowledgeBaseNo: values.knowledgeBaseNo,
      description: values.description,
      tags: values.space,
      chatModel: values.chatModel,
      namespaceDisplayName: tagList.find((space) => space.tagNo === values.space)?.name,
      applicationPlatformTypes: values.applicationPlatformTypes,
      greeting: values.greeting,
      remark: values.remark,
      adminUsername: values.adminUsername,
      deptInfo: deptObject, // 提交完整的部门对象
      enableDate,
      disableDate
    }

    const fetch = isEdit ? updateBot : saveBot
    try {
      const { success, ...d } = await fetch(botDetails)
      if (success) {
        message.success(d.message)
        if (botDetails.knowledgeBaseNo) {
          setKnowledgeBaseVisible(true)
          setSelectedKnowledgeBase(botDetails.knowledgeBaseNo)
        } else {
          setKnowledgeBaseVisible(false)
          setSelectedKnowledgeBase("")
        }
        if (botDetails.tags) {
          setSelectedSpace(botDetails.tags)
        }

        setIsModified(false)
        // d.data为botNo,需要添加到路由上去
        if (d.data) {
          navigate(`/addBot/${d.data}`)
          setCurrentBotNo(d.data)
        } else {
          refetchBotDetails()
        }
      } else {
        message.error(d.message)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const creatingAndHasSpace = !isEdit && form.getFieldValue("space")
  const knowledgeBaseName = knowledgeList.find(
    (item) => item.knowledgeBaseNo === form.getFieldValue("knowledgeBaseNo")
  )?.knowledgeBaseName

  const editingAndHasNotKnowledgeBase = isEdit && !botDetails.knowledgeBaseNo

  const copyLink = useMemo(() => {
    if (botNo) {
      return `${getAppUrl()}/chat?botNo=${botNo}`
    }
    return ""
  }, [botNo])

  const handleCopy = (text) => {
    if (botNo) {
      const textarea = document.createElement("textarea")
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      message.success("已复制！")
    } else {
      message.info("点击右上角保存按钮后即可生成链接")
    }
  }

  const rangePresets = [
    { label: "未来 30 天", value: [today, dayjs().add(30, "d")] },
    { label: "未来 90 天", value: [today, dayjs().add(90, "d")] },
    { label: "永久", value: [today, forever] }
  ]

  const onRangeChange = (dates, dateStrings) => {
    if (dates) {
      console.log("From: ", dateStrings[0], ", to: ", dateStrings[1])
    } else {
      console.log("Clear")
    }
  }

  const onCheckboxGroupChange = (checkedValue) => {}

  // 验证管理员域账号
  const validateAdminUsername = async (username) => {
    if (!username) {
      setAdminInfo(null)
      setAdminUsernameError("")
      return
    }

    try {
      // 修改接口调用方式，确保传递正确的参数格式
      const response = await getUserInfoFromSso({ username })
      if (response && response?.data?.username) {
        setAdminInfo(response.data)
        setAdminUsernameError("")
      } else {
        setAdminInfo(null)
        setAdminUsernameError("域账号不存在")
      }
    } catch (error) {
      console.error("验证域账号失败", error)
      setAdminInfo(null)
      setAdminUsernameError("验证域账号失败")
    }
  }

  return (
    <Form
      onValuesChange={(changedValues) => {
        setIsModified(true)
        // 监听公司变化
        if ("companyId" in changedValues) {
          handleCompanyChange(changedValues.companyId)
        }
        // 监听部门变化
        if ("deptInfo" in changedValues) {
          handleDeptChange(changedValues.deptInfo)
        }
      }} // 当表单发生变化时，设置 isModified 为 true
      form={form}
      layout="vertical"
      onFinish={onFinish}
      // labelCol={{
      //   xs: { span: 24 },
      //   sm: { span: 2 }
      // }}
    >
      <Row className="mb-8 mt-4" justify="end">
        <Col>
          <Button className="mr-3" type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
            保存
          </Button>
        </Col>
      </Row>
      <Form.Item
        label="状态"
        name="status"
        valuePropName="checked"
        initialValue={false}
        rules={[{ required: true, message: "请选择" }]}
      >
        <EditableField
          component={Switch}
          fallback={form.getFieldValue("status") ? "启用" : "停用"}
          checkedChildren="启用"
          unCheckedChildren="停用"
        />
      </Form.Item>
      <Form.Item
        label="空间名称"
        name="botName"
        // 最多10个字
        rules={[
          { required: true, message: "请输入空间名称" },
          { max: 12, message: "最多12个字" }
        ]}
      >
        <EditableField
          component={Input}
          fallback={form.getFieldValue("botName")}
          style={{ width: 450 }}
        />
      </Form.Item>

      <Form.Item
        label="空间编号"
        name="botNo"
        initialValue={generateBotNo}
        // 最多10个字
        rules={[{ required: true, message: "请输入空间编号" }]}
      >
        <EditableField
          disabled={!!isEdit}
          component={Input}
          fallback={form.getFieldValue("botNo")}
          style={{ width: 450 }}
        />
      </Form.Item>

      <Form.Item label="标签" name="space" rules={[{ required: false, message: "请选择标签" }]}>
        <EditableField
          component={Select}
          mode="multiple"
          fallback={tagList.find((item) => item.tagNo === form.getFieldValue("space"))?.name}
          style={{ width: 450 }}
          placeholder="请选择"
          optionFilterProp="label"
          options={tagList.map((space) => ({
            value: space.tagNo,
            label: space.value
          }))}
        />
      </Form.Item>
      <Form.Item
        label="知识库"
        rules={[{ required: false, message: "请选择知识库" }]}
        // className="mb-0"
      >
        <Space direction="vertical">
          <Radio.Group
            disabled={isEdit && botDetails.knowledgeBaseNo}
            onChange={onKnowledgeBaseChange}
            value={isEdit && botDetails.knowledgeBaseNo ? "1" : knowledgeBaseStatus}
          >
            <Radio value="0">无知识库</Radio>
            <Radio value="1">有知识库</Radio>
          </Radio.Group>

          {(knowledgeBaseStatus === "1" || (isEdit && botDetails.knowledgeBaseNo)) && (
            <Form.Item name="knowledgeBaseNo" className="mb-0">
              <Select
                value={knowledgeBaseName}
                disabled={isEdit && botDetails.knowledgeBaseNo}
                dropdownRender={dropdownRender}
                allowClear
                className="mt-2"
                style={{ width: 450 }}
                placeholder={isEdit ? "请选择知识库" : "新建空间请新建知识库"}
                options={knowledgeList.map((base) => ({
                  value: base.knowledgeBaseNo,
                  label: base.knowledgeBaseName,
                  disabled: true
                }))}
              />
            </Form.Item>
          )}
        </Space>
      </Form.Item>
      <Form.Item label="应用端" name="applicationPlatformTypes">
        <CheckboxGroup
          options={appPlatformList.map((item) => ({
            label: item.name,
            value: item.code
          }))}
          value={appPlatformList.map((item) => item.code)}
          onChange={onCheckboxGroupChange}
        />
      </Form.Item>
      <Form.Item label="说明" name="description" rules={[{ max: 200, message: "最多200个字" }]}>
        <EditableField
          component={TextArea}
          fallback={form.getFieldValue("description")}
          style={{ width: 450 }}
          placeholder="请输入说明，最多不超过200字。"
        />
      </Form.Item>
      <Form.Item
        label="空间头像"
        name="botIconUrl"
        rules={[{ required: true, message: "请选择头像" }]}
        initialValue={newAvatarList[0]}
      >
        <AvatarSelect
          mode={avatarMode.bot}
          selectedAvatar={selectedAvatar}
          handleAvatarSelect={handleAvatarSelect}
        />
      </Form.Item>
      <Form.Item label="欢迎语" name="greeting" rules={[{ max: 200, message: "最多200个字" }]}>
        <EditableField
          component={TextArea}
          fallback={form.getFieldValue("greeting")}
          style={{ width: 450 }}
          placeholder="请输入欢迎语，最多不超过200字。"
        />
      </Form.Item>
      <Form.Item
        label="空间有效期"
        name="expire"
        initialValue={[today, today.add(30, "d")]}
        rules={[{ required: true, message: "请选择空间有效期" }]}
      >
        <RangePicker presets={rangePresets} disabled={[true, false]} onChange={onRangeChange} />
      </Form.Item>
      <Form.Item
        label="管理员域账号"
        name="adminUsername"
        rules={[{ required: false }]}
        validateStatus={adminUsernameError ? "error" : adminInfo ? "success" : ""}
        help={adminUsernameError || ""}
      >
        <Input
          style={{ width: 450 }}
          placeholder="请输入管理员域账号"
          onBlur={(e) => validateAdminUsername(e.target.value)}
        />
      </Form.Item>
      {adminInfo && !adminUsernameError && (
        <div style={{ marginTop: -10, marginBottom: 10 }}>
          <span style={{ color: "#52c41a" }}>✓ {adminInfo.name}</span>
          {adminInfo.email && (
            <span style={{ marginLeft: 8, color: "#666" }}>邮箱: {adminInfo.email}</span>
          )}
          {adminInfo.mobile && (
            <span style={{ marginLeft: 8, color: "#666" }}>手机: {adminInfo.mobile}</span>
          )}
        </div>
      )}

      {/* 添加归属公司选择 */}
      <Form.Item label="归属公司" name="companyId">
        <Select
          key={companySelectKey}
          showSearch
          allowClear
          style={{ width: 450 }}
          placeholder="请选择归属公司"
          filterOption={(input, option) => {
            if (!input) return true
            const company = option?.company || {}
            const inputLower = input.toLowerCase()

            // 支持通过ID、编码或名称搜索
            return (
              (option?.label || "").toLowerCase().includes(inputLower) ||
              String(company.id || "").includes(input) ||
              String(company.companyId || "").includes(input) ||
              String(company.code || "")
                .toLowerCase()
                .includes(inputLower)
            )
          }}
          options={companies.map((item) => ({
            ...item,
            company: item.company
          }))}
          onChange={(value) => {
            console.log("选择的公司ID:", value)
            form.setFieldsValue({ companyId: value })
            handleCompanyChange(value)
          }}
        />
      </Form.Item>

      <Form.Item label="空间归属事业部" name="deptInfo" rules={[{ required: false }]}>
        <Select
          key={deptSelectKey}
          showSearch
          allowClear
          style={{ width: 450 }}
          placeholder="请先选择归属公司，请选择或搜索空间归属事业部"
          defaultActiveFirstOption={false}
          showArrow={true}
          filterOption={(input, option) => {
            if (!input) return true
            const dept = option?.dept || {}
            const inputLower = input.toLowerCase()

            return (
              (option?.label || "").toLowerCase().includes(inputLower) ||
              String(dept.id || dept.deptId || "").includes(input) ||
              String(dept.code || "")
                .toLowerCase()
                .includes(inputLower)
            )
          }}
          onSearch={(value) => {
            setDeptSearchValue(value)
            // 只有当输入的搜索值非空且已选择公司时，才调用搜索
            if (value && selectedCompanyId) {
              debouncedDeptSearch(value)
            }
          }}
          options={departments.map((item) => ({
            ...item,
            dept: item.dept
          }))}
          onChange={(value) => {
            console.log("选择的部门ID:", value)
            form.setFieldsValue({ deptInfo: value })
            handleDeptChange(value)
          }}
          disabled={!selectedCompanyId} // 当未选择公司时禁用部门选择
        />
      </Form.Item>

      {/* 添加隐藏的表单项存储完整部门对象 */}
      <Form.Item name="deptInfoObject" hidden={true}>
        <Input />
      </Form.Item>

      <Form.Item label="备注" name="remark" rules={[{ max: 1000, message: "最多1000个字" }]}>
        <EditableField
          component={TextArea}
          fallback={form.getFieldValue("remark")}
          style={{ width: 450 }}
          placeholder="请简述【管理员姓名/邮箱手机号】【所属业务部门】【开通用途】，应用端不可见，最多 1000 字"
        />
      </Form.Item>
      <Form.Item label="应用端链接">
        <Space direction="vertical">
          {isEdit && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                handleCopy(copyLink)
              }}
              style={{
                fontSize: 13
              }}
            >
              复制链接
            </Button>
          )}

          <TextArea
            disabled={true}
            value={copyLink}
            style={{ width: 450, fontSize: 13, whiteSpace: "break-spaces" }}
            placeholder="点击右上角保存按钮后即可生成链接"
          />
        </Space>
      </Form.Item>
      <Modal open={visible} onOk={handleOk} onCancel={handleCancel} confirmLoading={isLoading}>
        <Form layout="vertical">
          <Form.Item
            label="知识库名称"
            name="knowledgeBaseName"
            rules={[{ required: true, message: "请输入知识库名称" }]}
          >
            <Input onChange={(e) => setNewKnowledgeBaseName(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </Form>
  )
}

export default PersonalInfo
