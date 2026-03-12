import React from "react"
import { Drawer, Avatar, Tooltip, Tag } from "antd"
import { RightOutlined } from "@ant-design/icons"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
// @ts-ignore
import type1 from "../../../assets/img/type1.png"
// @ts-ignore
import type2 from "../../../assets/img/type2.png"
// @ts-ignore
import type3 from "../../../assets/img/type3.png"

const SKILLICONTYPE = {
  1: type3, // 快速问答
  2: type2, // 表单类型
  3: type1, // API类型
  4: type3 // 默认类型
}

import { getDifyToken } from "@/components/CreateSkillStep"
import { useNavigate } from "react-router-dom"
import queryString from "query-string"

const SkillRelationDrawer = ({ open, onClose, agentNo, skillList = [], currentBotNo }) => {
  const navigate = useNavigate()
  const searchParams = queryString.parse(window.location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const {
    token,
    iframeStyle: paramsIframeStyle,
    parentOrigin,
    workbenchNo,
    studioenv
  } = searchParams.token ? searchParams : hashParams
  const isIframe = token || paramsIframeStyle === "true"

  const handleEditSkill = async (skill) => {
    // 判断是否是dify
    if (skill.generateMethod === 2) {
      const difyData = await getDifyToken(currentBotNo)
      if (!difyData) return
      window.location.href = difyData.getDifyUrl(skill.difyWorkFlowId, skill.skillNo)
    } else {
      let subscribeSkillQuery = ``
      if (skill.type === "subscribed_skill") {
        subscribeSkillQuery += `&mode=showDetail&skillCanRead=${skill.canRead}`
      }
      const generateMethod = skill.generateMethod === 1 ? "AI" : "manual"
      navigate(
        `/editSkill?skillNo=${skill.skillNo}&isIframe=${true}&botNo=${currentBotNo}${subscribeSkillQuery}&createMode=${generateMethod}&agentNo=${agentNo}&workbenchNo=${workbenchNo}&parentOrigin=${parentOrigin}&studioenv=${studioenv || ""}`
      )
    }
  }
  return (
    <Drawer title="工作流关系" open={open} onClose={onClose} width={600}>
      <div className="flex flex-col gap-[12px]">
        {skillList.length === 0 ? (
          <div className="text-center text-gray-400 py-8 mt-[66%]">
            <CustomEmpty description="暂无工作流关系" />
          </div>
        ) : (
          skillList.map((skill) => (
            <div
              key={skill.skillNo}
              className="flex items-center gap-[8px] bg-[#F9FAFB] rounded-[8px] p-[8px] cursor-pointer group"
              onClick={() => handleEditSkill(skill)}
            >
              <Avatar
                src={
                  SKILLICONTYPE[
                    skill.type === "sub"
                      ? skill.skillType
                      : Number(skill.skillType || skill.type) || 4
                  ]
                }
                shape="square"
                size={32}
                className="flex-shrink-0"
                style={{ padding: "3px" }}
              >
                {skill.skillName?.slice(0, 1)}
              </Avatar>

              <div className="flex items-center gap-[8px] w-[86%]">
                <Tooltip title={skill.skillName}>
                  <span className="text-[14px] text-[#181B25] font-[500] truncate w-[160px] text-left">
                    {skill.skillName}
                  </span>
                </Tooltip>
                {skill?.isEdited && (
                  <Tag bordered={false} color="volcano">
                    已编辑
                  </Tag>
                )}

                <p className="text-[12px] text-gray-500 font-[400]">{skill.skillNo || "--"}</p>
              </div>

              <span className="flex w-[60px] items-center ml-auto opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 text-gray-400 text-[12px]  select-none">
                去编辑 <RightOutlined className="ml-1 text-xs" />
              </span>
            </div>
          ))
        )}
      </div>
    </Drawer>
  )
}

export default SkillRelationDrawer
