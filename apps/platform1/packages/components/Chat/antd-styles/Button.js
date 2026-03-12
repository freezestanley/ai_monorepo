import { css } from "@emotion/react"
import { Token } from "./Token"
// padding: ${Token.button.default.padding};

export const ButtonStyles = css`
  .ant-btn {
    height: ${Token.button.default.height};
    padding: ${Token.button.default.padding};
    border-radius: ${Token.borderRadius}px;
    font-size: 14px;
    font-weight: 400;
  }
  .ant-btn-sm {
    height: ${Token.button.small.height};
    padding: ${Token.button.small.padding};
  }
  .ant-btn-lg {
    height: ${Token.button.large.height};
    padding: ${Token.button.large.padding};
  }
  .ant-btn-circle {
    height: 32px;
  }
  .ant-btn-primary {
    border: 1px solid;
    border-image-source: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0) 89%
    );
    background: ${Token.colorPrimary};
    color: ${Token.extensive.white};
    box-shadow:
      0px 1px 1px 0px rgba(24, 27, 37, 0.05),
      0px -1px 0px 0px rgba(24, 27, 37, 0.05) inset,
      0px 1px 0px 0.6px rgba(225, 225, 225, 0.18) inset;
  }
  .ant-btn-default {
    font-weight: 400;
    color: ${Token.extensive.textDarkPrimary};
    border: 1px solid var(---, rgba(228, 231, 236, 1));
    background: ${Token.extensive.bgWhite};
    box-shadow:
      0px 1px 1px 0px rgba(24, 27, 37, 0.05),
      0px -1px 0px 0px rgba(24, 27, 37, 0.05) inset,
      0px 1px 0px 0.6px rgb(207 209 215 / 18%) inset;
  }

  .ant-btn-variant-link {
    padding: 6px 5px;
  }

  .ant-btn:hover {
    opcaty: 0.8;
    color: ${Token.colorPrimary};
    border-color: ${Token.colorPrimary};
  }

  .ant-btn > span:not(:only-child) {
    align-self: center;
  }

  .ant-btn.ant-btn-icon-only {
    width: 36px;
    height: 36px;
  }

  .ant-btn-variant-outlined:not(:disabled):not(.ant-btn-disabled):hover {
    color: ${Token.colorPrimary};
    border-color: ${Token.colorPrimary};
  }

  .ant-btn-variant-solid:not(:disabled):not(.ant-btn-disabled):hover {
    border-color: ${Token.colorPrimary};
    background: ${Token.colorPrimary};
  }
`
