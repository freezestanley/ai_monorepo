/*
 * @Author: Dyton
 * @Date: 2023-10-23 20:06:48
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-24 21:19:30
 * @FilePath: /za-aigc-platform-admin-static/src/router/PreviousLocationProvider.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import React from "react"
import { createContext, useContext, useEffect, useState } from "react"

// @ts-ignore
const PreviousLocationContext = createContext()

export const usePreviousLocation = () => {
  return useContext(PreviousLocationContext)
}

// @ts-ignore
export const PreviousLocationProvider = React.memo(({ children }) => {
  const [prevLocation, setPrevLocation] = useState("")

  return (
    <PreviousLocationContext.Provider value={{ prevLocation, setPrevLocation }}>
      {children}
    </PreviousLocationContext.Provider>
  )
})
