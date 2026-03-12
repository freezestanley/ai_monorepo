import { css } from "@emotion/react"
import { Token } from "./Token"

export const TabStyles = css`
  .ant-tabs .ant-tabs-tab {
    color: #475467;
  }
  .ant-tabs .ant-tabs-tab + .ant-tabs-tab {
    margin: 0 0 0 16px;
  }
  .ant-tabs .ant-tabs-nav::before {
    border-bottom: ${Token.borderDefalut};
  }
  .ant-tabs .ant-tabs-top > .ant-tabs-nav::before {
    border-bottom: ${Token.borderDefalut};
  }
  .child-need-sticky .ant-tabs-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #fff;
  }
`
