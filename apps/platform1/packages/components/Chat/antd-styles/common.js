import { css } from "@emotion/react"
import { Token } from "./Token"

export const CommonStyles = css`
  .admin-content-v2 {
    margin-top: 0px;
  }

  .admin-container-v2 {
    background-color: transparent !important;
    padding: 0px 25px 20px 20px;
    height: 92vh;
  }

  .admin-container-v2 .admin-header {
    background-color: transparent;
    padding-right: 0px;
    padding-left: 0px;
    margin-bottom: 20px;
    margin-top: 20px;
  }

  .code-mirror {
    border-radius: var(--Gap-xs, 8px);
    .cm-theme-light {
      .cm-editor {
        background-color: #f5f7fa !important;
      }
    }
  }

  .code-mirror-large-icon svg {
    width: 0.8em;
    height: 0.8em;
    color: #475467;
  }
  .variable-text-area .anticon svg {
    color: #637691;
    margin-top: 3px;
  }
  .g2-tooltip {
    box-shadow: 0px 4px 32px 0px rgba(51, 51, 51, 0.12) !important;
  }
`
