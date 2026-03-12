import React from "react"
import { Drawer } from "antd"

const PropertyConfigDrawer = ({ open, onClose }) => {
  return (
    <Drawer
      title="属性配置"
      placement="left"
      width={600}
      open={open}
      onClose={onClose}
      mask={false}
      getContainer={false}
      style={{
        position: "absolute"
      }}
      className="voice-flow-drawer"
      rootClassName="node-edit-drawer-offset property-config-drawer"
      headerStyle={{
        borderBottom: "1px solid #f0f0f0",
        padding: "16px 24px"
      }}
      bodyStyle={{
        padding: "24px",
        height: "calc(100% - 55px)",
        overflow: "auto"
      }}
    >
      <div className="h-full flex flex-col">
        {/* 暂时为空的内容区域 */}
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-lg mb-2">属性配置</div>
            <div className="text-sm">功能开发中...</div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export default PropertyConfigDrawer
