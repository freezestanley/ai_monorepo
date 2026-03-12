import { css } from "@emotion/react"
import { Token } from "./Token"

export const SelectStyles = css`
  .ant-select {
    box-shadow: 0px 1px 2px 0px rgba(24, 27, 37, 0.05);
  }
  .ant-select-borderless {
    box-shadow: none;
  }
  .ant-select-multiple .ant-select-selector {
    align-items: normal;
    overflow: auto;
    align-items: center;
  }
  .ant-select .ant-select-selection-placeholder,
  .ant-input-textarea-show-count .ant-input-data-count {
    color: ${Token.placeholderTextColor};
  }
  .ant-input-affix-wrapper .ant-input-show-count-suffix {
    color: ${Token.inputTextColor};
  }
  .ant-input-affix-wrapper {
    padding: 6px 8px;
  }
  .ant-select:not(.ant-select-sm) .ant-select-selector {
    border-radius: ${Token.borderRadius}px;
    min-height: ${Token.form.inputHeight};
  }
  .ant-select .ant-select-arrow {
    margin-top: -4px;
  }
  .ant-select-multiple .ant-select-selection-overflow-item {
    max-width: 95% !important;
  }
`
