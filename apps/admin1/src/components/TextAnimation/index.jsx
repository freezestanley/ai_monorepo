/*
 * @Author: Dyton
 * @Date: 2024-04-16 18:56:57
 * @Descripttion: 动效文字
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-19 14:41:45
 * @FilePath: /za-aigc-platform-admin-static/src/components/TextAnimation/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import Texty from "rc-texty"
import TweenOne from "rc-tween-one"
/**
 * @description:动效文字
 * @params {*} children 文本
 * @params {*} text 文本参数
 * @params {*} letterSpacing 文字间隔 默认1
 */
export const TextAnimation = ({ children = null, text = null, letterSpacing = 1 }) => {
  const geInterval = (e) => {
    switch (e.index) {
      case 0:
        return 0
      case 1:
        return 150
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        return 150 + 450 + (e.index - 2) * 10
      default:
        return 150 + 450 + (e.index - 6) * 150
    }
  }
  const getEnter = (e) => {
    const t = {
      opacity: 0,
      scale: 0.8,
      y: "-100%"
    }
    if (e.index >= 2 && e.index <= 6) {
      return { ...t, y: "-30%", duration: 150 }
    }
    return t
  }

  return (
    <Texty
      delay={400}
      enter={getEnter}
      interval={geInterval}
      component={TweenOne}
      componentProps={{
        animation: [
          { x: 300, type: "set" },
          { x: 100, delay: 500, duration: 600, letterSpacing: 20 },
          {
            ease: "easeOutQuart",
            duration: 300,
            x: 0,
            letterSpacing: letterSpacing ?? 2
          },
          {
            letterSpacing: 20,
            delay: -300,
            scale: 0.9,
            ease: "easeInOutQuint",
            duration: 1000
          },
          {
            scale: 1,
            letterSpacing: letterSpacing ?? 2,
            width: "100%",
            delay: -300,
            duration: 1000,
            ease: "easeInOutQuint"
          }
        ]
      }}
    >
      {children ?? text}
    </Texty>
  )
}
export default TextAnimation
