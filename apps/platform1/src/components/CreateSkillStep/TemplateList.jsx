import { LeftOutlined, RightOutlined } from "@ant-design/icons"
import { Tag, Button, Tooltip, Popconfirm } from "antd"
import React, { useCallback, useState, useEffect } from "react"
import Iconfont from "../Icon"
import { SKILLICONTYPE } from "@/constants"
import { autoBatchEnhancer } from "@reduxjs/toolkit"

const CarouselWrapper = React.memo(
  // @ts-ignore
  ({ list, descStyle = "", selectedSkill, setSelectedSkill, onDelete }) => {
    const [skillList, setSkillList] = useState(list)
    const handleSetSelectedSkill = useCallback(
      (id) => {
        setSelectedSkill(id)
      },
      [setSelectedSkill]
    )

    const skillIcon = (type) => {
      return (
        <Iconfont
          type={SKILLICONTYPE[type]}
          className="mr-1"
          style={{
            fontSize: "22px"
          }}
        />
      )
    }

    const handleDelete = (id) => {
      onDelete && onDelete?.(id)
    }

    return (
      <div className="skill-items">
        <div className={list.length > 0 ? "skill-carousel" : ""}>
          <div className="flex flex-wrap ">
            {(list ?? [])?.map((type) => (
              <div
                key={type?.id}
                className={`sliderCard ${selectedSkill === type.id ? "active" : ""}`}
                onClick={() => handleSetSelectedSkill(type?.id)}
              >
                <div>
                  <div className="header">
                    {skillIcon(type?.id === 5 ? type?.id : type.skillType)}
                    <Tooltip title={type.name}>
                      <span className="title">
                        {type?.name}
                        {type?.id === 5 && (
                          <Tag className="beta-tag">
                            <span>Beta</span>
                          </Tag>
                        )}
                      </span>
                    </Tooltip>
                  </div>
                  <Tooltip title={type.description}>
                    <div className={`description ${descStyle}`}>{type?.description}</div>
                  </Tooltip>
                </div>
                <div className="action">
                  <span>{type?.skillTypeName}</span>
                  {type?.botNo && (
                    <Popconfirm
                      title="确定要【删除】该自定义模板？"
                      onConfirm={(e) => {
                        e.stopPropagation()
                        handleDelete(type.id)
                      }}
                      onCancel={(e) => {
                        e.stopPropagation()
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="link"
                        className="delete-button"
                        onClick={(e) => e.stopPropagation()}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)

export default CarouselWrapper
