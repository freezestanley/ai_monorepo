// 模拟数据
export const mockDashboardData = {
  // 活跃空间/活跃用户数
  activeBotsUsers: {
    activeBots: 125,
    activeUsers: 3421
  },
  // 活跃 Agent 数/工作流调用次数
  activeAgentsSkills: {
    activeAgents: 89,
    skillCalls: 15678
  },
  // 活跃 Agent 数/Agent 调用次数
  activeAgentsCalls: {
    activeAgents: 89,
    agentCalls: 23456
  },
  // 被调用模型数/模型调用量
  calledModels: {
    calledModels: 15,
    modelCalls: 98765
  },
  // 知识库数量
  knowledgeBases: 42
}

// Tooltip 提示内容
export const tooltipContent = {
  activeBots: "当前处于活跃状态的空间数量",
  activeUsers: "当前活跃的用户数量",
  activeAgents: "当前活跃的 Agent 数量",
  skillCalls: "工作流被调用的总次数",
  agentCalls: "Agent 被调用的总次数",
  calledModels: "被调用的模型数量",
  modelCalls: "模型被调用的总次数",
  knowledgeBases: "知识库的总数量"
}
