import queryString from "query-string"
import { useLocation, useParams } from "react-router-dom"

function useRouter() {
  const location = useLocation()
  const search = queryString.parse(location.search)
  const params = useParams()

  const currentLocationParams = () => {
    const allParams = mergeParameters({}, params, search)
    return allParams
  }

  return {
    currentLocationParams
  }
}
function mergeParameters(target, ...sources) {
  sources.forEach((source) => {
    Object.entries(source).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        target[key] = value
      }
    })
  })

  return target
}
export default useRouter
