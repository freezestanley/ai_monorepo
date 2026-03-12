import { Modal, Alert, List } from "antd"
import classNames from "classnames"
import notes1 from "@/assets/img/version/notes1.png"
import notes2 from "@/assets/img/version/notes2.png"
import notes3 from "@/assets/img/version/notes3.png"
import notes4 from "@/assets/img/version/notes4.png"
import notes5 from "@/assets/img/version/notes5.png"
import styles from "./index.module.less"

const data = [
  {
    title: "创建",
    content: "选择需要上线的物料，进入发布准备状态",
    contentImg: notes1
  },
  {
    title: "DEV开发",
    content: "在隔离环境中进行功能实现与初步逻辑验证",
    contentImg: notes2
  },
  {
    title: "PRE测试",
    content: "支持批量测试，提前发现潜在问题及稳定性验证",
    contentImg: notes3
  },
  {
    title: "PRD灰度验证",
    content: "支持版本灰度ABtest，非必选可跳过",
    contentImg: notes4
  },
  {
    title: "PRD生产",
    content: "正式版本，直接面向终端用户提供服务",
    contentImg: notes5
  }
]

const ReleaseNotesModal = ({ visible, onCancel, onSubmit, loading }) => {
  return (
    <Modal
      title="版本发布说明"
      open={visible}
      okText="开启版本发布"
      closable={false}
      width={950}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={loading}
    >
      <List
        className={styles.list}
        grid={{ gutter: 0, column: 5 }}
        dataSource={data}
        renderItem={(item, index) => (
          <List.Item className={classNames({ [styles.lastItem]: index === data.length - 1 })}>
            <div className={styles.title}>{item.title}</div>
            <div className={styles.content}>{item.content}</div>
            <div className={styles.number}>{index + 1}</div>
            <div
              className={styles.contentImg}
              style={{ backgroundImage: `url(${item.contentImg})` }}
            />
          </List.Item>
        )}
      />
      <Alert
        className={styles.alert}
        message="温馨提示："
        description={
          <>
            1、版本发布功能开启后，原有Agent、工作流等模块等【一键发布】功能将暂停使用，所有发布操作必须通过发布单进行。
            <br />
            2、点击开启，需要几分钟时间准备配套发布环境。
            <span className={styles.alertText}>
              期间，本空间所有进行中的编辑/设置功能将冻结，请谨慎操作～
            </span>
          </>
        }
        type="warning"
        showIcon
      />
    </Modal>
  )
}

export default ReleaseNotesModal
