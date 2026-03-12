import { startTransition } from "react"
import { useNavigate } from "react-router-dom"
// import { getQueryParameters } from "../utils/token"
import queryString from "query-string"
import { keys, pick } from "lodash"

const useRouter = (
  defaultCacheQuery = ["botNo", "workbenchNo", "_from", "_close_hide", "_full_screen_hide"]
) => {
  const navigate = useNavigate()

  const navigatePush = (path: string, restQuery?: Record<string, any>) => {
    const totalUrlState = { ...restQuery }
    const targetUrlQuery = pick(totalUrlState, [...defaultCacheQuery, ...keys(restQuery)])
    const queryStr = queryString.stringify(targetUrlQuery)
    const targetPath = path.split("?")[0] // path初始不带参数
    const url = targetPath === "/" ? targetPath : `${targetPath}?${queryStr}`
    startTransition(() => {
      navigate(url)
    })
  }

  const navigateReplace = (path: string, restQuery?: Record<string, any>) => {
    const totalUrlState = { ...restQuery }
    const targetUrlQuery = pick(totalUrlState, [...defaultCacheQuery, ...keys(restQuery)])
    const queryStr = queryString.stringify(targetUrlQuery)
    const targetPath = path.split("?")[0] // path初始不带参数
    const url = targetPath === "/" ? targetPath : `${targetPath}?${queryStr}`
    startTransition(() => {
      navigate(url, { replace: true })
    })
  }

  const currentLocation = () => {
    const pathname = location.pathname
    const search = queryString.parse(location.search)
    return {
      pathname,
      search
    }
  }

  const navigateBack = () => {
    navigate(-1)
  }

  return {
    navigatePush,
    navigateReplace,
    currentLocation,
    navigateBack
  }
}

export default useRouter
