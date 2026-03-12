import dagre from "@dagrejs/dagre"

/**
 * 计算节点的宽度因子，用于确定节点间距
 * @param {number} nodeWidth 节点宽度
 * @returns {number} 宽度因子
 */
export const calculateWidthFactor = (nodeWidth) => {
  // 修改为固定返回值，保证间距一致性，但值更小
  return 1.0
}

/**
 * 确保同一层级的节点不会重叠
 * @param {Object} nodePositions 节点位置映射
 * @param {Array} nodeIds 节点ID数组
 * @param {Object} nodeSizesMap 节点尺寸映射
 * @param {number} nodeSpacing 基础节点间距
 */
export const ensureNoOverlap = (nodePositions, nodeIds, nodeSizesMap, nodeSpacing) => {
  // 按照X坐标排序
  nodeIds.sort((a, b) => nodePositions[a].x - nodePositions[b].x)

  // 初次检查
  for (let i = 1; i < nodeIds.length; i++) {
    const prevNodeId = nodeIds[i - 1]
    const currNodeId = nodeIds[i]

    const prevNodeWidth = nodeSizesMap[prevNodeId].width
    const currNodeWidth = nodeSizesMap[currNodeId].width

    const prevNodeX = nodePositions[prevNodeId].x
    const currNodeX = nodePositions[currNodeId].x

    const prevRight = prevNodeX + prevNodeWidth / 2
    const currLeft = currNodeX - currNodeWidth / 2

    // 使用固定的间距因子，不再根据节点宽度动态计算
    const widthFactor = 1.0

    // 计算最小所需空间
    const minRequiredSpace = nodeSpacing * widthFactor

    // 如果存在重叠或间距不足，移动当前节点
    if (currLeft < prevRight + minRequiredSpace) {
      const offset = prevRight + minRequiredSpace - currLeft

      // 移动当前节点和所有右侧节点
      for (let j = i; j < nodeIds.length; j++) {
        nodePositions[nodeIds[j]].x += offset
      }
    }
  }

  // 二次检查，确保调整后没有新的重叠
  let hasOverlap = false
  for (let i = 1; i < nodeIds.length; i++) {
    const prevNodeId = nodeIds[i - 1]
    const currNodeId = nodeIds[i]

    const prevNodeWidth = nodeSizesMap[prevNodeId].width
    const prevRight = nodePositions[prevNodeId].x + prevNodeWidth / 2
    const currLeft = nodePositions[currNodeId].x - nodeSizesMap[currNodeId].width / 2

    if (currLeft <= prevRight) {
      hasOverlap = true
    }
  }

  if (!hasOverlap) {
    console.log("所有节点重叠已修复")
  }
}

/**
 * 获取节点的实际尺寸
 * @param {Array} nodes 节点数组
 * @returns {Object} 节点尺寸映射
 */
export const getNodeSizes = (nodes) => {
  const nodeSizes = {}
  const defaultWidth = 300
  const defaultHeight = 200

  // 从DOM获取每个节点的实际尺寸
  nodes.forEach((node) => {
    // 优先使用节点数据中的尺寸，如果有的话
    if (node.data && node.data.width && node.data.height) {
      nodeSizes[node.id] = {
        width: node.data.width,
        height: node.data.height
      }
      return
    }

    try {
      const nodeElement = document.querySelector(`.react-flow__node[data-id="${node.id}"]`)
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          // 取整到10的倍数，增加一致性
          nodeSizes[node.id] = {
            width: Math.ceil(rect.width / 10) * 10 + 20,
            height: Math.ceil(rect.height / 10) * 10 + 20
          }
          return
        }
      }
    } catch (e) {
      console.warn(`无法获取节点 ${node.id} 的尺寸，使用默认值`)
    }

    // 如果无法获取尺寸，使用默认值
    nodeSizes[node.id] = {
      width: defaultWidth,
      height: defaultHeight
    }
  })

  return nodeSizes
}

/**
 * 为没有连线的节点应用简单均匀网格布局
 * @param {Array} nodes 节点数组
 * @param {Object} nodeSizes 节点尺寸映射
 * @param {number} fixedNodeSpacing 固定节点间距
 * @returns {Array} 布局后的节点
 */
const applyGridLayout = (nodes, nodeSizes, fixedNodeSpacing) => {
  if (nodes.length <= 0) return nodes

  // 固定的行宽和节点间距
  const fixedRowWidth = 4 // 每行最多4个节点
  const spacing = fixedNodeSpacing || 200 // 使用固定间距代替动态间距

  // 按照ID排序，确保每次执行得到相同的排序结果
  const sortedNodes = [...nodes].sort((a, b) => {
    // 提取数字部分进行比较，确保稳定排序
    const idA = parseInt(a.id.replace(/\D/g, ""), 10) || 0
    const idB = parseInt(b.id.replace(/\D/g, ""), 10) || 0

    // 如果数字相同，则按完整ID字符串排序
    if (idA === idB) {
      return a.id.localeCompare(b.id)
    }

    return idA - idB
  })

  // 计算布局
  return sortedNodes.map((node, index) => {
    const row = Math.floor(index / fixedRowWidth)
    const col = index % fixedRowWidth

    // 使用固定的节点尺寸而不是动态计算的
    const nodeWidth = 300 // 固定宽度
    const nodeHeight = 200 // 固定高度

    return {
      ...node,
      position: {
        x: col * (nodeWidth + spacing),
        y: row * (nodeHeight + spacing)
      }
    }
  })
}

/**
 * 状态机专用布局函数 - 保持根节点位置不变，子节点左右排布
 * @param {Array} nodes 节点数组
 * @param {Array} edges 边数组
 * @returns {Object} 包含布局后的节点和边
 */
const getStateMachineLayout = (nodes, edges) => {
  // 找到根节点（开场白节点）
  const rootNode = nodes.find((node) => node.type === "stateMachineRoot")
  if (!rootNode) {
    console.warn("状态机模式下未找到根节点")
    return { nodes, edges }
  }

  // 保持根节点原有位置
  const rootPosition = rootNode.position

  // 找到所有子节点
  const childNodes = nodes.filter((node) => node.type === "stateMachineChild")

  if (childNodes.length === 0) {
    return { nodes, edges }
  }

  // 按照side分组子节点
  const leftChildren = childNodes.filter((node) => node.data?.side === "left")
  const rightChildren = childNodes.filter((node) => node.data?.side === "right")

  // 布局配置
  const safeSpacing = 80 // 节点之间的安全间距
  const nodeSpacing = 60 // 同侧节点间距

  // 获取节点实际尺寸的函数
  const getNodeDimensions = (nodeId) => {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`)
    if (nodeElement) {
      return {
        width: nodeElement.offsetWidth,
        height: nodeElement.offsetHeight
      }
    }
    return { width: 300, height: 140 } // 默认尺寸
  }

  // 获取根节点尺寸
  const rootDimensions = getNodeDimensions(rootNode.id)

  const layoutedNodes = [...nodes]

  // 左侧子节点布局
  if (leftChildren.length > 0) {
    // 计算总高度
    const leftDimensions = leftChildren.map((child) => getNodeDimensions(child.id))
    const totalContentHeight = leftDimensions.reduce((sum, dim) => sum + dim.height, 0)
    const totalSpacingHeight = (leftChildren.length - 1) * nodeSpacing
    const totalHeight = totalContentHeight + totalSpacingHeight

    // 起始Y坐标 - 以根节点为中心
    let currentY = rootPosition.y - totalHeight / 2

    leftChildren.forEach((child, index) => {
      const nodeIndex = layoutedNodes.findIndex((n) => n.id === child.id)
      if (nodeIndex !== -1) {
        const childDimensions = leftDimensions[index]
        // 计算左侧节点X坐标：根节点左边缘 - 安全间距 - 子节点宽度
        const leftX = rootPosition.x - safeSpacing - childDimensions.width

        layoutedNodes[nodeIndex] = {
          ...layoutedNodes[nodeIndex],
          position: {
            x: leftX,
            y: currentY
          }
        }
        currentY += childDimensions.height + nodeSpacing
      }
    })
  }

  // 右侧子节点布局
  if (rightChildren.length > 0) {
    // 计算总高度
    const rightDimensions = rightChildren.map((child) => getNodeDimensions(child.id))
    const totalContentHeight = rightDimensions.reduce((sum, dim) => sum + dim.height, 0)
    const totalSpacingHeight = (rightChildren.length - 1) * nodeSpacing
    const totalHeight = totalContentHeight + totalSpacingHeight

    // 起始Y坐标 - 以根节点为中心
    let currentY = rootPosition.y - totalHeight / 2

    rightChildren.forEach((child, index) => {
      const nodeIndex = layoutedNodes.findIndex((n) => n.id === child.id)
      if (nodeIndex !== -1) {
        const childDimensions = rightDimensions[index]
        // 计算右侧节点X坐标：根节点右边缘 + 安全间距
        const rightX = rootPosition.x + rootDimensions.width + safeSpacing

        layoutedNodes[nodeIndex] = {
          ...layoutedNodes[nodeIndex],
          position: {
            x: rightX,
            y: currentY
          }
        }
        currentY += childDimensions.height + nodeSpacing
      }
    })
  }

  return { nodes: layoutedNodes, edges }
}

/**
 * 使用dagre库进行自动布局的函数
 * @param {Array} nodes 节点数组
 * @param {Array} edges 边数组
 * @param {string} direction 布局方向，默认为'TB'(从上到下)
 * @returns {Object} 包含布局后的节点和边
 */
export const getLayoutedElements = (nodes, edges, direction = "TB") => {
  if (!nodes || nodes.length === 0) {
    return { nodes, edges }
  }

  // 检查是否为状态机模式（包含stateMachineRoot类型的节点）
  const hasStateMachineRoot = nodes.some((node) => node.type === "stateMachineRoot")
  if (hasStateMachineRoot) {
    // 使用状态机专用布局
    return getStateMachineLayout(nodes, edges)
  }

  // 固定的节点间距配置 - 减小间距值
  const nodeSpacing = 80 // 减小固定间距

  // 获取节点的尺寸映射
  const nodeSizes = getNodeSizes(nodes)

  // 如果没有边，使用简单的网格布局
  if (!edges || edges.length === 0) {
    const fixedNodeSpacing = 80 // 减小固定的节点间距
    const layoutedNodes = applyGridLayout(nodes, nodeSizes, fixedNodeSpacing)
    return { nodes: layoutedNodes, edges }
  }

  // 创建一个新的 dagre 图实例
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  // 根据布局方向优化配置参数
  const isHorizontal = direction === "LR" || direction === "RL"

  // 修改图配置，根据布局方向调整参数
  dagreGraph.setGraph({
    rankdir: direction, // 布局方向
    nodesep: isHorizontal ? 60 : 80, // 横向布局时减小节点间距
    ranksep: isHorizontal ? 200 : 150, // 横向布局时增加层间距
    edgesep: 60, // 固定边间距
    rankSep: isHorizontal ? 200 : 150, // 横向布局时增加层间距
    ranker: "network-simplex", // 布局算法
    marginx: isHorizontal ? 50 : 20, // 横向布局时增加水平边距
    marginy: isHorizontal ? 20 : 80, // 横向布局时减小垂直边距
    align: "UL" // 使用左上角对齐
  })

  // 分析节点间的连接结构和标签顺序
  const tagOrderMap = {}
  const targetNodesBySource = {}
  const incomingEdges = {} // 记录每个节点的入边数量

  // 初始化入边计数器和标签索引映射
  nodes.forEach((node) => {
    incomingEdges[node.id] = 0
    targetNodesBySource[node.id] = []

    // 为每个节点创建标签索引映射 (tagId -> index)
    if (node.data && node.data.tags && Array.isArray(node.data.tags)) {
      const tagIndices = {}
      node.data.tags.forEach((tag, index) => {
        const tagId = tag.id || `tag_${index}`
        tagIndices[tagId] = index
      })
      tagOrderMap[node.id] = tagIndices
    }
  })

  // 将所有节点添加到dagre图中，使用各自的实际尺寸
  nodes.forEach((node) => {
    const { width, height } = nodeSizes[node.id]
    dagreGraph.setNode(node.id, { width, height })
  })

  // 统计各节点入边数量并分析标签连接关系
  edges.forEach((edge) => {
    incomingEdges[edge.target] = (incomingEdges[edge.target] || 0) + 1

    // 设置边的权重，用于影响布局
    let weight = 1

    // 检查边是否包含sourceHandle信息（表示这是从标签发出的连接）
    if (edge.sourceHandle && edge.sourceHandle.includes("handle-")) {
      const sourceNode = edge.source
      const targetNode = edge.target

      // 从sourceHandle中提取标签ID或索引
      const handleParts = edge.sourceHandle.split("-")
      let tagIdentifier = null

      if (handleParts.length > 1) {
        tagIdentifier = handleParts.slice(1).join("-") // 获取handle-之后的部分作为标签标识符
      }

      // 如果能够确定标签顺序
      if (
        tagIdentifier &&
        tagOrderMap[sourceNode] &&
        tagOrderMap[sourceNode][tagIdentifier] !== undefined
      ) {
        const tagIndex = tagOrderMap[sourceNode][tagIdentifier]

        // 记录源节点、目标节点和标签顺序的关系
        targetNodesBySource[sourceNode].push({
          target: targetNode,
          tagIndex: tagIndex
        })

        // 根据标签索引设置权重 - 标签索引越小权重越大
        weight = 5 - Math.min(4, tagIndex)
      } else {
        // 如果没有标签信息，也记录连接关系
        targetNodesBySource[sourceNode].push({
          target: targetNode,
          tagIndex: -1 // 表示未知标签顺序
        })
      }
    }

    // 将边添加到dagre图中，带上权重
    dagreGraph.setEdge(edge.source, edge.target, { weight })
  })

  // 为每个源节点，按标签顺序对目标节点进行排序
  Object.keys(targetNodesBySource).forEach((sourceId) => {
    const targets = targetNodesBySource[sourceId]

    // 根据标签索引排序
    targets.sort((a, b) => {
      // 如果两个都有标签索引，按索引排序
      if (a.tagIndex >= 0 && b.tagIndex >= 0) {
        return a.tagIndex - b.tagIndex
      }
      // 有标签索引的排在前面
      if (a.tagIndex >= 0) return -1
      if (b.tagIndex >= 0) return 1
      // 都没有标签索引，保持原顺序
      return 0
    })
  })

  // 找出根节点（没有入边的节点）
  const rootNodes = Object.keys(incomingEdges).filter((nodeId) => incomingEdges[nodeId] === 0)

  // 运行dagre布局算法
  try {
    dagre.layout(dagreGraph)
  } catch (error) {
    console.error("Dagre布局计算出错:", error)
    return { nodes, edges }
  }

  // 获取层级信息
  const nodeRanks = {}
  const rankedNodes = {}

  // 收集所有节点的rank信息
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    if (!nodeWithPosition) return

    const rank = nodeWithPosition.y
    if (!nodeRanks[rank]) {
      nodeRanks[rank] = []
      rankedNodes[rank] = {}
    }

    nodeRanks[rank].push(node.id)
    rankedNodes[rank][node.id] = nodeWithPosition
  })

  // 计算画布整体宽度和中心点 - 考虑节点的实际宽度
  const maxNodesInRank = Math.max(...Object.values(nodeRanks).map((rank) => rank.length))

  // 找出最宽的节点，用于更好地估计画布宽度
  const maxNodeWidth = Math.max(...Object.values(nodeSizes).map((size) => size.width))
  const averageNodeWidth =
    Object.values(nodeSizes).reduce((sum, size) => sum + size.width, 0) / nodes.length

  // 使用较大值来确保有足够空间
  const effectiveNodeWidth = Math.max(maxNodeWidth, averageNodeWidth)
  const totalCanvasWidth = maxNodesInRank * (effectiveNodeWidth + nodeSpacing)
  const canvasCenter = totalCanvasWidth / 2

  // 对于每一个rank，优化节点水平位置
  Object.keys(nodeRanks).forEach((rank) => {
    const nodesInRank = nodeRanks[rank]

    // 如果这一层包含根节点，特殊处理
    if (nodesInRank.some((nodeId) => rootNodes.includes(nodeId))) {
      const rootNodesInRank = nodesInRank.filter((nodeId) => rootNodes.includes(nodeId))
      const nonRootNodes = nodesInRank.filter((nodeId) => !rootNodes.includes(nodeId))

      if (rootNodesInRank.length === 1) {
        // 单个根节点，居中显示
        const rootNodeId = rootNodesInRank[0]
        rankedNodes[rank][rootNodeId].x = canvasCenter

        // 其他非根节点均匀分布在根节点两侧
        if (nonRootNodes.length > 0) {
          const leftNodes = nonRootNodes.slice(0, Math.ceil(nonRootNodes.length / 2))
          const rightNodes = nonRootNodes.slice(Math.ceil(nonRootNodes.length / 2))

          // 计算每个节点的间距
          let leftX = canvasCenter
          // 获取根节点宽度，用于计算初始间距
          const rootNodeWidth = nodeSizes[rootNodeId].width

          // 左侧节点从右向左排列，起始点需考虑根节点宽度
          leftX -= rootNodeWidth / 2 + nodeSpacing

          // 左侧节点
          leftNodes.forEach((nodeId, index) => {
            const nodeWidth = nodeSizes[nodeId].width
            leftX -= nodeWidth / 2
            rankedNodes[rank][nodeId].x = leftX
            // 使用固定间距因子
            const widthFactor = 1.0
            leftX -= nodeWidth / 2 + nodeSpacing * widthFactor
          })

          // 右侧节点从左向右排列，起始点需考虑根节点宽度
          let rightX = canvasCenter + rootNodeWidth / 2 + nodeSpacing

          // 右侧节点
          rightNodes.forEach((nodeId, index) => {
            const nodeWidth = nodeSizes[nodeId].width
            rightX += nodeWidth / 2
            rankedNodes[rank][nodeId].x = rightX
            // 为下一个节点准备位置，考虑当前节点宽度
            // 根据节点宽度梯度增加间距因子
            const widthFactor = calculateWidthFactor(nodeWidth)

            rightX += nodeWidth / 2 + nodeSpacing * widthFactor
          })
        }
      } else if (rootNodesInRank.length > 1) {
        // 多个根节点，均匀分布在中心位置
        let totalRootWidth = 0
        let totalExtraSpacing = 0

        // 计算总宽度和额外间距
        rootNodesInRank.forEach((nodeId) => {
          const width = nodeSizes[nodeId].width
          totalRootWidth += width
          // 如果节点宽度超过200px，为其分配额外空间
          if (width > 200) {
            totalExtraSpacing += (width - 200) / 2
          }
        })

        const rootsSpacing = nodeSpacing * (rootNodesInRank.length - 1) + totalExtraSpacing
        const rootsWidth = totalRootWidth + rootsSpacing
        let rootStartX = canvasCenter - rootsWidth / 2

        // 根节点均匀分布
        rootNodesInRank.forEach((nodeId) => {
          const nodeWidth = nodeSizes[nodeId].width
          rootStartX += nodeWidth / 2
          rankedNodes[rank][nodeId].x = rootStartX

          // 使用固定间距因子
          const widthFactor = 1.0
          rootStartX += nodeWidth / 2 + nodeSpacing * widthFactor
        })

        // 非根节点放在右侧
        if (nonRootNodes.length > 0) {
          let nonRootStartX = rootStartX

          nonRootNodes.forEach((nodeId) => {
            const nodeWidth = nodeSizes[nodeId].width
            nonRootStartX += nodeWidth / 2 + nodeSpacing
            rankedNodes[rank][nodeId].x = nonRootStartX

            // 使用固定间距因子
            const widthFactor = 1.0
            nonRootStartX += nodeWidth / 2 + nodeSpacing * widthFactor
          })
        }
      }

      // 检查并修复同一层级节点的重叠
      ensureNoOverlap(rankedNodes[rank], nodesInRank, nodeSizes, nodeSpacing)
    } else {
      // 非根节点层级的处理 - 基于父节点位置和标签顺序

      // 分析节点的父节点位置
      const nodeParents = {}
      let parentCenterX = 0
      let parentCount = 0

      nodesInRank.forEach((nodeId) => {
        nodeParents[nodeId] = {
          parents: [],
          avgX: 0
        }

        // 查找指向该节点的所有边
        edges.forEach((edge) => {
          if (edge.target === nodeId) {
            const sourceRank = Object.keys(rankedNodes).find((r) =>
              Object.keys(rankedNodes[r]).includes(edge.source)
            )

            if (sourceRank && rankedNodes[sourceRank][edge.source]) {
              nodeParents[nodeId].parents.push({
                id: edge.source,
                x: rankedNodes[sourceRank][edge.source].x,
                // 如果是从标签发出的连接，记录标签信息
                tagIndex:
                  edge.sourceHandle && edge.sourceHandle.includes("handle-")
                    ? getTagIndexFromHandle(edge.sourceHandle, edge.source, tagOrderMap)
                    : -1
              })
            }
          }
        })

        // 计算该节点所有父节点的平均X位置
        if (nodeParents[nodeId].parents.length > 0) {
          const sum = nodeParents[nodeId].parents.reduce((acc, p) => acc + p.x, 0)
          nodeParents[nodeId].avgX = sum / nodeParents[nodeId].parents.length
          parentCenterX += nodeParents[nodeId].avgX
          parentCount++
        }
      })

      // 计算整体父节点的中心位置
      if (parentCount > 0) {
        parentCenterX = parentCenterX / parentCount
      } else {
        parentCenterX = canvasCenter
      }

      // 按照父节点位置和标签索引对节点排序
      nodesInRank.sort((nodeA, nodeB) => {
        const parentsA = nodeParents[nodeA].parents
        const parentsB = nodeParents[nodeB].parents

        // 如果两个节点共享父节点，按照标签索引排序
        const commonParent = parentsA.find((pA) => parentsB.some((pB) => pB.id === pA.id))

        if (commonParent) {
          const tagA = parentsA.find((p) => p.id === commonParent.id)?.tagIndex || 0
          const tagB = parentsB.find((p) => p.id === commonParent.id)?.tagIndex || 0

          if (tagA >= 0 && tagB >= 0) {
            return tagA - tagB
          }
        }

        // 没有共享父节点或无法确定标签顺序，按父节点平均位置排序
        return nodeParents[nodeA].avgX - nodeParents[nodeB].avgX
      })

      // 重新分配X坐标使节点均匀分布，考虑各节点的实际宽度
      let currentX = parentCenterX
      const nodesWidths = nodesInRank.map((nodeId) => nodeSizes[nodeId].width)

      // 计算总宽度，考虑到宽节点需要额外空间
      let totalNodesWidth = 0
      let totalExtraSpacing = 0

      nodesInRank.forEach((nodeId) => {
        const width = nodeSizes[nodeId].width
        totalNodesWidth += width
        // 如果节点宽度超过200px，为其分配额外空间
        if (width > 200) {
          totalExtraSpacing += (width - 200) / 2
        }
      })

      const totalSpacing = nodeSpacing * (nodesInRank.length - 1) + totalExtraSpacing

      // 确保从足够左侧开始，所有节点都有空间
      const startX = parentCenterX - (totalNodesWidth + totalSpacing) / 2

      let posX = startX
      nodesInRank.forEach((nodeId, index) => {
        const nodeWidth = nodeSizes[nodeId].width
        posX += nodeWidth / 2
        rankedNodes[rank][nodeId].x = posX

        // 使用固定间距因子
        const widthFactor = 1.0
        posX += nodeWidth / 2 + nodeSpacing * widthFactor
      })

      // 检查并修复同一层级节点的重叠
      ensureNoOverlap(rankedNodes[rank], nodesInRank, nodeSizes, nodeSpacing)
    }
  })

  // 在运行布局算法后，生成一个保存每个层级y坐标的映射
  const rankYPositions = {}

  // 收集所有rank的y坐标值（按照顶部对齐）
  Object.keys(nodeRanks).forEach((rank) => {
    // 使用该rank的第一个节点的y坐标作为该层所有节点的y坐标
    const firstNodeId = nodeRanks[rank][0]
    const firstNodePos = dagreGraph.node(firstNodeId)
    rankYPositions[rank] = firstNodePos.y - nodeSizes[firstNodeId].height / 2 // 减去半高，转换为顶部坐标
  })

  // 根据处理后的位置更新节点 - 同一层级的节点顶部对齐
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    if (!nodeWithPosition) return node

    const { width, height } = nodeSizes[node.id]

    // 找出此节点所在的rank
    const nodeRank = Object.keys(nodeRanks).find((rank) => nodeRanks[rank].includes(node.id))

    // 使用该rank的统一y坐标
    const yPosition = rankYPositions[nodeRank]

    // 调整为顶部对齐坐标 - 所有节点在同一层共享相同的y坐标
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: yPosition // 使用该层级的统一y坐标
      }
    }
  })

  return {
    nodes: layoutedNodes,
    edges
  }
}

/**
 * 辅助函数：从handle ID提取标签索引
 * @param {string} handleId 标签句柄ID
 * @param {string} sourceId 源节点ID
 * @param {Object} tagOrderMap 标签顺序映射
 * @returns {number} 标签索引
 */
const getTagIndexFromHandle = (handleId, sourceId, tagOrderMap) => {
  if (!handleId || !handleId.includes("handle-")) return -1

  const parts = handleId.split("-")
  if (parts.length < 2) return -1

  const tagId = parts.slice(1).join("-")

  if (tagOrderMap[sourceId] && tagOrderMap[sourceId][tagId] !== undefined) {
    return tagOrderMap[sourceId][tagId]
  }

  return -1
}
