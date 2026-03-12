import { css } from "@emotion/react"

export const SegmentedStyles = css`
  .ant-segmented {
    padding: 4px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 6px;

    .ant-segmented-item {
      min-width: 100px;
      color: #475467;
      transition: all 0.3s;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;

      &:hover {
        color: #181b25;
      }

      &-selected {
        background: #fff;
        color: #181b25;
        box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
        border-radius: 8px;
      }

      &-label {
        min-height: 32px;
        line-height: 32px;
      }
    }
  }
`
