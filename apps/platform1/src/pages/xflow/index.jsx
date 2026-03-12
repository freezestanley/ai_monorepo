// @ts-nocheck
import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { Drawer } from "antd"
/** 交互组件 */
import {
  /** XFlow核心组件 */
  XFlow,
  /** 流程图画布组件 */
  FlowchartCanvas,
  /** 流程图配置扩展 */
  FlowchartExtension,
  /** 流程图节点组件 */
  FlowchartNodePanel,
  /** 流程图表单组件 */
  /** 通用组件：快捷键 */
  KeyBindings,
  /** 通用组件：画布缩放 */
  CanvasScaleToolbar,
  /** 通用组件：右键菜单 */
  CanvasContextMenu,
  /** 通用组件：工具栏 */
  CanvasToolbar,
  /** 通用组件：对齐线 */
  CanvasSnapline,
  /** 通用组件：节点连接桩 */
  CanvasNodePortTooltip,
  XFlowGraphCommands,
  CanvasMiniMap
} from "@antv/xflow"
/** 配置Command*/
import { useCmdConfig } from "./config-cmd"
/** 配置Menu */
import { useMenuConfig } from "./config-menu"
/** 配置Toolbar */
import { SAVE_GRAPH_DATA, useToolbarConfig } from "./config-toolbar"
/** 配置快捷键 */
import { useKeybindingConfig } from "./config-keybinding"
/** 配置Dnd组件面板 */
import CustomFlowchartFormPanel from "./CustomFlowchartFormPanel"
import { customNodes, customNodesClass } from "./custom-nodes"
import "./index.less"
import ToolbarWithDrawers from "./ToolbarWithDrawers"
import { useChangeSkillFlowData } from "./hooks/useChangeSkillFlowData"
import FlowChartPreview from "./FlowChartPreview"
import SubscribeSkillInfo from "./SubscribeSkillInfo"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import AiCreate from "./AICreate"

import { getNewNodeConfig, saveFlowDataToStorage, adjustNodesLayout } from "./xflowV2/untils"
import { useComponentAndDebugPanel } from "@/store"
import { useInitPublishData } from "@/hooks/useStudioPublishData"

const elementClass = ".custom-components"

export const XflowInstance = () => {
  const toolbarConfig = useToolbarConfig()
  const menuConfig = useMenuConfig()
  const keybindingConfig = useKeybindingConfig()
  const graphRef = useRef()
  const commandConfig = useCmdConfig()
  const [formPanelVisible, setFormPanelVisible] = useState(false)
  const appData = useRef(null)

  const { componentAndDebugPanel, changeComponentAndDebugPanel } = useComponentAndDebugPanel(
    (state) => state
  )

  useEffect(() => {
    changeComponentAndDebugPanel({
      open: false,
      width: 600,
      showDebuggerPanel: false
    })
  }, [])

  // 获取hash参数
  // 获取hash参数
  const queryParams = queryString.parse(useLocation().search)
  const isShowDetail = queryParams.mode === "showDetail"
  const skillCanRead = queryParams.skillCanRead === "true"
  const isAICreate = queryParams.createMode === "AI"
  const botNo = queryParams.botNo
  const aiCreateRef = useRef()

  const handleSaveAiCreate = (callback) => {
    // 调用子组件的 save 方法
    aiCreateRef.current.save(callback)
  }

  const location = useLocation()
  const { skillNo: skillNoParam } = queryString.parse(location.search)
  const skillNo = Array.isArray(skillNoParam) ? skillNoParam[0] : skillNoParam

  // 获取版本发布配置数据
  useInitPublishData()

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Clean up localStorage data when component unmounts
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("graphData_")) {
          localStorage.removeItem(key)
        }
      })
    }
  }, [])

  useEffect(() => {
    return () => {
      // Only clear current bot's XFLOW_V2_ related cache on unmount
      if (botNo) {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("XFLOW_V2_") && key.includes(`_${botNo}`)) {
            localStorage.removeItem(key)
          }
        })
      }
    }
  }, [botNo])

  const saveStatic = useCallback(() => {
    appData.current.executeCommand(SAVE_GRAPH_DATA, {
      saveGraphDataService: (meta, graphData) => {
        localStorage.setItem(`graphData_${skillNo}`, JSON.stringify(graphData))
        return null
      }
    })
  }, [appData])

  const { currentSkillProcessData, currentSkillInfo } = useChangeSkillFlowData()

  // console.log("currentSkillProcessData==>", currentSkillProcessData, currentSkillInfo)

  const meta = useMemo(
    () => ({
      saveStatic
    }),
    [saveStatic]
  )

  /**
   * @param app 当前XFlow空间
   * @param extensionRegistry 当前XFlow配置项
   */

  const onLoad = async (app) => {
    appData.current = app
    graphRef.current = await app.getGraphInstance()
    if (graphRef.current?.freeze) {
      graphRef.current.freeze()
    }

    const hasGraphData = currentSkillProcessData?.flowDefinition?.graph?.nodes
    const edgesraphData = currentSkillProcessData?.flowDefinition?.graph?.edges
    if (hasGraphData) {
      // xclowV2-转换节点宽高
      const nodes = hasGraphData || []
      // 转换节点宽高
      currentSkillProcessData.flowDefinition.graph.nodes = getNewNodeConfig(nodes, edgesraphData)
      // 储存为了 新节点防止重复请求 api
      saveFlowDataToStorage(currentSkillProcessData.flowDefinition.graph.nodes, edgesraphData)
      // 调整节点布局
      // currentSkillProcessData.flowDefinition.graph =
      //   adjustNodesLayout(
      //     currentSkillProcessData.flowDefinition.graph.nodes,
      //     edgesraphData,
      //     true
      //   ) || []

      // console.log("这个是画布元数据", currentSkillProcessData)

      currentSkillProcessData?.flowDefinition?.graph?.nodes?.forEach((item) => {
        // 转换x以及y, 强制转为数字, 如果非数字,则为0
        item.x = !isNaN(Number(item.x)) ? Number(item.x) : 0
        item.y = !isNaN(Number(item.y)) ? Number(item.y) : 0

        // 不需要自适应的
        const excludeNodes = ["begin-node", "end-node"]
        if (!excludeNodes.includes(item?.name)) {
          item.width = item?.width < 110 ? 110 : item?.width
          item.height = item?.height < 50 ? 50 : item?.height
        }
        // 查询问答、查询问答高度自适应
        if (["search-node", "document-search-node"].includes(item?.name)) {
          item.height = item?.height < 200 ? 200 : item?.height
        }
      })

      currentSkillProcessData?.flowDefinition?.graph?.edges?.forEach((item) => {
        item.attrs = {
          ...item.attrs,
          line: {
            strokeWidth: 1,
            strokeDasharray: [0, 0]
          }
        }
      })
    }
    const graphData = hasGraphData
      ? {
          ...currentSkillProcessData?.flowDefinition?.graph,
          edges: currentSkillProcessData?.flowDefinition?.graph?.edges || []
        }
      : {
          nodes: [],
          edges: []
        }

    await app.executeCommand(XFlowGraphCommands.GRAPH_RENDER.id, {
      graphData
    })
    // 居中
    await app.executeCommand(XFlowGraphCommands.GRAPH_ZOOM.id, {
      factor: "fit", //"real" number 、 'fit' 、'real'
      zoomFitPadding: 20 //100
      // minScale: 0.5 // 最小缩放比例
    })
    app.translateGraph(0, 0)
    if (graphRef.current?.unfreeze) {
      graphRef.current.unfreeze()
    }
    graphBind()
  }

  const graphBind = useCallback(() => {
    if (graphRef.current) {
      if (graphRef.current.__hasBind) return
      graphRef.current.__hasBind = true
      graphRef.current.on("node:click", (data) => {
        // if (name === "begin-node") {
        //   setFormPanelVisible(false)
        // } else {
        //   setFormPanelVisible(true)
        // }
        changeComponentAndDebugPanel({
          open: true,
          width: 600,
          showDebuggerPanel: false
        })
        meta.saveStatic()
      })

      // TODO: 下面的代码基本走不到的样子？
      graphRef.current.on("edge:click", (...arg) => {
        console.log(arg, "线被点击了", graphRef.current)
        setFormPanelVisible(true)
        changeComponentAndDebugPanel({
          open: true,
          width: 600,
          showDebuggerPanel: false
        })
      })

      graphRef.current.on("edge:del", (...arg) => {
        console.log(arg, "线被删除了", graphRef.current)
        setFormPanelVisible(true)
      })
    }
    console.log(graphRef)
  }, [meta, setFormPanelVisible])

  const reRenderGraph = (graphData) => {
    if (graphRef.current?.freeze) {
      graphRef.current.freeze()
    }
    appData.current.executeCommand(XFlowGraphCommands.GRAPH_RENDER.id, {
      graphData
    })
    if (graphRef.current?.unfreeze) {
      graphRef.current.unfreeze()
    }
  }

  const detailNotAvailable = isShowDetail && !skillCanRead
  const showToolbar = !isShowDetail // 从灵犀市集工作流/订阅工作流进入，仅展示画布，隐藏左侧节点、工具栏、画布缩放、顶部操作栏
  const nodeCount = currentSkillProcessData?.flowDefinition?.graph?.nodes?.length || 0
  const isLargeGraph = nodeCount > 200

  return (
    <>
      {isAICreate && (
        // style={{ paddingTop: 30 }}
        <div style={{ position: "fixed", top: "17px", right: 0, left: 0, bottom: 0 }}>
          <ToolbarWithDrawers
            currentSkillInfo={currentSkillInfo}
            setFormPanelVisible={setFormPanelVisible}
            formPanelVisible={formPanelVisible}
            appData={appData}
            isAICreate={isAICreate}
            saveAiCreate={handleSaveAiCreate}
            style={{ top: 15 }}
          />
          <AiCreate
            botNo={botNo}
            appData={appData}
            currentSkillInfo={currentSkillInfo}
            ref={aiCreateRef}
          />
        </div>
      )}

      {/* 兼容 灵犀市集工作流/订阅工作流 展示逻辑 */}
      {isShowDetail ? (
        <SubscribeSkillInfo currentSkillInfo={currentSkillInfo} />
      ) : !isAICreate ? (
          
        <div style={{ height: 68 }}></div>
      ) : (
        ""
      )}
      {detailNotAvailable && <div className="skill-detail-unopened">工作流详情未开放</div>}
      {currentSkillProcessData && !detailNotAvailable && !isAICreate && (
        <XFlow
          className="flow-user-custom-clz"
          commandConfig={commandConfig}
          // isAutoCenter={true}
          onLoad={onLoad}
          meta={meta}
        >
          <FlowchartExtension />
          <FlowchartNodePanel
            show={showToolbar}
            defaultActiveKey={customNodesClass?.map((v) => v.key)}
            showOfficial={false}
            className="flow-class-panel"
            registerNode={[...customNodesClass]}
            position={{ width: 136, top: 16, bottom: 20, left: 0 }}
          />
          {showToolbar && (
            <CanvasToolbar
              className={`xflow-workspace-toolbar-top`}
              layout="horizontal"
              config={toolbarConfig}
              position={{ top: 0, left: 0, right: 0, bottom: 0 }}
            />
          )}
          <FlowchartCanvas
            position={{ top: 0, left: 0, right: 0, bottom: 0 }} //{ top: 40, left: 0, right: 0, bottom: 0 }
            config={{
              background: {
                color: "#f1f2f7"
              }
            }}
            edgeConfig={{
              strokeWidth: 1.2,
              strokeDasharray: [0, 0],
              attrs: {
                line: {
                  strokeWidth: 1.2,
                  strokeDasharray: [0, 0],
                  stroke: "#cbd5e1",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  targetMarker: { name: "none" },
                  sourceMarker: { name: "none" }
                }
              }
            }}
            onConfigChange={() => {}}
            onAddNode={() => {}}
          >
            {showToolbar && (
              <>
                <CanvasScaleToolbar
                  layout="horizontal"
                  position={{ bottom: 40, left: 10 }} //{ top: -40, right: 0 }
                  style={{
                    width: 150,
                    left: "auto",
                    height: 39
                  }}
                />
                <CanvasContextMenu config={menuConfig} />
                {!isLargeGraph && <CanvasSnapline color="#faad14" />}
                {!isLargeGraph && <CanvasNodePortTooltip />}
              </>
            )}
          </FlowchartCanvas>
          <KeyBindings config={keybindingConfig} />
          <Drawer
            width={componentAndDebugPanel.width}
            headerStyle={{ display: "none" }}
            bodyStyle={{ padding: 0 }}
            rootStyle={{
              zIndex: 100,
              position: "fixed",
              top: 68
            }}
            footer={null}
            open={componentAndDebugPanel.open}
            mask={false}
          >
            <CustomFlowchartFormPanel
              currentSkillInfo={currentSkillInfo}
              formPanelVisible={formPanelVisible}
              appData={appData}
            />
          </Drawer>

          {/* 顶部操作栏 */}
          {showToolbar && (
            <ToolbarWithDrawers
              currentSkillInfo={currentSkillInfo}
              setFormPanelVisible={setFormPanelVisible}
              formPanelVisible={formPanelVisible}
              appData={appData}
            />
          )}
          <FlowChartPreview onChartClick={reRenderGraph} />
          {/* <CanvasMiniMap
        position={{ top: 12, left: 12 }}
        nodeFillColor="#873bf4"
        borderColor="#873bf4"
        handlerColor="#873bf4"
        minimapOptions={{ width: 300, height: 200 }}
      /> */}
        </XFlow>
      )}
    </>
  )
}

export default XflowInstance
