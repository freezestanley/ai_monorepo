import { Tabs } from "antd"
import PageContainer from "@/components/PageContainer"
import BusinessScenario from "./components/businessScenario"
import SceneHierarchy from "./components/sceneHierarchy"
import styles from "./index.module.scss"

const BasicSetup = () => {
  const tabItems = [
    {
      key: "1",
      label: "业务场景",
      children: <BusinessScenario />
    },
    {
      key: "2",
      label: "场景层级",
      children: <SceneHierarchy />
    }
  ]

  return (
    <PageContainer showHeader={false}>
      <Tabs
        className={styles["basic-setup-tabs"]}
        defaultActiveKey="1"
        destroyInactiveTabPane
        items={tabItems}
      />
    </PageContainer>
  )
}

export default BasicSetup
