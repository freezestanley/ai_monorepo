import ConsultRecord from "./index"
import { Drawer } from "antd"
import classnames from "classnames"
import "./index.less"

const ConsultRecordDrawer = ({ rootClassName, drawerData, setDrawerData, mask = false }) => {
  return (
    <Drawer
      rootClassName={classnames("consultDrawer", rootClassName)}
      maskClosable={false}
      title={"会话详情"}
      open={drawerData.open}
      push={false}
      mask={mask}
      onClose={() => setDrawerData({ open: false, id: null })}
    >
      {drawerData.open && (
        <ConsultRecord
          id={drawerData?.id}
          sessionId={drawerData?.sessionId}
          goBack={() => setDrawerData({ open: false, id: null })}
          isContainer
        />
      )}
    </Drawer>
  )
}

export default ConsultRecordDrawer
