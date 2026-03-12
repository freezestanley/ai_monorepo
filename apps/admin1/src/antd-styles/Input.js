import { css } from "@emotion/react"
import { Token } from "./Token"

export const InputStyles = css`
  .ant-input {
    border-color: #d0d5dd;
    box-shadow: 0px 1px 2px 0px rgba(24, 27, 37, 0.05);
  }
  .ant-input-outlined {
    border-color: #d0d5dd;
    box-shadow: 0px 1px 2px 0px rgba(24, 27, 37, 0.05);
  }
  .ant-input-affix-wrapper {
    box-shadow: 0px 1px 2px 0px rgba(24, 27, 37, 0.05);
  }
  .ant-input-affix-wrapper .ant-input {
    box-shadow: none;
  }
  .ant-form-item .ant-form-item-label > label {
    color: rgba(24, 27, 37, 1);
    font-size: 14px;
    line-height: 20px;
  }
  .ant-input-group-addon {
    background-color: #f5f7fa !important;
  }
  .form-basic-100 .ant-form-item .ant-form-item-control {
    flex-basis: 100%;
  }
  .form-layout-horizontal .ant-form-item .ant-form-item-control {
    flex-basis: auto;
  }
  .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload.ant-upload-select {
    border: 1px solid var(---, #d9d9d9);
  }

  .ant-form-item-label > label {
    font-weight: 400;
    color: #181b25;
  }
  .ant-form-item-label > label,
  .ant-form-item .ant-form-item-label > label,
  .ant-form-vertical .ant-form-item:not(.ant-form-item-horizontal) .ant-form-item-label > label {
    font-weight: 400;
    color: #181b25;
  }

  .ant-input-number .ant-input-number-input {
    padding: 6px 11px;
  }
  .ant-form-item-explain-warning {
    margin-top: 3px;
  }
`
