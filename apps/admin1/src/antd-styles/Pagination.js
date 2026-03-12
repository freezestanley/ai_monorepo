import { css } from "@emotion/react"
import { Token } from "./Token"

export const PaginationStyles = css`
  .ant-pagination {
    padding: 20px 0px !important;
    position: relative;
    justify-content: flex-end;
  }
  .ant-pagination .ant-pagination-item {
    border-radius: 8px;
    border: 1px solid #d0d5dd;
    background: #fff;
    justify-content: center;
    align-items: center;
    line-height: 33px;
  }
  .ant-pagination .ant-pagination-item:hover {
    border: 1px solid ${Token.colorPrimary};
    background: ${Token.lightColorPrimary} !important;
  }
  .ant-pagination .ant-select-selection-item {
    color: #98a2b3;
  }
  .ant-table-wrapper .ant-table-pagination.ant-pagination {
    margin: 0px;
  }
  .ant-pagination .ant-pagination-total-text {
    position: absolute;
    left: 0px;
    color: #181b25;
    font-size: 14px;
    font-weight: 400;
  }
  .ant-pagination .ant-pagination-item-active {
    border: 1px solid ${Token.colorPrimary};
    background: ${Token.lightColorPrimary};
  }
  .ant-pagination:not(.ant-pagination-mini) .ant-pagination-item {
    min-width: 36px;
    height: 36px;
  }
`
