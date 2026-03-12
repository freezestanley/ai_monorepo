import { css } from "@emotion/react"
import { CommonStyles } from "./common"
import { ButtonStyles } from "./Button"
import { TableStyles } from "./Table"
import { EmptyStyles } from "./Empty"
import { PaginationStyles } from "./Pagination"
import { XrenderStyles } from "./Xrender"
import { TagStyles } from "./Tag"
import { SelectStyles } from "./Select"
import { InputStyles } from "./Input"
import { DrawerStyles } from "./Drawer"
import { ModalStyles } from "./Modal"
import { TabStyles } from "./Tab"
import { TimelineStyles } from "./Timeline"
import { XflowStyles } from "./Xflow"
import { SwitchStyles } from "./Switch"
import { CollapseStyles } from "./Collapse"
import { CardStyles } from "./Card"
import { AlertStyles } from "./Alert"
import { DatePickerStyles } from "./DatePicker"
import { TreeStyles } from "./Tree"
import { AntXStyles } from "./AntX"
import { SidderStyles } from "./Sidder"
const GlobalAntdStyles = css`
  ${CommonStyles},
  ${ButtonStyles};
  ${TableStyles};
  ${EmptyStyles}
  ${PaginationStyles}
  ${XrenderStyles}
  ${TagStyles}
  ${SelectStyles}
  ${InputStyles}
  ${DrawerStyles}
  ${ModalStyles}
  ${TabStyles}
  ${TimelineStyles}
  ${XflowStyles}
  ${SwitchStyles}
  ${CollapseStyles}
  ${CardStyles}
  ${AlertStyles}
  ${DatePickerStyles}
  ${TreeStyles}
  ${AntXStyles}
  ${SidderStyles}
`
export default GlobalAntdStyles
