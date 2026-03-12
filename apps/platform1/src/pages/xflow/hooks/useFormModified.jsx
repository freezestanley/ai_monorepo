import { useRef, useState } from "react"

function useFormModified() {
  const currentValuesRef = useRef({})
  const [isModified, setIsModified] = useState(false)

  // Internal onValuesChange handler
  const handleValuesChange = (changedValues, allValues) => {
    console.log("🤖==> ~ allValues:", allValues)
    currentValuesRef.current = allValues
    setIsModified(true)
  }

  const resetModified = () => {
    setIsModified(false)
  }

  return [isModified, resetModified, handleValuesChange, currentValuesRef]
}

export default useFormModified
