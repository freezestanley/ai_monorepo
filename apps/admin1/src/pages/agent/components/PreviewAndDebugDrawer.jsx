import React, { useState } from "react"
import { Drawer } from "antd"
import PreviewAndDebug from "./PreviewAndDebug"

const PreviewAndDebugDrawer = ({
  visible,
  onClose,
  isChat,
  studioenv,
  botNo,
  agentName,
  selectedSkill,
  agentNo,
  agentVersionNo,
  mode,
  refreshReleaseStatus,
  agentMode,
  variableConfigs
}) => {
  return (
    <Drawer
      title=""
      placement="right"
      onClose={onClose}
      open={visible}
      width={550}
      destroyOnClose={true}
      rootClassName="property-confi-drawer"
      mask={false}
      push={{ distance: 545 }}
      headerStyle={{
        borderBottom: "none",
        padding: "0",
        width: "30px",
        height: "30px",
        position: "absolute",
        zIndex: 1,
        left: "10px",
        top: "15px"
      }}
      bodyStyle={{
        padding: "0",
        height: "calc(100% - 55px)",
        overflow: "auto"
      }}
    >
      <div className="h-full">
        <PreviewAndDebug
          isEmbedded={true}
          isChat={isChat}
          botNo={botNo}
          studioenv={studioenv}
          agentName={agentName}
          selectedSkill={selectedSkill}
          agentNo={agentNo}
          agentVersionNo={agentVersionNo}
          mode={mode}
          refreshReleaseStatus={refreshReleaseStatus}
          agentMode={agentMode}
          variableConfigs={variableConfigs}
          className="h-full"
        />
      </div>
    </Drawer>
  )
}

export default PreviewAndDebugDrawer
