import { css } from "@emotion/react"
import { Token } from "./Token"

export const XflowStyles = css`
  .home-wrapper {
    padding: 0px;
    background-color: #f1f2f7;
    padding-bottom: 0px;
  }
 
  .xflow-json-schema-form.xflow-workspace-panel {
    top: 6px !important;
    right: -9px !important;
    z-index: 100 !important;
    border: none !important;
    box-shadow: 0px 4px 12px 0px rgba(24, 27, 37, 0.08);
  }
  .xflow-app-workspace {
    background-color: transparent;
    border: none;
  }
  .flowchart-extension-container.xflow-app-workspace {
    border: none;
  }
  .xflow-app-workspace .tool-bar-wrapper {
    height: 68px;
    /* width: calc(100vw - var(--sidebar-width, 256px)); */
    width: calc(100vw - 72px);
    background: #fff;
    padding: 16px 30px;
    top: -68px;
    margin-left: 0px;
    padding-left: 15px;
    border-bottom: 1px solid #efefef;
  }

  .xflow-workspace-panel .flow-class-panel .xflow-node-panel-custom .custom-item {
    display: flex;
    padding: 4px 8px;
    align-items: baseline;
    gap: 4px;
    border-radius: 4px;
    border: 1px solid #f2efff !important;
    background: linear-gradient(90deg, rgba(243, 243, 255, 0.5) 0%, rgba(239, 235, 255, 0.3) 100%);
    box-shadow: 0px -1px 1px 0px rgba(234, 227, 255, 0.6) inset;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    color: var(---, #525866);
    width: 98px !important;
    height: 28px !important;
    margin-left: 0px;
  }
  .xflow-workspace-panel
    .flow-class-panel
    .xflow-node-panel-custom
    .custom-item
    .custom-node-label {
    color: var(---, #525866);
    font-size: 13px;
  }

  .flow-user-custom-clz .horizontal.xflow-toolbar-root {
    border: none;
  }
  .flow-user-custom-clz .xflow-toolbar.horizontal {
    border-radius: 8px;
    background: #fff;
    box-shadow: 0px 4px 12px 0px rgba(24, 27, 37, 0.08);
    right: 20px !important;
    bottom: 2vh !important;
    height: 40px !important;
    position: fixed !important;
  }

  .flow-user-custom-clz .xflow-workspace-toolbar-top {
    width: 150px;
    margin-right: 192px;
    inset: auto !important;
  }

  .flow-user-custom-clz .xflow-node-panel-body .ant-collapse-header {
    background: #fff;
    color: var(---, #0e121b);
    font-size: 16px !important;
    font-weight: 600 !important;
    width: 136px;
  }

  .flow-user-custom-clz .xflow-node-panel-body .ant-collapse-header .node-class-icons {
    color: ${Token.colorPrimary} !important;
  }
  .flow-user-custom-clz .custom-item {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;
    border-radius: 8px;
    border: 1px solid var(---, #e1e4ea) !important;
    background: #fff;
    padding: 12px !important;
  }
  .flow-user-custom-clz .custom-item .custom-node-label {
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    color: #0E121B;
    display: block;
    text-align: left;
    width: 100%;
    overflow: visible;
  }

  .flow-user-custom-clz .flowchart-extension-container .xflow-node-panel-header {
    height: 84px !important;
  }

  .xflow-node-panel-collpase-wrapper .xflow-workspace-panel .flow-class-panel:first-child {
    height: 80px !important;
  }

  .xflow-node-panel-collpase-wrapper
    .xflow-workspace-panel
    .flow-class-panel:first-child
    .ant-input-affix-wrapper {
    height: 44px;
    background: #f5f7fa;
    border-radius: 8px;
    width: 96px !important;
    margin-left: 8px;
    box-shadow: 0px 1px 2px 0px rgba(24, 27, 37, 0.05);
  }

  .xflow-node-panel-collpase-wrapper .xflow-workspace-panel .flow-class-panel:nth-child(2) {
    top: 80px !important;
    overflow-x: hidden;
  }

  .flow-class-panel::-webkit-scrollbar {
    width: 2px !important;
  }

  .flowchart-extension-container .xflow-node-panel-collpase-icon {
    width: 25px;
    height: 25px;
    color: #fff;
    background: ${Token.colorPrimary};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    left: 2px !important;
    top: 82px !important;
    border-radius: 50% !important;
    
  }
  .flowchart-extension-container .xflow-node-panel-collpase-icon:hover {
    color: #fff;
    opacity: 0.8;
  }

  
  .flowchart-extension-container .xflow-node-panel-header {
    border: none !important;
    padding: 20px 0 !important;
    height: 80px !important;
  }
  .flow-user-custom-clz .xflow-node-panel-header-search {
    height: 44px;
  }

  /* 定义显示动画 */
  @keyframes panelShow {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* 定义隐藏动画 */
  @keyframes panelHide {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }

  .flow-user-custom-clz .xflow-node-panel-collpase {
    top: 25px !important;
    box-shadow: 0px 4px 12px 0px rgba(24, 27, 37, 0.08);
    border-radius: 0px !important;
    border-top-right-radius: 12px !important;
    border-bottom-right-radius: 12px !important;
  }

  .flowchart-extension-container.xflow-app-workspace .x6-port > circle {
    fill: #fff;
    stroke: #98a2b3;
    stroke-width: 1.2;
    opacity: 1;
    r: 4px;
    transition: fill 0.2s ease, stroke 0.2s ease, r 0.2s ease;
  }

  .flowchart-extension-container.xflow-app-workspace .x6-port:hover > circle {
    fill: #7f56d9;
    stroke: #7f56d9;
    r: 5px;
  }

  .flow-user-custom-clz
    .ant-collapse
    > .ant-collapse-item
    > .ant-collapse-header
    .ant-collapse-arrow {
    color: #b7b2b2;
  }

  .flow-user-custom-clz .ant-collapse .ant-collapse-content > .ant-collapse-content-box {
    padding: 10px 16px;
  }

  .flowchart-extension-container .xflow-node-panel-custom {
    grid-gap: 8px !important;
  }

  .xflow-workspace-panel
    .flow-class-panel
    .xflow-node-panel-custom
    .custom-item
    .custom-node-label {
    font-size: 13px;
    font-style: normal;
    font-weight: 500;
    color: var(---, #525866);
  }

  .flow-user-custom-clz .ant-collapse-header-text .node-class-header {
    font-size: 16px;
    font-weight: 600;
    color: var(---, #0e121b);
  }

  .flow-user-custom-clz .flow-chat-preview-wrapper {
    text-align: right;
    display: flex;
    justify-content: flex-end;
    padding-right: 20px;
  }

  .dragging {
    border-radius: 8px !important;
    overflow: hidden !important;
  }
  .xflow-node-panel-collpase {
     bottom: 23px !important;
  
    top: 25px !important;
  }

  .flowchart-extension-container.xflow-app-workspace .xflow-workspace-panel {
    border-radius: 12px;
   
  }
  .flow-user-custom-clz .x6-edge-label rect {
    fill: ${Token.colorPrimary};
  }
  .flow-user-custom-clz .x6-edge-label text {
    font-size: 12px;
    font-weight: 400;
    fill: #fff;
  }

  .flow-user-custom-clz .ant-collapse .ant-collapse-content > .ant-collapse-content-box {
    padding: 10px 20px;
  }

  .flow-class-panel .ant-collapse-expand-icon {
    opacity: 0;
  }

  .flow-class-panel.xflow-workspace-panel::-webkit-scrollbar {
    scrollbar-width: none;
  }

  /*去掉选中节点时候可以自由改变大小的边线*/
  .flowchart-extension-container.xflow-app-workspace .x6-widget-transform {
    display: none;
  }
  /*去掉选中节给个背景阴影*/
  .flow-user-custom-clz .x6-node-selected {
    filter: drop-shadow(0 10px 8px rgb(127 86 217 / 0.07))
      drop-shadow(0 4px 3px rgb(127 86 217 / 0.3));
  }
  /*选中节点价格线框*/
  .flow-user-custom-clz .x6-node-selected .custom-item {
    border: 1px solid ${Token.colorPrimary} !important;
  }

  .flow-user-custom-clz .x6-node .custom-item {
    border: 1px solid #e4e7ec !important;
    border-left: 1px solid #e4e7ec !important;
    border-radius: 12px !important;
    background: #fff !important;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
    padding: 8px 12px !important;
    align-items: flex-start;
    gap: 6px;
  }

  .flow-user-custom-clz .x6-node .custom-item .custom-node-label {
    color: #1d2939;
    font-size: 13px;
    font-weight: 500;
  }

  .flowchart-extension-container.xflow-app-workspace .x6-edge path {
    stroke: #cbd5e1;
    stroke-width: 1.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .flowchart-extension-container.xflow-app-workspace .x6-edge .x6-edge-marker {
    display: none;
  }

  .flowchart-extension-container.xflow-app-workspace .x6-edge.x6-edge-selected path:nth-child(2) {
    stroke: ${Token.colorPrimary} !important;
  }
  .flowchart-extension-container.xflow-app-workspace .x6-edge:hover path:nth-child(2) {
    stroke: ${Token.colorPrimary} !important;
  }

  /*左下角 toolbar 图标*/
  .x6-toolbar.x6-toolbar-hover-effect .x6-toolbar-item {
    margin: 4px 10px 4px 0;
    padding: 0 10px;
    color: #525866;
    border-radius: 4px;
   
  }

  .x6-toolbar-item-icon {
    font-size: 16px !important;
  }
  .flow-user-custom-clz .xflow-toolbar.horizontal {
    width: 182px !important;
  }

  .x6-toolbar-item.x6-toolbar-item-active,
  .x6-toolbar.x6-toolbar-hover-effect .x6-toolbar-item.x6-toolbar-item-active,
  .x6-toolbar.x6-toolbar-hover-effect .x6-toolbar-item:hover {
    background-color: #f5f7fa; !important;
    color:${Token.colorPrimary} !important;
  }

  .flow-user-custom-clz .xflow-workspace-toolbar-top .x6-toolbar-item-icon .custom-bar-icon {
  font-size: 24px !important;
  }

  .xflow-workspace-toolbar-top.xflow-toolbar.horizontal {
   width: 206px !important;
  }

  .xflow-workspace-toolbar-top .x6-toolbar.x6-toolbar-hover-effect .x6-toolbar-item {
    margin: 4px 2px 4px 0 !important;
    padding: 0 7px;
  }
`
