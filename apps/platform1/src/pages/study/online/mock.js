export const mockStudyTaskList = {
  data: {
    pageSize: 10,
    pageNum: 1,
    totalCount: 5,
    realTotal: 5,
    list: [
      {
        botNo: "bot_001",
        taskNo: "TASK_20240301_001",
        status: 1,
        name: "客服话术优化任务",
        gmtCreated: "2024-03-01 10:00:00",
        gmtModified: "2024-03-01 15:30:00",
        creator: "张三",
        modifier: "李四",
        autoOptimizeEnabled: 1,
        autoOptimizeConfig: {
          logicalOperator: "AND",
          conditions: [
            {
              conditionType: "basic",
              action: "filter",
              key: "score",
              operator: "GREATER_THAN",
              value: 80
            }
          ]
        },
        intelligentOptimizeEnabled: 1,
        intelligentOptimizeConfig: {
          skillNo: "SKILL_001"
        }
      },
      {
        botNo: "bot_001",
        taskNo: "TASK_20240301_002",
        status: 0,
        name: "销售话术优化任务",
        gmtCreated: "2024-03-01 11:00:00",
        gmtModified: "2024-03-01 16:30:00",
        creator: "王五",
        modifier: "赵六",
        autoOptimizeEnabled: 0,
        autoOptimizeConfig: {
          logicalOperator: "OR",
          conditions: []
        },
        intelligentOptimizeEnabled: 0,
        intelligentOptimizeConfig: {
          skillNo: "SKILL_002"
        }
      },
      {
        botNo: "bot_001",
        taskNo: "TASK_20240301_003",
        status: 1,
        name: "投诉处理优化任务",
        gmtCreated: "2024-03-01 12:00:00",
        gmtModified: "2024-03-01 17:30:00",
        creator: "小明",
        modifier: "小红",
        autoOptimizeEnabled: 1,
        autoOptimizeConfig: {
          logicalOperator: "AND",
          conditions: []
        },
        intelligentOptimizeEnabled: 1,
        intelligentOptimizeConfig: {
          skillNo: "SKILL_003"
        }
      },
      {
        botNo: "bot_001",
        taskNo: "TASK_20240301_004",
        status: 0,
        name: "业务咨询优化任务",
        gmtCreated: "2024-03-01 13:00:00",
        gmtModified: "2024-03-01 18:30:00",
        creator: "小张",
        modifier: "小李",
        autoOptimizeEnabled: 0,
        autoOptimizeConfig: {
          logicalOperator: "AND",
          conditions: []
        },
        intelligentOptimizeEnabled: 0,
        intelligentOptimizeConfig: {
          skillNo: "SKILL_004"
        }
      },
      {
        botNo: "bot_001",
        taskNo: "TASK_20240301_005",
        status: 1,
        name: "产品介绍优化任务",
        gmtCreated: "2024-03-01 14:00:00",
        gmtModified: "2024-03-01 19:30:00",
        creator: "小王",
        modifier: "小赵",
        autoOptimizeEnabled: 1,
        autoOptimizeConfig: {
          logicalOperator: "OR",
          conditions: []
        },
        intelligentOptimizeEnabled: 1,
        intelligentOptimizeConfig: {
          skillNo: "SKILL_005"
        }
      }
    ]
  },
  code: "200",
  success: true,
  message: "success",
  serverTime: 1709280000000,
  sessionId: "SESSION_001",
  requestId: "REQ_001",
  additions: {},
  traceId: "TRACE_001"
}

export const mockTaskDetail = {
  data: {
    botNo: "bot_001",
    taskNo: "TASK_20240301_001",
    status: 1,
    name: "客服话术优化任务",
    gmtCreated: "2024-03-01 10:00:00",
    gmtModified: "2024-03-01 15:30:00",
    creator: "张三",
    modifier: "李四",
    autoOptimizeEnabled: 1,
    autoOptimizeConfig: {
      logicalOperator: "AND",
      conditions: [
        {
          conditionType: "basic",
          action: "filter",
          key: "score",
          operator: "GREATER_THAN",
          value: 80
        }
      ]
    },
    intelligentOptimizeEnabled: 1,
    intelligentOptimizeConfig: {
      skillNo: "SKILL_001"
    }
  },
  code: "200",
  success: true,
  message: "success"
}
