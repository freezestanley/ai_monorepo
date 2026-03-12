import dayjs from "dayjs"

/**
 * 调整查询时间范围以符合接口限制
 * 1. T+1 数据限制：如果结束时间包含今天，则截断到昨天
 * 2. 最多7天限制：如果时间范围超过7天，则调整为最近7天
 *
 * @param {string|Date|dayjs.Dayjs} startTime - 开始时间
 * @param {string|Date|dayjs.Dayjs} endTime - 结束时间
 * @returns {Object} 调整后的时间范围
 * @returns {dayjs.Dayjs} returns.adjustedStartTime - 调整后的开始时间
 * @returns {dayjs.Dayjs} returns.adjustedEndTime - 调整后的结束时间
 * @returns {boolean} returns.isValid - 时间范围是否有效
 * @returns {string} returns.errorMsg - 错误信息（如果无效）
 */
export function adjustQueryDateRange(startTime, endTime) {
  const today = dayjs().startOf("day")
  let queryEndTime = dayjs(endTime).startOf("day")
  let queryStartTime = dayjs(startTime).startOf("day")

  // 步骤1: 如果结束时间是今天或之后，则截断到昨天（T+1数据限制）
  if (queryEndTime.isAfter(today) || queryEndTime.isSame(today)) {
    queryEndTime = today.subtract(1, "day")
  }

  // 步骤2: 检查时间范围是否超过7天
  const daysDiff = queryEndTime.diff(queryStartTime, "day")
  if (daysDiff > 6) {
    // 超过7天，调整为最近7天（从结束时间往前推6天）
    queryStartTime = queryEndTime.subtract(6, "day")
  }

  // 验证调整后的时间范围
  if (queryEndTime.isBefore(queryStartTime)) {
    return {
      adjustedStartTime: queryStartTime,
      adjustedEndTime: queryEndTime,
      isValid: false,
      errorMsg: "查询时间范围无效，请选择今天之前的日期"
    }
  }

  return {
    adjustedStartTime: queryStartTime,
    adjustedEndTime: queryEndTime,
    isValid: true,
    errorMsg: null
  }
}
