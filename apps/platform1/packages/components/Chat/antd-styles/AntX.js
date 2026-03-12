import { css } from "@emotion/react"

export const AntXStyles = css`
  .ant-sender {
    border-color: #e4e7ec;
    border-radius: 16px;
    box-shadow: 0px 4px 12px 0px rgba(24, 27, 37, 0.08);
  }
  .ant-sender .ant-sender-content .ant-input {
    box-shadow: none;
  }
  .ant-btn-color-primary.ant-btn-variant-text {
    color: #5d5fef;
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
    font-size: 14px;
    font-weight: 400;
    border-radius: 0px 8px 8px 8px;
    background: #f2f7ff;
  }
  .bubble-container .ant-bubble-end .ant-bubble-content-filled {
    color: var(---, #475467);
    font-size: 14px;
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
  .w-md-editor {
    box-shadow: none;
    padding-top: 3px;
  }

  .ant-sender .ant-sender-content .ant-input {
    min-height: 88px;
  }
`
