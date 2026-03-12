import { css } from "@emotion/react"
import { CommonStyles } from "./common"
import { ButtonStyles } from "./Button"
import { EmptyStyles } from "./Empty"
import { XrenderStyles } from "./Xrender"
import { AntXStyles } from "./AntX"
const GlobalAntdStyles = css`
  ${CommonStyles},
  ${ButtonStyles};
  ${EmptyStyles}
  ${XrenderStyles}
  ${AntXStyles}
`
export default GlobalAntdStyles
