import { useCallback, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { Button, Input, Spin } from "antd"
import { debounce } from "lodash"
import PageContainer from "@/components/PageContainer"
import { useFetchKnowledgeTemplateListApi } from "@/api/knowledgeManage"
import KnowledgeList from "./components/knowledgeList"
import FormDrawer from "./components/formDrawer"
import styles from "./index.module.scss"

const TemplateManage = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const [drawerData, setDrawerData] = useState({
    visiable: false,
    recordData: null
  })
  const [queryParam, setQueryParam] = useState("")
  const debounceSetSearch = debounce(setQueryParam, 1000)
  // 模板管理列表
  const { data: tableData, isLoading: listLoading } = useFetchKnowledgeTemplateListApi({
    queryParam,
    botNo
  })

  const knowledgeData = useMemo(
    () => ({
      formalList: tableData?.records?.filter(({ stageType }) => stageType === "正式") || [],
      testList: tableData?.records?.filter(({ stageType }) => stageType === "测试") || []
    }),
    [tableData]
  )

  const onChangeSearch = useCallback(
    (e) => {
      if (e.target.value === "") debounceSetSearch("")
      else debounceSetSearch(e.target.value)
    },
    [debounceSetSearch]
  )

  return (
    <PageContainer
      headerTitle="模版管理"
      headerCustomeSearch={
        <div className={styles["search-box"]}>
          <Input
            style={{ width: 300 }}
            placeholder="请输入模版标题/场景/描述"
            onChange={onChangeSearch}
          />
          <Button
            type="primary"
            onClick={() => setDrawerData({ visiable: true, recordData: null })}
          >
            新增
          </Button>
        </div>
      }
    >
      <Spin spinning={listLoading}>
        <h1 className={styles.pageTitle}>正式</h1>
        <KnowledgeList data={knowledgeData.formalList} setDrawerData={setDrawerData} />
        <h1 className={styles.pageTitle}>测试</h1>
        <KnowledgeList data={knowledgeData.testList} setDrawerData={setDrawerData} />
      </Spin>
      <FormDrawer
        {...drawerData}
        botNo={botNo}
        setVisiable={(bool) => setDrawerData((preState) => ({ ...preState, visiable: bool }))}
      />
    </PageContainer>
  )
}

export default TemplateManage
