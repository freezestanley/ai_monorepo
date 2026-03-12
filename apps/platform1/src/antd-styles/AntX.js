import { css } from "@emotion/react"

export const AntXStyles = css`
  .ant-sender {
    border-color: #e4e7ec;
    border-radius: 12px;
  }
  .ant-sender .ant-sender-content .ant-input {
    box-shadow: none;
  }
  .ant-btn-color-primary.ant-btn-variant-text {
    color: #7f56d9;
  }
  .ant-sender .ant-sender-content {
    padding-block: 10px;
  }
  .ant-prompts .ant-prompts-list {
    overflow-x: auto;
  }
  .ant-sender .ant-btn.ant-btn-circle.ant-btn {
    min-width: 23px;
    height: 23px;
  }
  .ant-sender .ant-btn.ant-btn-icon-only {
    width: 23px;
  }
  .bubble-container .ant-bubble-start .ant-bubble-content-filled {
    color: var(---, #181b25);
    font-size: 12px;
    font-weight: 400;
    border-radius: 0px 8px 8px 8px;
    background: #f9f5ff;
  }
  .bubble-container .ant-bubble-end .ant-bubble-content-filled {
    color: var(---, #475467);
    font-size: 12px;
    font-weight: 400;
    border-radius: 8px 0px 8px 8px;
    background: #f5f7fa;
  }

  .sender-larger .ant-sender-content {
    padding-top: 15px;
    padding-bottom: 15px;
  }
  .bubble-container .ant-bubble-footer {
    width: 100%;
    margin-top: 0px;
  }
`
