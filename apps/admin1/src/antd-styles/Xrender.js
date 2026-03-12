//Xrender 样式复写
// 需要在 xrender 外层包裹两个 div， div classname 分别是  .table-xrender-container .table-xrender-container-insert
import { css } from "@emotion/react"
import { Token } from "./Token"

export const XrenderStyles = css`
  .table-xrender-container {
    background: rgb(239, 242, 244);
    height: 100vh;
  }
  .table-xrender-container-insert {
    background: #fff;
    padding: 20px 20px;
    padding-top: 10px;
    border-radius: ${Token.borderRadius}px;
    position: relative;
  }

  .table-xrender-container .call-logs-render-v2 .tr-toolbar-left {
    display: none;
  }
  .table-xrender-container .call-logs-render-v2 .tr-toolbar-right {
    width: 100%;
  }
  .table-xrender-container .call-logs-render-v2 .tr-toolbar-right .ant-space {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  .table-xrender-container .call-logs-render-v2 .tr-toolbar-right .ant-space .ant-space-item {
    width: auto;
  }
  .table-xrender-container .fr-search {
    padding: 0px;
    position: absolute;
    width: auto;
    right: 160px;
    top: 24px;
  }

  .table-xrender-container .fr-search .fr-field .ant-form-item-control-input-content {
    height: 36px;
  }

  .table-xrender-container
    .tr-table-wrapper
    .tr-toolbar
    .tr-toolbar-right
    > .ant-space
    > .ant-space-item:nth-child(2) {
    padding: 7px 15px;
    align-items: center;
    border-radius: 8px;
    background: #f5f7fa;
  }
  .table-xrender-container
    .tr-table-wrapper
    .tr-toolbar
    .tr-toolbar-right
    > .ant-space
    > .ant-space-item:nth-child(2)
    .ant-space-item {
    font-size: 14px;
  }
  .table-xrender-container
    .tr-table-wrapper
    .tr-toolbar
    .tr-toolbar-right
    > .ant-space
    > .ant-space-item:nth-child(2)
    .ant-space-item:hover {
    color: ${Token.colorPrimary};
  }
  .table-xrender-container
    .tr-table-wrapper
    .tr-toolbar
    .tr-toolbar-right
    > .ant-space
    > .ant-space-item:nth-child(2)
    > .ant-space {
    gap: 25px !important;
  }
  .table-xrender-container .fr-search .ant-form-item-control-input {
    width: 380px;
  }
  .table-xrender-container .tr-table-wrapper {
    padding: 0px;
  }
  .table-xrender-container .fr-search .search-action-col {
    display: none;
  }
  .table-xrender-container .tr-toolbar-column-setting {
    box-shadow:
      0 3px 6px -4px rgb(196 187 187),
      0 6px 16px 0 rgb(219 219 219),
      0 9px 28px 8px rgb(243 243 243);
    border-radius: ${Token.borderRadius}px;
  }
`
