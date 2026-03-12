// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react"
import "./AIMenu.scss"
import { Button, Input } from "antd"
import { menuItemsConfig } from "./AIMenu-config"
import { RightOutlined } from "@ant-design/icons"
import Iconfont from "@/components/Icon"

const AIMenu = ({
  show,
  onClose,
  handleItemSelect,
  AIContent,
  handleUseAIContent,
  setAIcontent
}) => {
  const [selectedItem, setSelectedItem] = useState(0)
  const [selectedSubItem, setSelectedSubItem] = useState(null)
  const [submenuOpen, setSubmenuOpen] = useState(false)
  // 需要一个状态记录当前选中的操作
  const [currentAction, setCurrentAction] = useState(null)

  const menuItems = menuItemsConfig
  const handleUse = () => {
    handleUseAIContent(AIContent, currentAction)
  }

  const navigateSubmenu = (e) => {
    switch (e.key) {
      case "ArrowDown":
        if (selectedSubItem < menuItems[selectedItem].submenu.length - 1) {
          setSelectedSubItem((prevSubItem) => prevSubItem + 1)
        }
        break
      case "ArrowUp":
        if (selectedSubItem > 0) {
          setSelectedSubItem((prevSubItem) => prevSubItem - 1)
        }
        break
      case "ArrowLeft":
        setSubmenuOpen(false)
        setSelectedSubItem(null)
        break
      default:
        break
    }
  }

  const navigateMainMenu = (e) => {
    switch (e.key) {
      case "ArrowDown":
        if (selectedItem < menuItems.length - 1) {
          setSelectedItem((prevItem) => prevItem + 1)
        }
        break
      case "ArrowUp":
        if (selectedItem > 0) {
          setSelectedItem((prevItem) => prevItem - 1)
        }
        break
      case "ArrowRight":
        if (menuItems[selectedItem].submenu) {
          setSubmenuOpen(true)
          setSelectedSubItem(0)
        }
        break
      default:
        break
    }
  }

  const selectMenuItem = () => {
    const item = {
      ...menuItems[selectedItem],
      selectedSubItem: submenuOpen ? selectedSubItem : null
    }
    setCurrentAction(menuItems[selectedItem].label)
    handleItemSelect(item)
  }

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        selectMenuItem()
      } else if (submenuOpen) {
        e.preventDefault()
        navigateSubmenu(e)
      } else {
        navigateMainMenu(e)
      }
    },
    [selectedItem, submenuOpen, selectedSubItem, menuItems]
  )

  // ... (其他代码保持不变)

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // 卸载时清除状态
  useEffect(() => {
    return () => {
      setCurrentAction(null)
      setAIcontent(null)
    }
  }, [])

  return (
    <div className={`ai-menu ai-menu-wrapper ${show ? "show" : ""}`}>
      <div className="ai-menu-header">AI 菜单</div>
      <ul className="ai-menu-list">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className={selectedItem === index ? "selected" : ""}
            onMouseEnter={() => {
              setSelectedItem(index)
              if (item.submenu) {
                setSubmenuOpen(true)
                setSelectedSubItem(0)
              } else {
                setSubmenuOpen(false)
              }
            }}
            onClick={() => selectMenuItem(item)}
          >
            <div className="flex items-center">
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </div>
            {item.submenu && (
              <span className="arrow">
                <RightOutlined />
              </span>
            )}
            {item.submenu && submenuOpen && selectedItem === index && (
              <ul className="ai-submenu">
                {item.submenu.map((subItem, subIndex) => (
                  <li
                    key={subIndex}
                    className={selectedSubItem === subIndex ? "selected" : ""}
                    onMouseEnter={() => setSelectedSubItem(subIndex)}
                  >
                    {subItem}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div className="ai-menu-actions">
        <Button size="small" type="primary" onClick={handleUse} disabled={!currentAction}>
          应用
        </Button>
        <Button onClick={onClose} size="small">
          取消
        </Button>
      </div>
    </div>
  )
}

const AIMenuTrigger = ({
  style,
  handleItemSelect,
  handleCancelRewrite,
  handleDelete,
  AIContent,
  handleUseAIContent,
  setAIcontent
}) => {
  const [inputValue, setInputValue] = useState("")

  const menuRef = useRef(null)
  useEffect(() => {
    function handleOutsideClick(event) {
      // 检查点击的地方是否是 RewriteOptions 组件之外
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        handleCancelRewrite()
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  return (
    <div ref={menuRef} style={style} className="ai-menu-comp">
      <div className="input-wrapper">
        {AIContent && <div className="ai-content-gen">{AIContent}</div>}
        <Input
          prefix={<Iconfont type={"icon-a-askAI"} style={{ fontSize: 18 }} />}
          suffix={
            !inputValue ? (
              <Iconfont type={"icon-shangchuan-huise"} style={{ fontSize: 18 }} />
            ) : (
              <Iconfont type={"icon-shangchuan-zise"} style={{ fontSize: 18 }} />
            )
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="input-bar"
          placeholder="在这里输入..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault()
            }
            if (e.key === "Escape") {
              handleCancelRewrite()
            }
            // 如果是delete键并且没有内容，则取消改写
            if (e.key === "Backspace" && e.target.value === "") {
              e.preventDefault()
              handleDelete()
            }

            // 如果是enter
            if (e.key === "Enter") {
              setAIcontent(inputValue)
            }
          }}
        ></Input>
      </div>
      {!inputValue && (
        <AIMenu
          AIContent={AIContent}
          setAIcontent={setAIcontent}
          handleItemSelect={handleItemSelect}
          handleUseAIContent={handleUseAIContent}
          show={true}
          onClose={() => handleCancelRewrite()}
        />
      )}
    </div>
  )
}

export default AIMenuTrigger
