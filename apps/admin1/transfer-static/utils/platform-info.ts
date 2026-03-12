import { isWeChatDomain } from './login'
import { getQueryParameters } from './token'

export const getPlatformType = () => {
  const queryParameters = getQueryParameters()
  if (isWeChatDomain() || queryParameters?._from !== 'iframe') {
    return 'web'
  }
  return 'copilot'
}
