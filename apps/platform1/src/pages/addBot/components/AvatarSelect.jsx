// 文件名：AvatarSelect.js

import { newAvatarList, skillAvatarList } from "@/assets/imgUrl"
import AvatarUpload from "@/components/AvatarUpload"
import { Button, Space } from "antd"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import "./AvatarSelect.scss"
import { AVATAR_ICON_TYPE, avatarMode } from "@/constants"
import { Popover } from "antd"

const AvatarSelect = ({ selectedAvatar, handleAvatarSelect, mode, disabled }) => {
  // mode : SKILL or BOT
  const avatarListData = mode === avatarMode.skill ? skillAvatarList : newAvatarList
  const [avatars, setAvatars] = useState([...avatarListData])
  const [customAvatars, setCustomAvatars] = useState([])
  const globalTheme = useSelector((state) => state.theme)

  const onSelectedAvatar = ({ iconURL, objectKey }) => {
    handleAvatarSelect({
      iconURL,
      objectKey,
      iconType: [...avatarListData].includes(iconURL)
        ? AVATAR_ICON_TYPE.SYSTEM
        : AVATAR_ICON_TYPE.CUSTOM
    })
  }

  const onUpload = ({ iconURL, objectKey }) => {
    if (iconURL) {
      if (!/^https?:\/\/|\/\//.test(iconURL)) {
        iconURL = "//" + iconURL
      }
      setCustomAvatars([iconURL])
      onSelectedAvatar({ iconURL, objectKey })
    }
  }

  useEffect(() => {
    if (selectedAvatar && !avatarListData.includes(selectedAvatar)) {
      setCustomAvatars([selectedAvatar])
    }
  }, [selectedAvatar])

  return (
    <Space
      wrap={true}
      style={{ "--ant-primary-color": globalTheme.colorPrimary, width: 410 }}
      block={true}
    >
      {!disabled ? (
        <>
          <div className="avatar-item">
            <img src={selectedAvatar} alt={selectedAvatar} className="avatar" />
          </div>
          <div className="text-xs">
            <Popover
              content={
                <UploadPopover
                  {...{
                    avatars,
                    selectedAvatar,
                    onSelectedAvatar,
                    onUpload,
                    customAvatars
                  }}
                />
              }
              trigger="click"
            >
              <Button size="small" style={{ fontSize: 12 }} type="default">
                更换头像
              </Button>
            </Popover>

            <div className="mt-1 text-gray-600">
              自定义头像支持JPG、PNG格式的图片，建议大于80*80px。
            </div>
          </div>
        </>
      ) : (
        <div className="avatar-item">
          <img src={selectedAvatar} alt={selectedAvatar} className="avatar" />
        </div>
      )}
    </Space>
  )
}

const UploadPopover = (props) => {
  const { avatars, selectedAvatar, onSelectedAvatar, onUpload, customAvatars } = props
  return (
    <Space direction="vertical" size="middle" style={{ padding: 8 }} className="pd-30">
      <Space direction="vertical" size="middle">
        <div>系统头像</div>
        <div className="flex">
          {avatars.map((avatar, index) => (
            <div
              key={avatar}
              className={`avatar-item ${avatar === selectedAvatar ? "selected" : ""}`}
            >
              <img
                key={index}
                src={avatar}
                alt={`avatar${index + 1}`}
                onClick={() => onSelectedAvatar({ iconURL: avatar })}
                className="avatar"
              />
            </div>
          ))}
        </div>
      </Space>
      <Space direction="vertical" size="middle">
        <div>自定义头像</div>
        <div className="flex">
          {customAvatars.map((avatar, index) => (
            <div
              key={avatar}
              className={`avatar-item ${avatar === selectedAvatar ? "selected" : ""}`}
            >
              <img
                key={index}
                src={avatar}
                alt={`avatar${index + 1}`}
                onClick={() => onSelectedAvatar({ iconURL: avatar })}
                className="avatar"
              />
            </div>
          ))}
          <div className="avatar-item">
            <AvatarUpload onChange={onUpload} />
          </div>
        </div>
      </Space>
    </Space>
  )
}

export default AvatarSelect
