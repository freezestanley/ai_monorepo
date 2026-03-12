import { css } from "@emotion/react"
import { Token } from "./Token"

export const TableStyles = css`
  .ant-table-wrapper .ant-table {
    border-radius: ${Token.borderRadius}px;
    border: ${Token.borderDefalut};
    padding-bottom: 1px;
  }
  .ant-table-wrapper .ant-table-container {
    border-start-start-radius: ${Token.borderRadius}px;
    border-start-end-radius: ${Token.borderRadius}px;
  }
  .ant-table-cell-row-hover {
    background: ${Token.bgLight} !important;
  }
  .ant-table-wrapper .ant-table-tbody > tr > td {
    border-bottom: 1px solid #ffffff;
  }
  .ant-table-wrapper .ant-table-thead > tr > th {
    background: #fff;
  }
  .ant-table-cell {
    background: #fafbfc;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    color: #181b25;
  }
  .ant-table-wrapper .ant-table-thead > tr > th {
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 18px;
    color: #475467;
  }
  .ant-table-wrapper .ant-table-thead > tr > th {
    border: none;
    background: ${Token.grayBgColor};
  }
  .ant-table-row .ant-table-cell {
    display: table-cell;
    vertical-align: middle;
  }
  .ant-table-thead .ant-table-cell {
    padding: 9px 16px !important;
  }
  .ant-table-small .ant-table-thead .ant-table-cell {
    padding: 9px 7px !important;
  }
  .table-style-v2-even-row .ant-table-cell {
    background: #fff;
  }
  .table-style-v2-odd-row .ant-table-cell {
    background: #fafbfc;
  }

  .ant-table-wrapper .ant-table-tbody > tr:nth-child(even) {
    background: #fff !important;
  }
  .ant-table-wrapper .ant-table-tbody > tr:nth-child(odd) {
    background: #fafbfc !important;
  }
  .ant-table-thead .ant-table-selection-column .ant-table-selection .ant-checkbox-wrapper {
    margin-left: -9px;
  }
  .table-style-v2-no-border .ant-table {
    border: none !important;
  }
`
