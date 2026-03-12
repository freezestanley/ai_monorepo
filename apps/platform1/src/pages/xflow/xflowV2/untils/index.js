import { NodesV2 } from "../constant"
import { compressedStorage } from "./storage"

// 浮动区间
const floatStyle = {
  width: 40,
  height: 30
}

export const getNewNodeConfig = (nodes, edges = []) => {
  if (!Array.isArray(nodes)) return nodes

  // 检查是否所有节点都已经是默认宽度
  const hasDefaultWidth = nodes.every((node) => node.width === NodesV2.rectangleNode.width)

  // 如果已经是默认宽度，直接返回原始节点
  if (hasDefaultWidth) {
    return nodes
  }

  const spacing = {
    vertical: 80,
    horizontal: 100,
    minDistance: 60
  }

  // 首先计算每个节点的实际尺寸
  const nodeDimensions = new Map()
  nodes.forEach((node) => {
    const matchedNode = Object.values(NodesV2).find((config) =>
      config.nodeType?.includes(node.name)
    )
    nodeDimensions.set(node.id, {
      width: matchedNode?.width || NodesV2.rectangleNode.width,
      height: matchedNode?.height || NodesV2.rectangleNode.height
    })
  })

  // 创建节点连接关系图
  const connectionMap = new Map()
  nodes.forEach((node) => {
    connectionMap.set(node.id, { parents: [], children: [] })
  })

  // 构建连接关系
  edges.forEach((edge) => {
    const sourceId = edge.source.cell || edge.source
    const targetId = edge.target.cell || edge.target

    if (connectionMap.has(sourceId) && connectionMap.has(targetId)) {
      connectionMap.get(sourceId).children.push(targetId)
      connectionMap.get(targetId).parents.push(sourceId)
    }
  })

  // 计算每层的最大高度
  const yGroups = new Map()
  const yLevels = new Set()
  const levelHeights = new Map()

  nodes.forEach((node) => {
    const yLevel = Math.floor(node.y / 50)
    yLevels.add(yLevel)
    if (!yGroups.has(yLevel)) {
      yGroups.set(yLevel, [])
      levelHeights.set(yLevel, 0)
    }
    yGroups.get(yLevel).push(node)
    // 更新该层的最大高度
    const nodeHeight = nodeDimensions.get(node.id).height
    levelHeights.set(yLevel, Math.max(levelHeights.get(yLevel), nodeHeight))
  })

  // 计算每层的累积高度
  const levelYPositions = new Map()
  let accumulatedY = 0
  Array.from(yLevels)
    .sort((a, b) => a - b)
    .forEach((level) => {
      levelYPositions.set(level, accumulatedY)
      accumulatedY += levelHeights.get(level) + spacing.vertical
    })

  // 计算节点新位置
  const newPositions = new Map()
  const sortedLevels = Array.from(yLevels).sort((a, b) => a - b)

  sortedLevels.forEach((level) => {
    const levelNodes = yGroups.get(level)
    const baseY = levelYPositions.get(level)

    // 按原始X坐标排序
    levelNodes.sort((a, b) => a.x - b.x)

    // 处理当前层的节点
    levelNodes.forEach((node, index) => {
      const { width, height } = nodeDimensions.get(node.id)
      const parents = connectionMap.get(node.id).parents
      const parentPositions = parents.map((pId) => newPositions.get(pId)).filter((pos) => pos)

      let newX = node.x
      // 使用累积的Y坐标
      const newY = baseY + (levelHeights.get(level) - height) / 2 // 垂直居中对齐

      if (parentPositions.length > 0) {
        // 计算父节点的中心位置
        const parentCenterX =
          parentPositions.reduce(
            (sum, pos) => sum + (pos.x + nodeDimensions.get(node.id).width / 2),
            0
          ) / parentPositions.length

        // 获取同父节点的兄弟节点
        const siblings = levelNodes.filter((n) =>
          connectionMap.get(n.id).parents.some((p) => parents.includes(p))
        )

        if (siblings.length > 1) {
          // 计算兄弟节点的总宽度，考虑每个节点的实际宽度
          const totalWidth = siblings.reduce((sum, sibling, i) => {
            const siblingWidth = nodeDimensions.get(sibling.id).width
            return sum + siblingWidth + (i < siblings.length - 1 ? spacing.minDistance : 0)
          }, 0)

          // 计算起始位置
          let startX = parentCenterX - totalWidth / 2

          // 计算当前节点的位置
          const siblingIndex = siblings.indexOf(node)
          newX = startX
          for (let i = 0; i < siblingIndex; i++) {
            newX += nodeDimensions.get(siblings[i].id).width + spacing.minDistance
          }
        } else {
          // 单个子节点对齐到父节点中心
          newX = parentCenterX - width / 2
        }
      } else if (index > 0) {
        // 没有父节点时，确保与前一个节点保持最小距离
        const prevNode = levelNodes[index - 1]
        const prevPos = newPositions.get(prevNode.id)
        if (prevPos) {
          const minX = prevPos.x + nodeDimensions.get(prevNode.id).width + spacing.minDistance
          newX = Math.max(newX, minX)
        }
      }

      // 存储新位置
      newPositions.set(node.id, {
        x: newX,
        y: newY,
        width,
        height
      })
    })
  })

  // 最后一次检查和调整重叠
  let hasOverlap = true
  while (hasOverlap) {
    hasOverlap = false
    nodes.forEach((node) => {
      const pos = newPositions.get(node.id)
      const sameLevel = Array.from(newPositions.entries())
        .filter(([id]) => {
          if (id === node.id) return false
          const otherNode = nodes.find((n) => n.id === id)
          const otherPos = newPositions.get(id)
          return Math.abs(otherPos.y - pos.y) < spacing.vertical
        })
        .map(([id, p]) => ({ id, ...p }))

      sameLevel.forEach((other) => {
        const overlap = Math.abs(other.x + other.width / 2 - (pos.x + pos.width / 2))
        if (overlap < spacing.minDistance + Math.max(other.width, pos.width) / 2) {
          hasOverlap = true
          if (pos.x > other.x) {
            pos.x = other.x + other.width + spacing.minDistance
          } else {
            pos.x = other.x - pos.width - spacing.minDistance
          }
        }
      })
    })
  }

  return nodes.map((node) => ({
    ...node,
    ...newPositions.get(node.id)
  }))
}

// 工具匹配 数组处理
export const pluginTools = (availablePluginTools) => {
  const selfPlugins =
    availablePluginTools?.selfPlugins?.map((plugin) => {
      return {
        ...plugin,
        title: plugin.pluginName,
        value: plugin.pluginCode,
        selectable: false,
        italic: true,
        children:
          plugin.tools?.map((tool) => {
            return { ...tool, title: tool.toolName, value: tool.toolCode }
          }) || []
      }
    }) || []
  const subscribedPlugins =
    availablePluginTools?.subscribedPlugins?.map((plugin) => {
      return {
        ...plugin,
        title: plugin.pluginName,
        value: plugin.pluginCode,
        selectable: false,
        children:
          plugin.tools?.map((tool) => {
            return { ...tool, title: tool.toolName, value: tool.toolCode }
          }) || []
      }
    }) || []
  return [
    {
      title: "来自本空间",
      value: "self",
      selectable: false,
      children: selfPlugins
    },
    {
      title: "来自其他空间",
      value: "other",
      selectable: false,
      children: subscribedPlugins
    }
  ]
}

// 添加新的布局处理函数
export const adjustNodesLayout = (nodes, edges, isHorizontal = true) => {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return nodes

  // 创建邻接表表示图结构
  const graph = new Map()
  const inDegree = new Map()

  nodes.forEach((node) => {
    graph.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  // // 构建图结构
  // edges.forEach((edge) => {
  //   const sourceId = edge.source.cell
  //   const targetId = edge.target.cell
  //   graph.get(sourceId).push(targetId)
  //   inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1)
  // })

  // 获取所有起始节点（入度为0的节点）
  const startNodes = Array.from(inDegree.entries())
    .filter(([_, degree]) => degree === 0)
    .map(([id]) => id)

  // 层次遍历处理
  const levels = []
  let currentLevel = startNodes
  const visited = new Set()

  while (currentLevel.length > 0) {
    levels.push(currentLevel)
    const nextLevel = []

    currentLevel.forEach((nodeId) => {
      visited.add(nodeId)
      graph.get(nodeId).forEach((targetId) => {
        if (!visited.has(targetId)) {
          nextLevel.push(targetId)
        }
      })
    })

    currentLevel = nextLevel
  }

  // 计算每层的最大宽度和高度
  const levelDimensions = levels.map((level) => {
    return level.reduce(
      (acc, nodeId) => {
        const node = nodes.find((n) => n.id === nodeId)
        return {
          width: Math.max(acc.width, node.width || 0),
          height: Math.max(acc.height, node.height || 0)
        }
      },
      { width: 0, height: 0 }
    )
  })

  // 计算累积尺寸
  const cumulativeSizes = levelDimensions.reduce((acc, dim) => {
    const last = acc[acc.length - 1] || { x: 0, y: 0 }
    acc.push({
      x: last.x + (isHorizontal ? dim.width + 100 : 0),
      y: last.y + (!isHorizontal ? dim.height + 80 : 0)
    })
    return acc
  }, [])

  const newPositions = new Map()

  // 更新节点位置
  levels.forEach((level, levelIndex) => {
    const levelSize = levelDimensions[levelIndex]
    const startPos = cumulativeSizes[levelIndex]

    level.forEach((nodeId, nodeIndex) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return

      if (isHorizontal) {
        // 横向布局
        newPositions.set(nodeId, {
          x: startPos.x,
          y: nodeIndex * (levelSize.height + 60) + 100,
          width: node.width,
          height: node.height
        })
      } else {
        // 纵向布局
        newPositions.set(nodeId, {
          x: nodeIndex * (levelSize.width + 60) + 100,
          y: startPos.y,
          width: node.width,
          height: node.height
        })
      }
    })
  })

  // 返回更新后的节点位置
  return {
    nodes: nodes.map((node) => ({
      ...node,
      ...(newPositions.get(node.id) || {})
    })),
    edges // 直接返回原始的edges数组
  }
}

export const saveFlowDataToStorage = (nodes, edges) => {
  try {
    const flowData = {
      nodes,
      edges,
      timestamp: new Date().getTime()
    }
    compressedStorage.setItem("XFLOW_V2_DRAWER_DATA", flowData)
    return true
  } catch (error) {
    console.error("Failed to save flow data:", error)
    return false
  }
}

export const getFlowDataFromStorage = () => {
  try {
    const data = compressedStorage.getItem("XFLOW_V2_DRAWER_DATA")
    if (!data) return null
    return data
  } catch (error) {
    console.error("Failed to get flow data:", error)
    return null
  }
}
