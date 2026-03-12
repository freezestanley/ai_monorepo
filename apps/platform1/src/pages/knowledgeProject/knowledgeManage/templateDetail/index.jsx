// @ts-nocheck
import { useCallback, useMemo, useState, useReducer } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import queryString from "query-string"
import { Button, Table, Tour, TreeSelect, Spin, Tree, Breadcrumb, Input, Form, message } from "antd"
import { DownOutlined, FolderOutlined } from "@ant-design/icons"
import PageContainer from "@/components/PageContainer"
import {
  useFetchQueryRelationDetailApi,
  useFetchListByType,
  useFetchEditRelationDetailApi
} from "@/api/knowledgeManage"
import OperationBox, { OPTION_TYPE } from "./components/operationBox"
import SuspensionBox from "./components/suspensionBox"
import OperationDrawer from "./components/operationDrawer"
import LevelDrawer from "./components/levelDrawer"
import RequestSyncModal from "./components/requestSyncModal"
import RequestRecordsModal from "./components/requestRecordsModal"
import styles from "./index.module.scss"

const getSessionTourOpenStatus = (type) => {
  const data = localStorage.getItem("templateTourOpenStatus")
  if (data) {
    return JSON.parse(data)?.[type]
  }
  return false
}

const setSessionTourOpenStatus = (type) => {
  const data = localStorage.getItem("templateTourOpenStatus")
  if (data) {
    const newData = JSON.parse(data)
    newData[type] = true
    localStorage.setItem("templateTourOpenStatus", JSON.stringify(newData))
  } else {
    localStorage.setItem("templateTourOpenStatus", JSON.stringify({ [type]: true }))
  }
}

const modifyTree = (nodes, callback) => {
  return nodes?.map((node) => {
    const modifiedNode = callback(node)
    if (node.childIntentionLevelVOS) {
      modifiedNode.childIntentionLevelVOS = modifyTree(node.childIntentionLevelVOS, callback)
    }
    return modifiedNode
  })
}

const commonSteps = [
  {
    title: "提示",
    description: "点击【继续操作】可返回右上方菜单再次选择任意操作！",
    target: () => document.querySelector(".template-continue-btn")
  },
  {
    title: "提示",
    description: "点击【提交完成】将已保存的数据提交！",
    target: () => document.querySelector(".template-submit-btn"),
    nextButtonProps: { children: "确定" }
  }
]

const tourSteps = {
  [OPTION_TYPE.BIND]: [
    {
      title: "提示",
      description: "请选择需绑定的数据！",
      target: () => document.querySelector(".template-bind-content")
    },
    {
      title: "提示",
      description: "选择好需绑定的数据后再点击【保存】！",
      target: () => document.querySelector(".template-save-btn")
    },
    ...commonSteps
  ],
  [OPTION_TYPE.UNBIND]: [
    {
      title: "提示",
      description: "请选择需解绑的数据！",
      target: () => document.querySelector(".template-table")
    },
    {
      title: "提示",
      description: "选择好需解绑的数据后再点击【保存】！",
      target: () => document.querySelector(".template-save-btn")
    },
    ...commonSteps
  ],
  [OPTION_TYPE.MOVE]: [
    {
      title: "提示",
      description: "请选中所需移动的数据！",
      target: () => document.querySelector(".template-table")
    },
    {
      title: "提示",
      description: "点击【保存】打开抽屉页，选定移动至的层级后再点击该按钮进行保存！",
      target: () => document.querySelector(".template-save-btn")
    },
    ...commonSteps
  ],
  resDetail: [
    {
      title: "提示",
      description: "请检查需操作的数据，并点击操作栏的【保存】确认！",
      target: () => document.querySelector(".template-edit-detail-table"),
      nextButtonProps: { children: "确定" }
    }
  ]
}

const initialState = {
  temporaryData: [],
  goalData: {
    [OPTION_TYPE.BIND]: [],
    [OPTION_TYPE.MOVE]: [],
    [OPTION_TYPE.UNBIND]: []
  },
  optionType: null
}
const reducer = (state, action) => {
  switch (action.type) {
    case "setTemporaryData":
      return { ...state, temporaryData: action.data }
    case "setGoalData":
      return { ...state, goalData: { ...state.goalData, ...action.data } }
    case "setOptionType":
      return { ...state, optionType: action.data }
    case "setData":
      return { ...state, ...action.data }
    case "init":
      return initialState
    default:
      return state
  }
}

const KnowledgeContent = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [tourOpen, setTourOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [levelDrawerOpen, setLevelDrawerOpen] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState([""])
  const [operateVisible, setOperateVisible] = useState(null)
  const [syncModal, setSyncModal] = useState({ visiable: false, mode: "sync" })
  const [recordsModal, setRecordsModal] = useState(false)
  const [tourType, setTourType] = useState(null)
  const [searchText, setSearchText] = useState()
  const [state, dispatch] = useReducer(reducer, initialState)
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { templateId, botNo } = queryParams
  const { data: relationDetail, isLoading } = useFetchQueryRelationDetailApi({
    templateId,
    botNo
  })
  const { mutate: editRelationDetail } = useFetchEditRelationDetailApi()
  // 业务场景
  const { data: listByParentAndType } = useFetchListByType({
    type: "BUSINESS_SCENE",
    botNo
  })
  const pendingRequestSync = useMemo(() => {
    const bool = relationDetail?.knowledgeTemplateVO?.applicationStatus === "2"
    if (bool) {
      setOperateVisible(false)
      dispatch({ type: "init" })
    }
    return bool
  }, [relationDetail?.knowledgeTemplateVO?.applicationStatus])

  const onSubmit = useCallback(() => {
    const { goalData } = state || {}
    const knowledgeTemplateEditOperationVOS = Object.entries(goalData)
      .filter(([_, value]) => !!value?.length)
      .map(([key, value]) => {
        let operation = null
        switch (key) {
          case OPTION_TYPE.BIND:
            operation = "绑定"
            break
          case OPTION_TYPE.UNBIND:
            operation = "解绑"
            break
          case OPTION_TYPE.MOVE:
            operation = "移动"
        }

        return {
          operation,
          knowledgeTemplateEditOperationDetailVOS: (value || []).map(
            ({
              targetLevelId,
              intentionId,
              intentionName,
              intentionDesc,
              intentionDescription,
              dialogueId,
              dialogueName,
              id,
              text,
              intentionLevelId,
              initLayer
            }) => ({
              intentionId,
              intentionName,
              intentionDesc: intentionDesc || intentionDescription,
              dialogueId: dialogueId || id,
              dialogueName: dialogueName || text,
              intentionLevelId:
                key === OPTION_TYPE.BIND ? initLayer : (targetLevelId ?? intentionLevelId),
              orgIntentionLevelId: key === OPTION_TYPE.MOVE ? intentionLevelId : undefined
            })
          )
        }
      })
    editRelationDetail(
      {
        enableVersion: relationDetail?.knowledgeTemplateVO?.enableVersion,
        knowledgeTemplateEditOperationVOS,
        templateId
      },
      {
        onSuccess: (res) => {
          if (res?.success) {
            dispatch({ type: "init" })
            setDrawerOpen(false)
            setOperateVisible(false)
            message.success("操作成功！")
          }
        }
      }
    )
  }, [editRelationDetail, relationDetail, state, templateId])

  const onOpenTour = useCallback((type) => {
    if (!getSessionTourOpenStatus(type)) {
      setTourType(type)
      setTourOpen(true)
      setSessionTourOpenStatus(type)
    }
  }, [])

  const onChangeOptionType = useCallback(
    (type) => {
      dispatch({ type: "setOptionType", data: type })
      setOperateVisible(true)
      if (type === OPTION_TYPE.BIND) {
        setDrawerOpen(true)
      }
      onOpenTour(type)
    },
    [dispatch, onOpenTour]
  )

  const relationDetailInfo = useMemo(() => {
    let allList = []
    const list = modifyTree(relationDetail?.intentionLevelVOS, ({ intentionLevel, ...item }) => {
      if (item.knowledgeTemplateIntentionRelationVOS) {
        item.knowledgeTemplateIntentionRelationVOS = item.knowledgeTemplateIntentionRelationVOS.map(
          (v) => ({
            ...v,
            intentionLevelName: intentionLevel?.name,
            intentionLevelId: intentionLevel?.id
          })
        )
      }
      allList = [...allList, ...(item.knowledgeTemplateIntentionRelationVOS || [])]
      return { ...intentionLevel, ...item }
    })
    return [
      {
        name: "全部",
        id: "",
        knowledgeTemplateIntentionRelationVOS: allList,
        childIntentionLevelVOS: list
      }
    ]
  }, [relationDetail])

  const tableList = useMemo(() => {
    const [id] = selectedKeys
    let list = []
    modifyTree(relationDetailInfo, (item) => {
      if (item.id === id) {
        list = item.knowledgeTemplateIntentionRelationVOS
      }
      return item
    })
    return (
      searchText
        ? list?.filter(
            ({ intentionName, intentionDesc }) =>
              intentionName?.indexOf(searchText) !== -1 || intentionDesc?.indexOf(searchText) !== -1
          )
        : list
    )?.sort((a, b) => (a.gmtModified > b.gmtModified ? -1 : 1))
  }, [relationDetailInfo, selectedKeys, searchText])

  const onTreeSelect = useCallback((selectedKeysValue) => {
    setSelectedKeys(selectedKeysValue)
  }, [])

  const columns = [
    {
      title: "意图id",
      dataIndex: "intentionId",
      width: 150,
      render: (text) => <div style={{ width: 150, wordWrap: "break-word" }}>{text}</div>
    },
    {
      title: "意图名称",
      dataIndex: "intentionName",
      width: 180
    },
    {
      title: "意图描述",
      dataIndex: "intentionDesc",
      width: 200
    },
    {
      title: "当前层级",
      dataIndex: "intentionLevelName",
      width: 200
    },
    {
      title: "关联话术",
      dataIndex: "dialogueName",
      width: 320
    },
    {
      title: "绑定信息",
      dataIndex: "creator",
      width: 180,
      render: (text, record) => (
        <>
          {text}
          <br />
          {record.gmtCreated}
        </>
      )
    },
    {
      title: "更新信息",
      dataIndex: "modifier",
      width: 180,
      render: (text, record) => (
        <>
          {text}
          <br />
          {record.gmtModified}
        </>
      )
    }
  ]

  return (
    <PageContainer
      headerTitle={
        <Breadcrumb
          className={styles.breadcrumb}
          items={[
            {
              title: <Link to={`/templateManage?botNo=${botNo}`}>模板管理</Link>
            },
            {
              title: relationDetail?.knowledgeTemplateVO?.templateName
            }
          ]}
        />
      }
      headerCustomeSearch={
        <div className={styles["search-box"]}>
          <Input
            style={{ width: 300 }}
            placeholder="检索意图/意图描述"
            onChange={(e) => setSearchText(e.target.value?.trim())}
          />
        </div>
      }
    >
      <div className={styles.contentWrapper}>
        <div className="tree-wrapper">
          <div style={{ marginBottom: 8 }}>
            <Button type="primary" size="small" onClick={() => setLevelDrawerOpen(true)}>
              新增
            </Button>
          </div>
          <TreeSelect
            className="mb-2 w-100"
            placeholder="请选择业务场景"
            treeData={listByParentAndType}
            value={relationDetail?.knowledgeTemplateVO?.businessSceneId}
            fieldNames={{
              label: "name",
              value: "id",
              children: "childKnowledgeConfigs"
            }}
            disabled
            treeDefaultExpandAll
            showSearch
          />
          <Spin spinning={isLoading}>
            <Tree
              showLine
              blockNode
              showIcon
              switcherIcon={<DownOutlined />}
              icon={(props) => (props?.childIntentionLevelVOS?.length ? <FolderOutlined /> : false)}
              onSelect={onTreeSelect}
              selectedKeys={selectedKeys}
              defaultExpandAll
              autoExpandParent
              defaultExpandParent
              treeData={relationDetailInfo}
              fieldNames={{
                title: "name",
                key: "id",
                children: "childIntentionLevelVOS"
              }}
            />
          </Spin>
        </div>
        <div className="table-wrapper">
          <div style={{ width: "100%", marginBottom: "10px" }}>
            <Button onClick={() => setRecordsModal(true)}>申请记录</Button>
            <Button
              style={{ marginLeft: 8 }}
              type="primary"
              disabled={pendingRequestSync}
              onClick={() => setSyncModal({ visiable: true, mode: "sync" })}
            >
              申请同步
            </Button>
            {/* <Button
              onClick={() =>
                navigate(
                  `/versionRecord?botNo=${botNo}&templateId=${templateId}&templateName=${relationDetail?.knowledgeTemplateVO?.templateName}`
                )
              }
            >
              版本记录
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() =>
                navigate(
                  `/operationLog?botNo=${botNo}&templateId=${templateId}&templateName=${relationDetail?.knowledgeTemplateVO?.templateName}`
                )
              }
            >
              操作日志
            </Button> */}
          </div>
          <Table
            loading={isLoading}
            className="template-table"
            rowKey={"dialogueId"}
            columns={columns}
            dataSource={tableList}
            pagination={false}
            rowSelection={
              state?.optionType === OPTION_TYPE.UNBIND || state?.optionType === OPTION_TYPE.MOVE
                ? {
                    columnWidth: 50,
                    fixed: true,
                    selectedRowKeys: [
                      ...(state?.goalData?.[state?.optionType] || []).map(
                        ({ dialogueId }) => dialogueId
                      ),
                      ...(state?.temporaryData || []).map(({ dialogueId }) => dialogueId)
                    ],
                    onChange: (_, selectedRows) => {
                      dispatch({
                        type: "setTemporaryData",
                        data: selectedRows?.filter(
                          ({ dialogueId }) =>
                            !state?.goalData?.[state?.optionType]?.find(
                              (item) => item.dialogueId === dialogueId
                            )
                        )
                      })
                    },
                    getCheckboxProps: (record) => ({
                      disabled: !!(
                        state?.optionType === OPTION_TYPE.UNBIND
                          ? // 移动和解绑互斥，不可同时选中
                            [
                              ...(state?.goalData?.[state?.optionType] || []),
                              ...(state?.goalData?.[OPTION_TYPE.MOVE] || [])
                            ]
                          : [
                              ...(state?.goalData?.[state?.optionType] || []),
                              ...(state?.goalData?.[OPTION_TYPE.UNBIND] || [])
                            ]
                      ).find(({ dialogueId }) => dialogueId === record.dialogueId)
                    })
                  }
                : undefined
            }
          />
        </div>
      </div>
      <OperationBox
        pendingRequestSync={pendingRequestSync}
        optionType={state?.optionType}
        onChangeOptionType={onChangeOptionType}
      />
      <OperationDrawer
        visiable={drawerOpen}
        setVisiable={setDrawerOpen}
        setLevelDrawerOpen={setLevelDrawerOpen}
        listByParentAndType={listByParentAndType}
        relationDetailInfo={relationDetailInfo?.[0]?.childIntentionLevelVOS}
        allTemplateIntentionList={relationDetailInfo?.[0]?.knowledgeTemplateIntentionRelationVOS}
        businessSceneId={relationDetail?.knowledgeTemplateVO?.businessSceneId}
        state={state}
        dispatch={dispatch}
        botNo={botNo}
        form={form}
      />
      <LevelDrawer
        botNo={botNo}
        visiable={levelDrawerOpen}
        setVisiable={setLevelDrawerOpen}
        listByParentAndType={listByParentAndType}
        knowledgeTemplateVO={relationDetail?.knowledgeTemplateVO}
        relationDetailInfo={relationDetailInfo?.[0]?.childIntentionLevelVOS}
      />
      <SuspensionBox
        dispatch={dispatch}
        state={state}
        visiable={operateVisible}
        setVisible={setOperateVisible}
        setDrawerOpen={setDrawerOpen}
        drawerOpen={drawerOpen}
        form={form}
        onSubmit={onSubmit}
        onOpenTour={() => onOpenTour("resDetail")}
        tourOpen={tourOpen}
        relationDetailInfo={relationDetailInfo?.[0]?.childIntentionLevelVOS}
      />
      {tourOpen && (
        <Tour
          open
          onClose={() => setTourOpen(false)}
          placement={[OPTION_TYPE.BIND, "resDetail"].includes(tourType) ? "left" : "top"}
          steps={[...(tourSteps[tourType] || [])]}
        />
      )}
      <RequestRecordsModal
        visiable={recordsModal}
        setVisiable={setRecordsModal}
        templateId={templateId}
      />
      <RequestSyncModal
        {...syncModal}
        templateId={templateId}
        setVisiable={(bool) => setSyncModal((preState) => ({ ...preState, visiable: bool }))}
      />
    </PageContainer>
  )
}

export default KnowledgeContent
