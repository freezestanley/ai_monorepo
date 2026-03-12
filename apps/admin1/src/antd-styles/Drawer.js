import { css } from "@emotion/react"
import { Token } from "./Token"

export const DrawerStyles = css`
  .ant-drawer .ant-drawer-title {
    font-size: 16px !important;
    font-style: normal !important;
    font-weight: 500 !important;
    color: var(---, #181b25) !important;
  }
  .ant-drawer .ant-drawer-header {
    padding: 16px;
  }
  .ant-drawer .ant-drawer-footer {
    display: flex;
    flex-direction: row-reverse;
    border-top: 1px solid var(---, #d0d5dd) !important;
    padding: 15px !important;
  }
  .ant-drawer-content-wrapper {
    /*box-shadow: rgba(24, 27, 37, 0.08) 0px 4px 12px 0px !important; */
    box-shadow: rgb(166 166 166 / 8%) 0px 9px 8px 0px !important;
    .ant-drawer-content {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }
  }
`
