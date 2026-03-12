// 活跃空间数的模拟数据
export const mockActiveBotsChartData = {
  daily: [
    { date: "11-01", count: 120 },
    { date: "11-02", count: 135 },
    { date: "11-03", count: 110 },
    { date: "11-04", count: 145 },
    { date: "11-05", count: 130 },
    { date: "11-06", count: 155 },
    { date: "11-07", count: 140 }
  ],
  weekly: [
    { date: "第1周", count: 850 },
    { date: "第2周", count: 920 },
    { date: "第3周", count: 780 },
    { date: "第4周", count: 950 }
  ],
  monthly: [
    { date: "9月", count: 3200 },
    { date: "10月", count: 3800 },
    { date: "11月", count: 4200 }
  ]
}

// 活跃工作流数和工作流调用次数的模拟数据
export const mockActiveSkillsChartData = {
  daily: [
    { date: "11-01", activeSkills: 85, skillCalls: 450, activeAgents: 65, agentCalls: 320 },
    { date: "11-02", activeSkills: 92, skillCalls: 520, activeAgents: 72, agentCalls: 380 },
    { date: "11-03", activeSkills: 78, skillCalls: 380, activeAgents: 60, agentCalls: 290 },
    { date: "11-04", activeSkills: 95, skillCalls: 580, activeAgents: 78, agentCalls: 420 },
    { date: "11-05", activeSkills: 88, skillCalls: 490, activeAgents: 70, agentCalls: 350 },
    { date: "11-06", activeSkills: 105, skillCalls: 620, activeAgents: 85, agentCalls: 480 },
    { date: "11-07", activeSkills: 96, skillCalls: 540, activeAgents: 80, agentCalls: 410 }
  ],
  weekly: [
    { date: "第1周", activeSkills: 600, skillCalls: 3200, activeAgents: 480, agentCalls: 2200 },
    { date: "第2周", activeSkills: 650, skillCalls: 3800, activeAgents: 520, agentCalls: 2600 },
    { date: "第3周", activeSkills: 580, skillCalls: 2900, activeAgents: 460, agentCalls: 2000 },
    { date: "第4周", activeSkills: 720, skillCalls: 4500, activeAgents: 580, agentCalls: 3000 }
  ],
  monthly: [
    { date: "9月", activeSkills: 2500, skillCalls: 15000, activeAgents: 2000, agentCalls: 10000 },
    { date: "10月", activeSkills: 2800, skillCalls: 18000, activeAgents: 2200, agentCalls: 12000 },
    { date: "11月", activeSkills: 3200, skillCalls: 22000, activeAgents: 2500, agentCalls: 15000 }
  ]
}

// 知识库数据量的模拟数据
export const mockKnowledgeBaseChartData = {
  daily: [
    { date: "11-01", documentKB: 1200, qaKB: 850, structuredKB: 450 },
    { date: "11-02", documentKB: 1250, qaKB: 880, structuredKB: 480 },
    { date: "11-03", documentKB: 1180, qaKB: 820, structuredKB: 420 },
    { date: "11-04", documentKB: 1300, qaKB: 920, structuredKB: 520 },
    { date: "11-05", documentKB: 1220, qaKB: 860, structuredKB: 460 },
    { date: "11-06", documentKB: 1350, qaKB: 950, structuredKB: 550 },
    { date: "11-07", documentKB: 1280, qaKB: 900, structuredKB: 500 }
  ],
  weekly: [
    { date: "第1周", documentKB: 8500, qaKB: 6000, structuredKB: 3200 },
    { date: "第2周", documentKB: 9200, qaKB: 6500, structuredKB: 3800 },
    { date: "第3周", documentKB: 7800, qaKB: 5500, structuredKB: 2900 },
    { date: "第4周", documentKB: 9500, qaKB: 6800, structuredKB: 4500 }
  ],
  monthly: [
    { date: "9月", documentKB: 32000, qaKB: 22000, structuredKB: 15000 },
    { date: "10月", documentKB: 38000, qaKB: 26000, structuredKB: 18000 },
    { date: "11月", documentKB: 42000, qaKB: 30000, structuredKB: 22000 }
  ]
}

// 大模型调用次数的模拟数据
export const mockModelCallsChartData = {
  daily: [
    { date: "11-01", modelCalls: 1200 },
    { date: "11-02", modelCalls: 1350 },
    { date: "11-03", modelCalls: 1100 },
    { date: "11-04", modelCalls: 1450 },
    { date: "11-05", modelCalls: 1300 },
    { date: "11-06", modelCalls: 1550 },
    { date: "11-07", modelCalls: 1400 }
  ],
  weekly: [
    { date: "第1周", modelCalls: 8500 },
    { date: "第2周", modelCalls: 9200 },
    { date: "第3周", modelCalls: 7800 },
    { date: "第4周", modelCalls: 9500 }
  ],
  monthly: [
    { date: "9月", modelCalls: 32000 },
    { date: "10月", modelCalls: 38000 },
    { date: "11月", modelCalls: 42000 }
  ]
}
