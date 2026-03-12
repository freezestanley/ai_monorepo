import { newAvatarList } from "@/assets/imgUrl"
import { DEFAULT_GREETING } from "@/constants"
import { useState } from "react"

const useBotForm = ({ form }) => {
  const [isModified, setIsModified] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(newAvatarList[0])
  const [knowledgeBase, setKnowledgeBase] = useState([])

  const handleAvatarSelect = ({ iconURL, objectKey, iconType }) => {
    setSelectedAvatar(iconURL)
    form.setFieldsValue({
      botIconUrl: iconURL
    })
    form.setFieldsValue({
      icon: { iconURL, objectKey, iconType }
    })
  }

  const handleOk = (value) => {
    setKnowledgeBase([...knowledgeBase, value])
  }

  return {
    isModified,
    setIsModified,
    selectedAvatar,
    setSelectedAvatar,
    knowledgeBase,
    setKnowledgeBase,
    handleAvatarSelect,
    handleOk,
    defaultGreeting: DEFAULT_GREETING
  }
}

export default useBotForm
