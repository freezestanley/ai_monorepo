import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useSkillFlowData } from "@/store"
import { InsertNode } from "./InsertNode"
import { useFetchCatalogList } from "@/api/knowledge"
import { useLocation } from "react-router-dom"
import { useParams } from "react-router-dom"
import queryString from "query-string"
import { useFetchAvailableSkills } from "@/api/skill"
import { useFetchAvailablePluginTools } from "@/api/pluginTool"
import { useCustomTools } from "../../hooks"
import { memo } from "react"
import { useFetchStructureDatasetListByBotNo } from "@/api/structureKnowledge"
import { compressedStorage } from "../untils/storage"

import { useSearchParams } from "react-router-dom"

// API数据加载组件
const ApiDataLoader = ({ botNo, onDataUpdate }) => {
  const [searchParams] = useSearchParams()
  const agentNo = searchParams.get("agentNo")
  const { data: catalogData } = useFetchCatalogList(botNo)
  const { data: skillsData } = useFetchAvailableSkills({
    botNo: botNo,
    agentNo: agentNo
  })

  const { data: pluginToolsData } = useFetchAvailablePluginTools({ botNo })
  const { data: customToolsData } = useCustomTools()
  const { data: dataSetListData = [] } = useFetchStructureDatasetListByBotNo({
    botNo
  })

  // 默认值设置
  const defaultValues = {
    CATALOG: [],
    SKILLS: { selfSkills: [], subscribedSkills: [] },
    PLUGIN_TOOLS: { selfPlugins: [], subscribedPlugins: [] },
    CUSTOM_TOOLS: [],
    DATASET_LIST: []
  }

  // 从本地存储获取数据的函数
  const getLocalData = (key) => {
    try {
      const localData = compressedStorage.getItem(`XFLOW_V2_${key}_${botNo}`)
      return localData || defaultValues[key]
    } catch (error) {
      console.error(`Error getting local data for ${key}:`, error)
      return defaultValues[key]
    }
  }

  // 保存数据到本地存储的函数
  const saveLocalData = (key, data) => {
    try {
      if (key === "PLUGIN_TOOLS" || key === "SKILLS") {
        compressedStorage.setItem(`XFLOW_V2_${key}_${botNo}`, data)
      } else if (data && Array.isArray(data) && data.length > 0) {
        compressedStorage.setItem(`XFLOW_V2_${key}_${botNo}`, data)
      }
    } catch (error) {
      console.error(`Error saving local data for ${key}:`, error)
    }
  }

  // 获取最终数据（优先使用API数据，如果为空则使用本地数据，如果本地数据也为空则使用默认值）
  const getFinalData = (apiData, key) => {
    if (key === "PLUGIN_TOOLS" || key === "SKILLS") {
      if (apiData) {
        saveLocalData(key, apiData)
        return apiData
      }

      // if (apiData && (apiData?.selfSkills?.length || apiData?.subscribedSkills?.length)) {
      //   saveLocalData(key, apiData)
      //   return apiData
      // }

      return getLocalData(key)
    }

    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      saveLocalData(key, apiData)
      return apiData
    }
    const localData = getLocalData(key)
    return localData && Array.isArray(localData) && localData.length > 0
      ? localData
      : defaultValues[key]
  }

  // 只在组件首次加载和 botNo 变化时更新数据
  useEffect(() => {
    const finalData = {
      catalogData: getFinalData(catalogData, "CATALOG"),
      skillsData: getFinalData(skillsData, "SKILLS"),
      pluginToolsData: getFinalData(pluginToolsData, "PLUGIN_TOOLS"),
      customToolsData: getFinalData(customToolsData, "CUSTOM_TOOLS"),
      dataSetListData: getFinalData(dataSetListData, "DATASET_LIST")
    }

    onDataUpdate(finalData)
  }, [
    botNo,
    catalogData,
    skillsData,
    pluginToolsData,
    customToolsData,
    dataSetListData,
    onDataUpdate
  ])

  return null
}

const XflowV2TemplateComponent = (props) => {
  const { data } = props
  const isPositionOnlyChange = useRef(false)

  // Add cleanup effect

  // 检查位置变化的函数
  const checkPositionChange = useCallback((currentData) => {
    if (currentData?.isPressed || !currentData?.id || !currentData?.componentName) return true

    const graphData = compressedStorage.getItem("XFLOW_V2_DRAWER_DATA")
    if (!graphData) return false

    try {
      const originalNode = graphData.nodes.find((node) => node.id === currentData.id)
      if (!originalNode) return false
      const positionChanged = currentData.x !== originalNode.x || currentData.y !== originalNode.y
      return positionChanged
    } catch (error) {
      console.error("解析 graphData 失败", error)
      return false
    }
  }, [])

  // 在每次渲染时检查位置变化
  isPositionOnlyChange.current = checkPositionChange(data)

  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo: botNoFormQuery, parentOrigin, workbenchNo } = queryParams
  const { botNo: botNoFromParams } = useParams()
  const botNo = botNoFromParams || botNoFormQuery

  // useEffect(() => {
  //   return () => {
  //     // Only clear current bot's XFLOW_V2_ related cache on unmount
  //     if (botNo) {
  //       Object.keys(localStorage).forEach((key) => {
  //         if (key.startsWith("XFLOW_V2_") && key.includes(`_${botNo}`)) {
  //           localStorage.removeItem(key)
  //         }
  //       })
  //     }
  //   }
  // }, [botNo])

  // 初始化状态时从本地存储获取数据
  const getInitialData = (key) => {
    try {
      const storedData = compressedStorage.getItem(`XFLOW_V2_${key}_${botNo}`)
      return storedData || []
    } catch (error) {
      console.error(`Error getting initial data for ${key}:`, error)
      return []
    }
  }

  // 使用本地存储的数据初始化状态
  const [queryRange, setQueryRange] = useState(() => getInitialData("CATALOG"))
  const [availableSkills, setAvailableSkills] = useState(() => getInitialData("SKILLS"))
  const [availablePluginTools, setAvailablePluginTools] = useState(() =>
    getInitialData("PLUGIN_TOOLS")
  )
  const [toolOptions, setToolOptions] = useState(() => getInitialData("CUSTOM_TOOLS"))
  const [dataSetList, setDataSetList] = useState(() => {
    const storedData = getInitialData("DATASET_LIST")
    return storedData.map((field) => ({
      label: field.name,
      key: field.structureNo,
      value: field.structureNo,
      catalogNo: field.catalogNo
    }))
  })

  // 处理API数据更新的回调
  const handleDataUpdate = useCallback(
    ({ catalogData, skillsData, pluginToolsData, customToolsData, dataSetListData }) => {
      const getStoredData = (key, apiData) => {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
          compressedStorage.setItem(`XFLOW_V2_${key}_${botNo}`, apiData)
          return apiData
        }
        return getInitialData(key)
      }

      const finalCatalogData = getStoredData("CATALOG", catalogData)
      const finalSkillsData = getStoredData("SKILLS", skillsData)
      const finalPluginToolsData = getStoredData("PLUGIN_TOOLS", pluginToolsData)
      const finalCustomToolsData = getStoredData("CUSTOM_TOOLS", customToolsData)
      const finalDataSetListData = getStoredData("DATASET_LIST", dataSetListData)

      if (finalCatalogData.length > 0) setQueryRange(finalCatalogData)

      if (
        finalSkillsData.length > 0 ||
        finalSkillsData?.selfSkills?.length ||
        finalSkillsData?.selfsubscribedSkillsSkills?.length
      )
        setAvailableSkills(finalSkillsData)

      if (Object.keys(finalPluginToolsData)?.length > 0)
        setAvailablePluginTools(finalPluginToolsData)

      if (finalCustomToolsData.length > 0) setToolOptions(finalCustomToolsData)

      if (finalDataSetListData.length > 0) {
        const dateSetListOptions = finalDataSetListData.map((field) => ({
          label: field.name,
          key: field.structureNo,
          value: field.structureNo,
          catalogNo: field.catalogNo
        }))
        setDataSetList(dateSetListOptions)
      }
    },
    [botNo]
  )

  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)
  const currentSkillProcessData = skillFlowData

  // 只在非位置改变时加载 ApiDataLoader
  const apiDataLoader = useMemo(() => {
    if (isPositionOnlyChange.current) return null

    return <ApiDataLoader botNo={botNo} onDataUpdate={handleDataUpdate} />
  }, [botNo, handleDataUpdate, data])

  return useMemo(() => {
    if (!data) return null

    if (typeof data.x === "undefined" && typeof data.y === "undefined") {
      return null
    }

    return (
      <>
        {apiDataLoader}
        {InsertNode(
          data.name,
          data,
          queryRange,
          availableSkills,
          availablePluginTools,
          toolOptions,
          dataSetList,
          currentSkillProcessData,
          botNo,
          parentOrigin,
          workbenchNo
        )}
      </>
    )
  }, [
    data,
    apiDataLoader,
    queryRange,
    availableSkills,
    availablePluginTools,
    toolOptions,
    dataSetList,
    currentSkillProcessData,
    botNo,
    parentOrigin,
    workbenchNo
  ])
}

// memo的比较函数也需要修改
export const XflowV2Template = memo(XflowV2TemplateComponent, (prevProps, nextProps) => {
  const prevData = prevProps.data
  const nextData = nextProps.data

  if (
    prevData?.id === nextData?.id &&
    (prevData?.x !== nextData?.x || prevData?.y !== nextData?.y)
  ) {
    return true
  }

  return prevProps.data === nextProps.data
})
