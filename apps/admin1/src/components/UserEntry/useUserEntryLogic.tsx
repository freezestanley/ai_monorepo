import { useSelector } from "react-redux"
import { theme, Layout } from "antd"
import { useCollapsed } from "@/store"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { usePreviousLocation } from "@/router/PreviousLocationProvider"
import { useSSO } from "@/components/SSOProvider"
import { getUserAuthResources } from "@/api/permission/api"
import { useAuthResources, useMenuResourcesCodes } from "@/store"
import queryString from "query-string"
import { isInsideIframe } from "@/utils"

// 类型定义
interface ThemeState {
  dark: boolean
  colorPrimary?: string
}

interface RootState {
  theme: ThemeState
}

interface QueryParams {
  hideSideBarAndHeader?: string
  iframeStyle?: string
  botNo?: string
  token?: string
}

interface AuthResourcesResponse {
  menuCode?: string[]
  menuTree?: string[]
}

const { darkAlgorithm, defaultAlgorithm } = theme
const { Content } = Layout

// 不想使用全局loading的页面
const disableGlobalLoadingIndicator = ["/flywheel/optimization"]

export function useUserEntryLogic() {
  const globalTheme = useSelector((state: RootState) => state.theme)
  const isCollapsed = useCollapsed((state) => state.collapsed)
  const location = useLocation()
  const navigate = useNavigate()
  const { isInitialized } = useSSO()

  const { search } = location
  const queryParams = queryString.parse(search) as QueryParams

  const [antdTheme, setAntdTheme] = useState({
    algorithm: globalTheme.dark ? darkAlgorithm : defaultAlgorithm
  })

  const searchParams = queryString.parse(window.location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const { token: isIframe } = (searchParams.token ? searchParams : hashParams) as { token?: string }

  useEffect(() => {
    let newTheme: any = {
      algorithm: globalTheme.dark ? darkAlgorithm : defaultAlgorithm
    }
    if (globalTheme.colorPrimary) {
      newTheme.token = { colorPrimary: globalTheme.colorPrimary }
    }
    setAntdTheme(newTheme)
  }, [globalTheme])

  useEffect(() => {
    if (navigator.appVersion.indexOf("Win") != -1) {
      document.documentElement.classList.add("windows")
    }
  }, [])

  const { setPrevLocation } = usePreviousLocation()

  useEffect(() => {
    setPrevLocation(location.pathname)
  }, [location.pathname, setPrevLocation])

  const changeResourceCodeList = useAuthResources((state) => state.changeResourceCodeList)
  const { setResourceMenuCodes, resourceMenuCodes } = useMenuResourcesCodes((state) => state)
  const [loading, setLoading] = useState(true)

  const { botNo: botNoFormQuery } = queryParams
  const botNo = botNoFormQuery

  const getAuthResources = async () => {
    const res: AuthResourcesResponse | undefined = await getUserAuthResources({ botNo: botNo })
    if (res?.menuCode) {
      changeResourceCodeList(res?.menuCode)
    }
    if (res?.menuTree) {
      setResourceMenuCodes(res?.menuTree)
    }
    setLoading(false)
  }

  useEffect(() => {
    console.log("isInitialized", isInitialized)
    if (isInitialized) getAuthResources()
  }, [isInitialized])

  const hideSideBarAndHeader =
    queryParams.hideSideBarAndHeader === "true" ||
    queryParams.iframeStyle === "true" ||
    isInsideIframe()

  return {
    globalTheme,
    isCollapsed,
    location,
    navigate,
    isInitialized,
    antdTheme,
    isIframe,
    resourceMenuCodes,
    loading,
    hideSideBarAndHeader
  }
}
