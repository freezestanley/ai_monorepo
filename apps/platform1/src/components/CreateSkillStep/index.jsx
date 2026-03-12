// @ts-ignore
import { useState, useEffect } from "react"
import { Modal, Form, Input, Radio, Button, message, Select } from "antd"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import "./index.scss"
import { useFetchSkillType } from "@/api/common"
import { useCreateSkill, useDeleteTemplateSkill, useFetchSkillTemplate } from "@/api/skill"
import { fetchDifyToken } from "@/api/skill/api"
import { skillAvatarList } from "@/assets/imgUrl"
import { useFetchAppPlatformList } from "@/api/bot"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { AVATAR_ICON_TYPE } from "@/constants"
import CarouselWrapper from "./TemplateList"
import { useMemo } from "react"
import { generateNO } from "@/utils"
import SecurityPolicySwitch from "../SecurityPolicySwitch"
import { customTemplateList } from "./constants"
import { useFetchSourceTagList } from "@/api/sourceTag"
import { getDifyUrl as getDifyUrlPath } from "@/config.env"
import { getTokenAndServiceName } from "@/api/sso"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

export const getDifyToken = async (botNo) => {
  const res = await fetchDifyToken({ botNo })
  const { data, message: msg } = res
  if (res?.success) {
    return {
      difyData: data,
      getDifyUrl: (appId, skillNo, isOpenVersion) => {
        let url = `${getDifyUrlPath()}/app/${appId}/workflow?channel=za-aigc-platform&skillNo=${skillNo}&token=${encodeURIComponent(getTokenAndServiceName().token || "")}&csrf_token=${data.csrf_token || ""}&refresh_token=${data.refresh_token || ""}&access_token=${data.access_token || ""}`
        if (isOpenVersion) {
          url += `&isOpenVersion=${isOpenVersion}`
        }
        return url
      }
    }
  }
  message.error(msg)
  return
}

const CreateSkillModal = ({ visible, parentOrigin, onClose, currentBotNo }) => {
  const [form] = Form.useForm()
  const navigate = useNavigate() // 使用useHistory
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedAvatar, setSelectedAvatar] = useState(skillAvatarList[0])
  const queryClient = useQueryClient()
  const [templateList, setTemplateList] = useState([])

  const { studioenv } = useStudioPublishData()

  const { data: appPlatformList = [] } = useFetchAppPlatformList()

  const { data = [] } = useFetchSkillTemplate({
    templateType: "SKILL"
  })

  const generateSkillNo = useMemo(() => {
    return generateNO("s")
  }, [visible])

  useEffect(() => {
    if (!visible) {
      form.resetFields()
      setCurrentStep(1)
      setSelectedSkill(null)
    }
  }, [visible, form])

  const { mutate: delTemplateSkill } = useDeleteTemplateSkill()

  const handleDelete = async (id) => {
    try {
      await delTemplateSkill(id)
    } catch (error) {
      console.log(":===>>>  error:", error)
    }
  }

  const { data: groupData = {} } = useFetchSourceTagList({
    botNo: currentBotNo,
    tagType: "skillGroupTag"
  })

  const skillGroupList = useMemo(() => {
    // @ts-ignore
    return [{ id: 0, tagDesc: "未分组" }, ...(groupData.data || [])]
  }, [groupData])

  useEffect(() => {
    let filteredData = data.filter((item) => Boolean(item.name)) //

    setTemplateList(filteredData)
  }, [JSON.stringify(data)])

  // 自定义模板
  const isCustomTemplate = (item) => !!item.__custom

  const handleCreate = () => {
    form.validateFields().then(async (values) => {
      if (!values.groupTagId) {
        delete values.groupTagId
      }
      // 判断是否是Dify工作流
      let difyData = {}
      if (selectedSkill === 5) {
        const res = await getDifyToken(currentBotNo)
        difyData = res.difyData
        if (!difyData) {
          return
        }
      }
      createSkill(
        {
          ...values,
          difyAccessToken: difyData?.access_token,
          icon: form.getFieldValue("icon") ?? {
            iconURL: selectedAvatar,
            iconType: [...skillAvatarList].includes(selectedAvatar)
              ? AVATAR_ICON_TYPE.SYSTEM
              : AVATAR_ICON_TYPE.CUSTOM
          },
          botNo: currentBotNo,
          templateNo: selectedSkill,
          iconUrl: selectedAvatar,
          generateMethod: selectedSkill === 5 ? 2 : selectedSkill === 4 ? 1 : 0
        },
        {
          onSuccess: (e) => {
            const { data, message: msg } = e
            if (e?.success) {
              // 如果不是自定义流程,则不需要进入到画布
              if (!isCustomTemplate(selectedSkill)) {
                queryClient.invalidateQueries([QUERY_KEYS.SKILL_LIST_BY_PAGE])
                onClose()
              } else {
                // @ts-ignore
                setTimeout(() => {
                  if (selectedSkill === 5) {
                    window.localStorage.href = difyData.getDifyUrl(
                      data.difyWorkFlowId,
                      data.skillNo
                    )
                  } else {
                    navigate(
                      `/editSkill?skillNo=${data.skillNo}&parentOrigin=${parentOrigin}&studioenv=${studioenv || ""}`
                    )
                  }
                }, 100)
              }
              message.success(msg)
            } else {
              message.error(msg)
            }
          }
        }
      )
    })
  }

  const { data: skillTypeOptions = [] } = useFetchSkillType()
  const { mutate: createSkill, isLoading } = useCreateSkill()

  const currentTemplateData = [...templateList, ...customTemplateList].find(
    (type) => type.id === selectedSkill
  )

  const location = useLocation()
  const params = useParams()
  const searchParams = new URLSearchParams(location.search)
  const urlBotNo = searchParams.get("botNo") || params?.botNo

  const filteredTemplateList = useMemo(() => {
    const noBotNoItems = templateList.filter((item) => !item.botNo)
    const withBotNoItems = templateList.filter((item) => item.botNo === urlBotNo)
    return [...noBotNoItems, ...withBotNoItems]
  }, [templateList, urlBotNo])

  return (
    <Modal
      wrapClassName={"create-skill-modal"}
      open={visible}
      width={950}
      style={{
        height: 600
      }}
      title={null}
      footer={
        <div className="text-center pb-4 mt-10">
          {currentStep === 1 ? (
            <Button
              type="primary"
              disabled={!selectedSkill}
              onClick={() => {
                form.resetFields() // 在这里清除Form的值
                setCurrentStep(2)
              }}
            >
              下一步
            </Button>
          ) : (
            <>
              {currentStep === 2 && (
                <Button type="primary" onClick={() => setCurrentStep(1)}>
                  上一步
                </Button>
              )}

              <Button
                type="primary"
                onClick={handleCreate}
                loading={isLoading}
                style={{ marginLeft: 10 }}
              >
                确认创建
              </Button>
            </>
          )}
        </div>
      }
      onCancel={() => {
        setCurrentStep(1)
        form.resetFields() // 在这里清除Form的值
        onClose()
      }}
    >
      <div className="flex flex-col space-y-3 create-skill-step">
        <div className="flex justify-between step-header">
          <div className="flex mr-10">
            <div className={`stepNumber mr-3 ${currentStep === 1 && "active"}`}>1</div>
            <div className={currentStep === 1 ? "font-bold" : ""}>
              <span className="title">选择工作流模板</span>
              <div className="text-sm text-gray-500 tips mt-1">请选择您所要创建工作流的类型</div>
            </div>
          </div>
          <div className="flex">
            <div className={`stepNumber mr-3 ${currentStep === 2 && "active"}`}>2</div>
            <div className={currentStep === 2 ? "font-bold" : ""}>
              <span className="title">工作流基础设置</span>
              <div className="text-sm text-gray-500 tips mt-1">
                请详细描述工作流名称及用途,创建后可修改
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          {currentStep === 1 && (
            <div className="step1">
              {customTemplateList.length > 0 && (
                <>
                  <div className="title" style={{ marginTop: "8px", marginLeft: "-23px" }}>
                    直接创建
                  </div>
                  <CarouselWrapper
                    list={customTemplateList.filter((item) => !item.isHidden)}
                    descStyle="line3"
                    selectedSkill={selectedSkill}
                    setSelectedSkill={setSelectedSkill}
                  />
                </>
              )}

              {filteredTemplateList?.length > 0 && (
                <>
                  <div className="title -ml-[23px]">通过模板创建</div>
                  <CarouselWrapper
                    list={filteredTemplateList}
                    selectedSkill={selectedSkill}
                    setSelectedSkill={setSelectedSkill}
                    onDelete={handleDelete}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {currentStep === 2 && (
          <Form
            form={form}
            className="mt-5"
            labelCol={{ span: 5 }}
            style={{ paddingLeft: 135 }}
            layout={"vertical"}
          >
            <Form.Item
              name="skillName"
              label="工作流名称"
              initialValue={currentTemplateData.name}
              rules={[{ required: true, message: "工作流名称是必填的" }]}
            >
              <Input placeholder="请输入工作流名称" style={{ width: 600 }} />
            </Form.Item>

            <Form.Item
              name="skillNo"
              label="工作流编号"
              initialValue={generateSkillNo}
              rules={[
                { required: true, message: "工作流编号是必填的" },
                {
                  pattern: new RegExp(/^[a-z0-9]+$/),
                  message: "工作流编号只能包含小写字母和数字"
                }
              ]}
            >
              <Input placeholder="请输入工作流编号" style={{ width: 600 }} />
            </Form.Item>

            <Form.Item name="description" label="描述">
              <Input.TextArea placeholder="请输入描述" style={{ width: 600 }} />
            </Form.Item>

            <Form.Item
              name="type"
              label="类型"
              initialValue={currentTemplateData.skillType}
              rules={[
                {
                  required: true,
                  message: "请选择类型"
                }
              ]}
            >
              {currentTemplateData.skillType ? (
                <span>
                  {skillTypeOptions.find(
                    (type) => String(type.code) === String(currentTemplateData.skillType)
                  )?.name ?? currentTemplateData.skillType}
                </span>
              ) : (
                <Radio.Group buttonStyle="solid">
                  {skillTypeOptions.map((type) => (
                    <Radio.Button key={type.code} value={type.code}>
                      {type.name}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              )}
            </Form.Item>
            {/* <Form.Item
              name="iconUrl"
              label="头像"
              initialValue={skillAvatarList[0]}
              className="avatar-form-item"
            >
              <AvatarSelect
                mode={avatarMode.skill}
                selectedAvatar={selectedAvatar}
                handleAvatarSelect={handleAvatarSelect}
              />
            </Form.Item> */}
            <Form.Item
              name="groupTagId"
              label="工作流分组"
              initialValue={0}
              rules={[{ required: true, message: "请选择工作流分组" }]}
            >
              <Select
                allowClear
                style={{ width: 600 }}
                placeholder="请选择"
                options={skillGroupList}
                fieldNames={{ label: "tagDesc", value: "id" }}
              />
            </Form.Item>

            {currentTemplateData.skillType !== "3" && (
              <Form.Item
                label="可见应用端"
                name="applicationPlatformTypes"
                tooltip={"若本工作流所属空间未配置对应应用端，则本工作流不可见"}
                // initialValue={[...appPlatformList.map((item) => item.code)]}
                initialValue={[]}
              >
                {/* 改成Checkbox */}
                <Select
                  allowClear
                  style={{ width: 600 }}
                  placeholder="请选择"
                  mode="multiple"
                  options={appPlatformList}
                  fieldNames={{ label: "name", value: "code" }}
                />
              </Form.Item>
            )}

            <Form.Item
              tooltip="启用后,安全网关将过滤敏感词等风险信息"
              label="安全策略"
              name="enableSenseInfoDetect"
              valuePropName="checked"
              initialValue={true}
            >
              <SecurityPolicySwitch form={form} disabled={true} />
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  )
}

export default CreateSkillModal
