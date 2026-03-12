import { useState } from "react"

export const useSkillTemplateModal = (initialForm) => {
  const [visible, setVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [selectedAvatar, setSelectedAvatar] = useState(null)

  const openModal = (record) => {
    initialForm.setFieldsValue(record)
    setCurrentRecord(record)
    setSelectedAvatar(record.iconUrl)
    setVisible(true)
  }

  const closeModal = () => {
    setVisible(false)
  }

  const handleAvatarSelect = ({ iconURL, objectKey, iconType }) => {
    setSelectedAvatar(iconURL)
    initialForm.setFieldsValue({
      iconUrl: iconURL,
      icon: { iconURL, objectKey, iconType }
    })
  }

  return {
    setVisible,
    visible,
    currentRecord,
    selectedAvatar,
    openModal,
    closeModal,
    handleAvatarSelect
  }
}
