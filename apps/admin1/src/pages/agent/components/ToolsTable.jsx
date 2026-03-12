import { useState, useEffect, useMemo } from "react"
import { message, Button, Popover, Spin, TreeSelect, Checkbox, Avatar, Tooltip, Tag } from "antd"
import { PlusOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { useUpdateToolApprove } from "@/api/agent"
import { useFetchAvailablePluginTools } from "@/api/pluginTool"
import type1 from "../../../assets/img/type1.png"
import type2 from "../../../assets/img/type2.png"
import type3 from "../../../assets/img/type3.png"
import { useLocation } from "react-router-dom"
import queryString from "query-string"

// 工作流图标类型映射
const SKILLICONTYPE = {
  1: type3, // 快速问答
  2: type2, // 表单类型
  3: type1, // API类型
  4: type3 // 默认类型
}

// 工具项组件
export const ToolItem = ({
  item,
  isVoice = false,
  idKey = "id",
  avatarBgColor = "#7F56D9",
  checked,
  onCheckChange,
  showActions,
  onEdit,
  onDelete,
  onView,
  onApproveChange,
  isApproved = false,
  isVar = false
}) => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, workbenchNo, parentOrigin } = queryParams
  const origin = decodeURIComponent(parentOrigin || "")

  return (
    <div
      className={`flex items-center gap-[12px] bg-[#F9FAFB] rounded-[8px] p-[12px] w-full ${onCheckChange ? "cursor-pointer" : ""}`}
      onClick={() => {
        if (onCheckChange) {
          onCheckChange(!checked, item[idKey])
        }
      }}
    >
      {onCheckChange && (
        <Checkbox
          checked={checked}
          onChange={(e) => {
            e.stopPropagation()
            onCheckChange(e.target.checked, item[idKey])
          }}
        />
      )}
      {/* 根据类型显示不同图标 */}
      {/* 知识库项使用简单的 Avatar */}
      {item.description === "文档知识库" ||
      item.description === "问答知识库" ||
      item.description === "结构化知识库" ||
      isVar ? (
        <Avatar
          shape="square"
          size={40}
          className="flex-shrink-0"
          style={{ backgroundColor: avatarBgColor }}
        >
          {item.name?.slice(0, 1)}
        </Avatar>
      ) : item.type === "normal" || (item.type === "sub" && !item.skillType) ? (
        <Avatar
          src={item.icon}
          shape="square"
          size={40}
          className="flex-shrink-0"
          style={{ backgroundColor: avatarBgColor }}
        >
          {item.name?.slice(0, 1)}
        </Avatar>
      ) : (
        <Avatar
          src={SKILLICONTYPE[item.skillType || item.type || 4]}
          shape="square"
          size={40}
          className="flex-shrink-0"
          style={{ padding: "5px" }}
        >
          {item.name?.slice(0, 1)}
        </Avatar>
      )}
      <div className="flex-1 w-[60%]">
        <div className="flex items-center gap-[6px]">
          {/* {item.type === "sub" && onDelete && (
            <span className="text-[10px] inline-block  text-[#f66a3f] bg-[#FFF4ED]  rounded-[4px]">
              订阅
            </span>
          )} */}
          <Tooltip title={item.name}>
            <div className="text-[14px] text-[#181B25] font-[500] truncate w-[85%]">
              {isVar && !item.enabled && (
                <Tag className="m-0 !px-1 !text-[10px] h-[15px] leading-[14px] !mr-1" color="red">
                  禁用
                </Tag>
              )}
              {item.name}
            </div>
          </Tooltip>
        </div>
        <Tooltip title={item.description}>
          <div className="text-[12px] text-[#475467] truncate w-[100%]">{item.description}</div>
        </Tooltip>
      </div>
      <div className="flex items-center gap-[8px]">
        {onApproveChange && (
          <Tooltip title={isApproved ? "取消授权" : "设置授权"}>
            {isApproved ? (
              <LockOutlined
                className="text-[#7F56D9] cursor-pointer !hover:text-[#7F56D9] -mt-[2px] text-[14px]"
                onClick={(e) => {
                  e.stopPropagation()
                  onApproveChange(false, item[idKey], item.name)
                }}
              />
            ) : (
              <UnlockOutlined
                className="text-[#98A2B3] cursor-pointer !hover:text-[#7F56D9] -mt-[2px] text-[14px]"
                onClick={(e) => {
                  e.stopPropagation()
                  onApproveChange(true, item[idKey], item.name)
                }}
              />
            )}
          </Tooltip>
        )}
        {onView && (
          <>
            {isVoice && (
              <Button
                type="link"
                size="small"
                onClick={() => {
                  console.log("item,=>>", item)
                  window.open(
                    `${origin}/knowledge/${item.structureNo ? "structure" : "questions"}?botNo=${botNo}&workbenchNo=${workbenchNo}&catalogNo=${item.baseNo || ""}&knowledgeData=${item.knowledgeBaseNo || ""}&structureNo=${item.knowledgeBaseNo || ""}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }}
                className="!p-0 !h-auto text-[#98A2B3] hover:!text-[#7F56D9] mr-3"
              >
                知识管理
              </Button>
            )}

            <Button
              type="link"
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onView(item)
              }}
              className="!p-0 !h-auto text-[#98A2B3] hover:!text-[#7F56D9] mr-3"
            >
              {isVoice ? "话术配置" : "查看"}
            </Button>
          </>
        )}
        {onEdit && (
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
            className="!p-0 !h-auto text-[#98A2B3] hover:!text-[#7F56D9] mr-3"
          >
            编辑
          </Button>
        )}
        {onDelete && (
          <i
            className="text-[#98A2B3] cursor-pointer hover:text-red-500 text-[14px] font-[500] iconfont icon-shanchu1"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item[idKey])
            }}
          />
        )}
      </div>
    </div>
  )
}

// 查找工具所属类型（自己的还是订阅的）
const findPluginType = (toolId, treeData) => {
  // 检查工具是否在某个节点的子节点中
  const checkInChildren = (children, toolId, parentType) => {
    if (!children) return null

    for (const child of children) {
      if (child.catalogNo === toolId) {
        return parentType
      }

      const found = checkInChildren(
        child.children,
        toolId,
        child.catalogNo === "self" ? "normal" : "sub"
      )
      if (found) return found
    }

    return null
  }

  // 检查每个顶层节点
  for (const node of treeData || []) {
    if (node.catalogNo === "self") {
      const found = checkInChildren(node.children, toolId, "normal")
      if (found) return found
    } else if (node.catalogNo === "other") {
      const found = checkInChildren(node.children, toolId, "sub")
      if (found) return found
    }
  }

  return "normal" // 默认为普通工具类型
}

const ToolsTable = ({
  isOnlyRead,
  agentDetail,
  setSelectedTools,
  selectedTools,
  selectedSkills,
  knowledgeBases,
  onSave,
  botNo
}) => {
  const [isToolCollapsed, setIsToolCollapsed] = useState(selectedTools?.length === 0)
  const [popoverVisible, setPopoverVisible] = useState(false)
  const [toolApproveMap, setToolApproveMap] = useState({})
  const [tempSelectedTools, setTempSelectedTools] = useState([])
  const [pluginTreeData, setPluginTreeData] = useState([])
  const [pluginSearchKey, setPluginSearchKey] = useState("")

  // 获取工具树形数据
  const { data: availablePluginTools = {}, isLoading: pluginTreeDataLoading } =
    useFetchAvailablePluginTools({
      botNo,
      enabled: !!botNo
    })

  const { mutate: updateToolApprove } = useUpdateToolApprove()

  // 初始化数据和请求
  useEffect(() => {
    if (agentDetail && pluginTreeData.length > 0) {
      // 扁平化工具树，获取所有有效的工具 ID（toolCode）
      const flattenPluginTree = (nodes) => {
        let result = []
        if (!nodes) return result

        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            result = [...result, ...flattenPluginTree(node.children)]
          } else if (node.toolCode) {
            // 收集具有 toolCode 的节点（真正的工具）
            result.push(node.toolCode)
          }
        })

        return result
      }

      // 获取所有有效的工具 ID
      const validToolIds = flattenPluginTree(pluginTreeData)

      // 过滤选中工具数据，只保留在 pluginTreeData 中存在的工具
      const filteredPluginNos = (agentDetail.pluginNos || []).filter((pluginNo) =>
        validToolIds.includes(pluginNo)
      )

      console.log("result", validToolIds, filteredPluginNos)

      setTempSelectedTools(filteredPluginNos)
      setSelectedTools(filteredPluginNos)
    }
  }, [agentDetail, pluginTreeData])

  // 初始化插件树时自动打开弹窗
  useEffect(() => {
    if (popoverVisible) {
      setTempSelectedTools(selectedTools)
    }
  }, [popoverVisible])

  // 处理从 agentDetail 中初始化预授权配置
  useEffect(() => {
    if (agentDetail) {
      // 初始化工具预授权状态
      const toolApproves = {}
      if (agentDetail.pluginToolConfigs && agentDetail.pluginToolConfigs.length > 0) {
        agentDetail.pluginToolConfigs.forEach((config) => {
          if (config.toolType === "plugin") {
            toolApproves[config.toolNo] = config.preApprove
          }
        })
      }
      setToolApproveMap(toolApproves)
    }
  }, [agentDetail])

  // 监听 selectedTools 变化，更新折叠状态
  useEffect(() => {
    setIsToolCollapsed(selectedTools?.length === 0)
  }, [selectedTools])

  // 处理工具树形数据
  useEffect(() => {
    if (availablePluginTools && !pluginTreeDataLoading) {
      const selfPlugins =
        availablePluginTools?.selfPlugins?.map((plugin) => {
          return {
            ...plugin,
            catalogName: plugin.pluginName,
            catalogNo: plugin.pluginCode,
            selectable: false,
            checkable: false, // 父节点不可被勾选
            title: plugin.pluginName, // 添加title属性用于tooltip
            children:
              plugin.tools?.map((tool) => {
                return {
                  ...tool,
                  catalogName: tool.toolName,
                  catalogNo: tool.toolCode,
                  selectable: true, // 明确指定叶子节点可选
                  checkable: true, // 叶子节点可被勾选
                  title: tool.toolName // 添加title属性用于tooltip
                }
              }) || []
          }
        }) || []
      const subscribedPlugins =
        availablePluginTools?.subscribedPlugins?.map((plugin) => {
          return {
            ...plugin,
            catalogName: plugin.pluginName,
            catalogNo: plugin.pluginCode,
            selectable: false,
            checkable: false, // 父节点不可被勾选
            title: plugin.pluginName, // 添加title属性用于tooltip
            children:
              plugin.tools?.map((tool) => {
                return {
                  ...tool,
                  catalogName: tool.toolName,
                  catalogNo: tool.toolCode,
                  selectable: true, // 明确指定叶子节点可选
                  checkable: true, // 叶子节点可被勾选
                  title: tool.toolName // 添加title属性用于tooltip
                }
              }) || []
          }
        }) || []

      setPluginTreeData([
        {
          catalogName: "来自本空间",
          catalogNo: "self",
          selectable: false,
          checkable: false, // 顶层节点不可被勾选
          title: "来自本空间", // 添加title属性用于tooltip
          children: selfPlugins
        },
        {
          catalogName: "来自其他空间",
          catalogNo: "other",
          selectable: false,
          checkable: false, // 顶层节点不可被勾选
          title: "来自其他空间", // 添加title属性用于tooltip
          children: subscribedPlugins
        }
      ])
    }
  }, [availablePluginTools, pluginTreeDataLoading])

  // 渲染选中的工具列表
  const selectedToolsList = useMemo(() => {
    // 扁平化工具树，找到所有的工具节点
    const flattenPluginTree = (nodes) => {
      let result = []
      if (!nodes) return result

      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          result = [...result, ...flattenPluginTree(node.children)]
        } else {
          result.push(node)
        }
      })

      return result
    }

    // 获取所有工具节点
    const allTools = flattenPluginTree(pluginTreeData)

    // 过滤出选中的工具
    return allTools
      .filter((tool) => selectedTools.includes(tool.catalogNo))
      .map((tool) => ({
        id: tool.catalogNo,
        bizNo: tool.catalogNo,
        name: tool.catalogName,
        description: tool.catalogName,
        icon: tool.icon,
        // 判断是否为订阅工具 - 根据其所在的分类判断
        type: findPluginType(tool.catalogNo, pluginTreeData)
      }))
  }, [pluginTreeData, selectedTools])

  // 删除工具时触发保存
  const handleToolDelete = (id) => {
    const newSelectedTools = selectedTools.filter((no) => no != id)

    // 重置已删除工具的授权状态
    setToolApproveMap((prev) => {
      const newMap = { ...prev }
      delete newMap[id] // 从授权状态映射中移除
      return newMap
    })

    setSelectedTools(newSelectedTools)
    // 同时更新临时选中状态
    setTempSelectedTools(newSelectedTools)
    // 确保传递最新的数据给父组件，并过滤掉空值
    onSave?.({
      pluginNos: newSelectedTools.filter((toolId) => toolId),
      skillNos: selectedSkills.filter((skillId) => skillId),
      knowledgeBases: knowledgeBases
    })
  }

  // 处理工具预授权状态变更
  const handleToolApproveChange = (isApproved, toolNo, toolName) => {
    if (!agentDetail || !agentDetail.agentNo || !agentDetail.versionNo) {
      message.error("Agent 信息不完整，无法更新授权状态")
      return
    }

    updateToolApprove(
      {
        agentNo: agentDetail.agentNo,
        versionNo: agentDetail.versionNo,
        pluginToolNo: toolNo,
        skillNo: "",
        preApprove: isApproved
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            // 直接更新本地状态，不通知父组件刷新
            setToolApproveMap((prev) => ({
              ...prev,
              [toolNo]: isApproved
            }))
            message.success(`工具【${toolName}】${isApproved ? "已设置授权" : "已取消授权"}`)
          }
        }
      }
    )
  }

  // 工具选择器
  const toolSelector = () => (
    <div className="w-[300px]">
      {pluginTreeDataLoading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : (
        <TreeSelect
          showSearch
          style={{ width: "100%" }}
          dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
          placeholder="请选择工具"
          placement="bottomRight"
          allowClear
          multiple
          treeCheckable={true}
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          treeData={pluginTreeData}
          value={tempSelectedTools}
          onChange={(value) => {
            // 计算被移除的工具项
            const removedTools = tempSelectedTools.filter((id) => !value.includes(id))

            // 更新选中的工具
            setTempSelectedTools(value) //removedTools
          }}
          fieldNames={{
            label: "catalogName",
            value: "catalogNo",
            children: "children"
          }}
          filterTreeNode={(inputValue, treeNode) => {
            const catalogName = treeNode.catalogName || ""
            return catalogName.toLowerCase().includes(inputValue.toLowerCase())
          }}
          treeNodeFilterProp="catalogName"
          searchValue={pluginSearchKey}
          onSearch={(value) => setPluginSearchKey(value)}
          dropdownClassName="custom-tree-select-dropdown"
        />
      )}
      <div className="flex justify-end gap-2 mt-4">
        <Button size="small" onClick={() => setPopoverVisible(false)}>
          取消
        </Button>
        <Button
          size="small"
          type="primary"
          onClick={() => {
            // 计算新增和移除的工具
            const addedTools = tempSelectedTools.filter((id) => !selectedTools.includes(id))
            const removedTools = selectedTools.filter((id) => !tempSelectedTools.includes(id))

            // 重置移除的工具的授权状态
            if (removedTools.length > 0) {
              setToolApproveMap((prev) => {
                const newMap = { ...prev }
                removedTools.forEach((id) => {
                  delete newMap[id]
                })
                return newMap
              })
            }

            setSelectedTools(tempSelectedTools)
            setPopoverVisible(false)
            message.success("工具选择已更新")
            onSave?.({
              pluginNos: tempSelectedTools,
              skillNos: selectedSkills.filter((skillId) => skillId),
              knowledgeBases: knowledgeBases
            })
          }}
        >
          确认
        </Button>
      </div>
    </div>
  )

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-[4px] cursor-pointer group w-full"
          onClick={() => setIsToolCollapsed(!isToolCollapsed)}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-[6px]">
              <i
                className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                  isToolCollapsed ? "rotate-90" : "rotate-180"
                }`}
              ></i>
              <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                工具
              </span>
            </div>
          </div>
        </div>
        {!isOnlyRead && (
          <Popover
            content={toolSelector()}
            title="选择工具"
            trigger="click"
            open={popoverVisible}
            onOpenChange={(visible) => {
              setPopoverVisible(visible)
              if (visible) {
                setTempSelectedTools(selectedTools)
              }
            }}
            placement="right"
          >
            <Button type="text" icon={<PlusOutlined />} />
          </Popover>
        )}
      </div>
      <div
        className={`transition-all duration-300 origin-top ${
          isToolCollapsed
            ? "transform scale-y-0 h-0 opacity-0"
            : "transform scale-y-100 opacity-100"
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {selectedToolsList.length > 0 ? (
            selectedToolsList.map((item) => (
              <ToolItem
                key={item.type === "normal" ? item.id : item.bizNo}
                item={item}
                idKey={item.type === "normal" ? "id" : "bizNo"}
                avatarBgColor={item.type === "sub" ? "#f66a3f" : "#7F56D9"}
                showActions={item.type === "normal"}
                onDelete={!isOnlyRead && handleToolDelete}
                onApproveChange={!isOnlyRead && handleToolApproveChange}
                isApproved={toolApproveMap[item.type === "normal" ? item.id : item.bizNo]}
              />
            ))
          ) : (
            <div className="w-full">
              <CustomEmpty description="请添加工具" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ToolsTable
