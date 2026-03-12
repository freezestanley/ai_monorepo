import { css } from "@emotion/react"
import { Token } from "./Token"

export const ModalStyles = css`
  .ant-modal-root .ant-modal-wrap {
    height: 100vh;
    overflow: hidden;
  }
  .ant-modal .ant-modal-content {
    padding: 30px 32px;
  }
  .ant-modal .ant-modal-body {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(100vh - 300px);
  }
  .ant-modal .ant-modal-confirm-content {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(100vh - 400px);
  }

  .ant-modal .ant-row {
    flex-flow: row;
  }

  .ant-modal .ant-modal-footer {
    margin-top: 20px;
  }
  .ant-modal .ant-modal-header {
    padding-bottom: 16px;
    border-bottom: 1px solid #e9ebef;
    margin-bottom: 16px;
  }
  .ant-modal .ant-modal-close {
    top: 25px;
    right: 22px;
  }

  .ant-modal-confirm .ant-modal-confirm-btns {
    margin-top: 20px;
  }
`
