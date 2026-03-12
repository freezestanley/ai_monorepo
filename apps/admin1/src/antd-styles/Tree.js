import { css } from "@emotion/react"

export const TreeStyles = css`
  .tree-wrapper .ant-tree {
    .ant-tree-treenode {
      padding: 0;
      margin: 4px 0;

      &.ant-tree-treenode-selected {
        > .ant-tree-node-content-wrapper {
          position: relative;
          background-color: #f4ebff !important;
          color: #7f56d9 !important;
          width: 87%;
          border-radius: 8px;
          &::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 0px;
            background-color: #7f56d9;
            border-radius: 0 2px 2px 0;
          }
        }
      }
    }

    .tree-wrapper .ant-tree-node-content-wrapper {
      padding: 6px 8px;
      margin-left: 5px;
      font-size: 14px;
      transition: all 0.2s;
      border-radius: 0;
      color: #475467;

      &:hover {
        background-color: #f4ebff !important;
        width: 100%;
        border-radius: 8px;
      }
    }

    .ant-tree-switcher {
      width: 20px;
      height: 32px;
      margin-right: 0;
      line-height: 32px;
    }

    .ant-tree-indent-unit {
      width: 20px;
    }
    .ant-tree-switcher-leaf-line:after {
      display: none;
    }

    .ant-tree-show-line {
      .ant-tree-indent-unit {
        &::before {
          border-color: #e4e7ec !important;
          border-width: 1px !important;
          top: -5px !important;
        }
      }
    }

    .ant-tree-show-line .ant-tree-indent-unit:before {
      top: -10px !important;
    }
  }

  .tree-wrapper .ant-tree .ant-tree-switcher-leaf-line:before {
    bottom: -13px !important;
    top: -4px !important;
    border-inline-end: 1px solid #e8e9e9;
  }
  .tree-wrapper .ant-tree .ant-tree-treenode-leaf-last .ant-tree-switcher-leaf-line:before {
    height: 38px !important;
    margin-top: -4px;
  }
  .tree-wrapper .ant-tree .ant-tree-switcher:not(.ant-tree-switcher-noop):hover:before {
    background: transparent !important;
  }

  .tree-wrapper .ant-tree .ant-tree-treenode-selected .ant-tree-switcher-leaf-line:before {
    width: 3px;
    background: #7f56d9;
    margin-left: 2px;
    left: 5px;
    border-radius: 5px;
    height: 100%;
  }

  .tree-wrapper .ant-tree .ant-tree-treenode {
    width: 100%;
  }

  .tree-wrapper .ant-tree .ant-tree-node-content-wrapper {
    width: 100%;
    max-width: 170px;
  }
  .tree-wrapper
    .ant-tree
    .ant-tree-treenode:not(.ant-tree-treenode-disabled)
    .ant-tree-node-content-wrapper:hover {
    width: 100%;
  }
  .tree-wrapper .ant-tree .ant-tree-node-content-wrapper-normal {
    width: 100%;
  }
  .tree-wrapper
    .ant-tree
    .ant-tree-treenode:not(.ant-tree-treenode-disabled)
    .ant-tree-node-content-wrapper-normal:hover {
    width: 100%;
  }
  .tree-wrapper
    .ant-tree
    .ant-tree-treenode.ant-tree-treenode-selected
    > .ant-tree-node-content-wrapper-normal {
    width: 100%;
  }
`
