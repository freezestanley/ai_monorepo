/**
 * 最近使用任务记录管理工具
 */

const MAX_RECENT_TASKS = 10 // 最多记录10个最近使用的任务

interface RecentTask {
  taskId: string
  usingCount: number
}

type TaskKeyType = "overview" | "optimization"

/**
 * 生成存储key，结合 taskKey 和 botNo
 */
const getStorageKey = (taskKey: TaskKeyType, botNo: string): string => {
  if (!botNo) return taskKey
  return `${taskKey}_${botNo}`
}

/**
 * 获取最近使用的任务ID列表
 */
export const getRecentTasks = (taskKey: TaskKeyType, botNo: string): string[] => {
  try {
    const storageKey = getStorageKey(taskKey, botNo)
    const stored = localStorage.getItem(storageKey)
    if (!stored) return []

    const tasks: RecentTask[] = JSON.parse(stored)
    // 返回任务ID列表
    return tasks.map((task) => task.taskId)
  } catch (error) {
    console.error("获取最近使用任务失败:", error)
    return []
  }
}

/**
 * 记录任务使用次数
 */
export const recordTaskUsage = (taskKey: TaskKeyType, taskId: string, botNo: string): void => {
  if (!taskId) return

  try {
    const storageKey = getStorageKey(taskKey, botNo)
    const stored = localStorage.getItem(storageKey)
    let tasks: RecentTask[] = stored ? JSON.parse(stored) : []

    const existingTask = tasks.find((task) => task.taskId === taskId)
    if (existingTask) {
      // 已存在，加次数
      existingTask.usingCount++
    } else {
      // 不存在，添加新记录
      tasks.unshift({
        taskId,
        usingCount: 1
      })
    }

    // 按使用次数降序排序，只保留最热门的N条记录
    tasks = tasks.sort((a, b) => b.usingCount - a.usingCount).slice(0, MAX_RECENT_TASKS)

    localStorage.setItem(storageKey, JSON.stringify(tasks))
  } catch (error) {
    console.error("记录任务使用失败:", error)
  }
}

/**
 * 根据最近使用记录对任务列表排序
 */
export const sortTaskListByRecent = <T extends { value: string }>(
  taskKey: TaskKeyType,
  taskList: T[],
  botNo: string
): T[] => {
  if (!taskList || taskList.length === 0) return []

  const recentTaskIds = getRecentTasks(taskKey, botNo)
  if (recentTaskIds.length === 0) return taskList

  // 将任务分为最近使用和其他两组
  const recentTasks: T[] = []

  // 创建一个Map来快速操作任务
  const taskMap = new Map<string, T>()
  taskList.forEach((task) => {
    taskMap.set(task.value, task)
  })

  // 先按最近高频使用顺序添加任务
  recentTaskIds.forEach((taskId) => {
    const task = taskMap.get(taskId)
    if (task) {
      recentTasks.push(task)
      taskMap.delete(taskId) // 从map中移除已处理的任务
    }
  })

  // 剩余的任务直接从map转换
  const otherTasks = Array.from(taskMap.values())

  return [...recentTasks, ...otherTasks]
}
