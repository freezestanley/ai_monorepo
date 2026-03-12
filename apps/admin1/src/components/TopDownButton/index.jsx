import { useCallback, useEffect, useMemo, useState } from "react"
import { UpOutlined, DownOutlined } from "@ant-design/icons"
import styles from "./index.module.scss"

// 查询当前元素的父元素是否能滚动
const hasOverflowAuto = (element) => {
  if (!element) return null
  let parent = element.parentElement
  while (parent) {
    const styles = window.getComputedStyle(parent)
    if (styles.overflow === "auto" || styles.overflowY === "auto") {
      return parent
    }
    parent = parent.parentElement
  }
  return null
}

const TopDownButton = ({ target = null, onClick = null, visibilityHeight = 2 }) => {
  const [topVisible, setTopVisible] = useState(false)
  const [bottomVisible, setBottomVisible] = useState(false)
  const [domRef, setDomRef] = useState(null)

  const container = useMemo(() => {
    return (typeof target === "function" ? target() : target) || hasOverflowAuto(domRef) || window
  }, [target, domRef])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = container.scrollTop
      setTopVisible(scrollPosition >= visibilityHeight)
      setBottomVisible(
        container.scrollHeight - container.clientHeight - scrollPosition >= visibilityHeight
      )
    }

    handleScroll()

    container.addEventListener("scroll", handleScroll)

    return () => {
      container.removeEventListener("scroll", handleScroll)
    }
  }, [container, visibilityHeight])

  const scrollToTop = useCallback(
    (e) => {
      container.scrollTo({
        top: 0,
        behavior: "smooth"
      })
      typeof onClick === "function" && onClick(e)
    },
    [onClick, container]
  )

  const scrollToBottom = useCallback(
    (e) => {
      container.scrollTo({
        top: (target || document.body)?.scrollHeight,
        behavior: "smooth"
      })
      typeof onClick === "function" && onClick(e)
    },
    [onClick, container, target]
  )

  return (
    <div className={styles["scroll-btn-box"]} ref={(ref) => setDomRef(ref)}>
      <UpOutlined
        className={styles[`${topVisible ? "visible" : "hidden"}-element`]}
        onClick={scrollToTop}
      />
      <DownOutlined
        className={styles[`${bottomVisible ? "visible" : "hidden"}-element`]}
        onClick={scrollToBottom}
      />
    </div>
  )
}

export default TopDownButton
