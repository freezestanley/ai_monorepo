import { useCallback, useEffect } from "react"

const UseSaveShortcut = (onSave, isLoading) => {
  const handleKeyDown = useCallback(
    (event) => {
      const isMetaKey = event.metaKey || event.ctrlKey
      const isSKey = event.key === "s" || event.keyCode === 83

      if (isMetaKey && isSKey) {
        event.preventDefault()
        !isLoading && onSave()
      }
    },
    [onSave, isLoading]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
}

export default UseSaveShortcut
