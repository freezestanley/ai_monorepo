import React, { forwardRef, useRef, useEffect, useState } from "react"
import { Dropdown, Menu } from "antd"
import { CSSTransition } from "react-transition-group"
// import "./AnimatedDropdown.css"

const AnimatedDropdown = forwardRef(({ items, children }, ref) => {
  const triggerRef = useRef(null)
  const [dropdownWidth, setDropdownWidth] = useState(118)

  useEffect(() => {
    if (triggerRef.current) {
      setDropdownWidth(Math.max(triggerRef.current.offsetWidth, 118))
    }
  }, [])

  const menu = (
    <Menu className="animated-dropdown-menu">
      {items.map((item, index) => (
        <Menu.Item key={index} onClick={item.onClick}>
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  )

  const dropdownRender = (menu) => (
    <CSSTransition in={true} appear={true} timeout={300} classNames="animated-dropdown-menu">
      <div style={{ width: `${dropdownWidth}px` }}>{menu}</div>
    </CSSTransition>
  )

  const trigger = React.cloneElement(React.Children.only(children), {
    className: `animated-dropdown-trigger ${children.props.className || ""}`,
    ref: (node) => {
      triggerRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    }
  })

  return (
    <Dropdown overlay={menu} trigger={["hover"]} dropdownRender={dropdownRender} placement="bottom">
      {trigger}
    </Dropdown>
  )
})

export default AnimatedDropdown
